"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import RichTextEditor from "@/components/shared/RichTextEditor";
import LocationPicker, {
  SelectedLocation,
} from "@/components/shared/LocationPicker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateEventAsAdminAction } from "@/actions/ActivityEdit";

type DayDraft = {
  dayNumber: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
};

type TierDraft = {
  eventTicketTypeId?: string;
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
  /** Read-only, from the server. What makes a tier un-shrinkable and un-deletable. */
  quantitySold: number;
};

/** "2026-04-18T00:00:00.000Z" and "2026-04-18" both have to reach the date input as "2026-04-18". */
function toDateInput(value: string): string {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

/** The API stores "19:30:00"; <input type="time"> wants "19:30". */
function toTimeInput(value: string): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export default function EditActivityForm({ event }: { event: Event }) {
  const t = useTranslations("Activities.edit");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const isOnline = event.eventCategory === "meet";

  const ticketsSold = useMemo(
    () =>
      (event.eventTicketTypes ?? []).reduce(
        (sum, tier) => sum + (tier.ticketTypeQuantitySold ?? 0),
        0,
      ),
    [event.eventTicketTypes],
  );

  const [eventName, setEventName] = useState(event.eventName ?? "");
  const [eventDescription, setEventDescription] = useState(
    event.eventDescription ?? "",
  );
  const [address, setAddress] = useState(event.address ?? "");
  const [city, setCity] = useState(event.city ?? "");
  const [state, setState] = useState(event.state ?? "");
  const [country, setCountry] = useState(event.country ?? "");
  const [location, setLocation] = useState<SelectedLocation | null>(
    event.location ?? null,
  );
  const [tags, setTags] = useState((event.activityTags ?? []).join(", "));
  const [isPrivate, setIsPrivate] = useState(Boolean(event.isPrivate));
  const [absorbFees, setAbsorbFees] = useState(Boolean(event.absorbFees));
  /**
   * Stored per ticket tier rather than on the event, but the API applies one
   * value to all of them — so the form reads the first tier and offers a single
   * switch, which is the shape the data actually has.
   */
  const [isRefundable, setIsRefundable] = useState(
    event.eventTicketTypes?.[0]?.isRefundable ?? true,
  );
  const [ticketSalesEndAt, setTicketSalesEndAt] = useState(
    event.ticketSalesEndAt ? event.ticketSalesEndAt.slice(0, 16) : "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [days, setDays] = useState<DayDraft[]>(() =>
    (event.eventDays ?? [])
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((day) => ({
        dayNumber: day.dayNumber,
        eventDate: toDateInput(day.eventDate),
        startTime: toTimeInput(day.startTime),
        endTime: toTimeInput(day.endTime),
        timezone: day.timezone,
      })),
  );

  const [tiers, setTiers] = useState<TierDraft[]>(() =>
    (event.eventTicketTypes ?? []).map((tier) => ({
      eventTicketTypeId: tier.eventTicketTypeId,
      ticketTypeName: tier.ticketTypeName,
      ticketTypeDescription: tier.ticketTypeDescription,
      ticketTypePrice: String(tier.ticketTypePrice ?? 0),
      ticketTypeQuantity: String(tier.ticketTypeQuantity ?? 0),
      quantitySold: tier.ticketTypeQuantitySold ?? 0,
    })),
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /**
   * What the admin is about to change that a buyer would notice. Computed for
   * the confirmation step, and mirrors the API's own list — the API decides,
   * this only warns before the request rather than after it.
   */
  const materialChanges = useMemo(() => {
    const firstDay = (event.eventDays ?? []).find((d) => d.dayNumber === 1);
    const newFirst = days.find((d) => d.dayNumber === 1);
    const dateMoved =
      firstDay && newFirst
        ? toDateInput(firstDay.eventDate) !== newFirst.eventDate ||
          toTimeInput(firstDay.startTime) !== newFirst.startTime
        : false;

    return [
      eventName !== event.eventName && t("changes.name"),
      eventDescription !== event.eventDescription && t("changes.description"),
      Boolean(imageFile) && t("changes.image"),
      !isOnline && address !== (event.address ?? "") && t("changes.venue"),
      dateMoved && t("changes.date"),
    ].filter(Boolean) as string[];
  }, [
    eventName,
    eventDescription,
    imageFile,
    address,
    days,
    event,
    isOnline,
    t,
  ]);

  const willNotifyBuyers = ticketsSold > 0 && materialChanges.length > 0;

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    );
  }

  function addDay() {
    setDays((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          dayNumber: prev.length + 1,
          eventDate: last?.eventDate ?? "",
          startTime: last?.startTime ?? "18:00",
          endTime: last?.endTime ?? "22:00",
          // A new day inherits the zone of the ones around it. An event does
          // not move country between its days, and asking would be a question
          // with one sensible answer.
          timezone:
            last?.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone ??
            "America/Port-au-Prince",
        },
      ];
    });
  }

  function removeDay(index: number) {
    setDays((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((day, i) => ({ ...day, dayNumber: i + 1 })),
    );
  }

  function updateTier(index: number, patch: Partial<TierDraft>) {
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        ticketTypeName: "",
        ticketTypeDescription: "",
        // A new tier on a paid activity must not be free and vice versa — the
        // API refuses a change to the free/paid shape, so the default follows
        // what the activity already is.
        ticketTypePrice: event.isFree ? "0" : "",
        ticketTypeQuantity: "",
        quantitySold: 0,
      },
    ]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * The checks worth doing before a round trip. Deliberately NOT a second copy
   * of the API's rules — the money guards (currency freeze, free/paid shape,
   * tier policy) live there and only there. These are the ones whose failure
   * the admin can see and fix on the spot.
   */
  function localProblems(): string[] {
    const problems: string[] = [];
    if (eventName.trim().length < 3) problems.push(t("errors.name"));
    if (eventDescription.trim().length < 150)
      problems.push(t("errors.description", { count: eventDescription.length }));
    if (!isOnline && !address.trim()) problems.push(t("errors.address"));
    if (days.length === 0) problems.push(t("errors.days"));
    if (days.some((d) => !d.eventDate || !d.startTime || !d.endTime))
      problems.push(t("errors.day_incomplete"));
    if (tiers.length === 0) problems.push(t("errors.tiers"));
    for (const tier of tiers) {
      if (!tier.ticketTypeName.trim()) problems.push(t("errors.tier_name"));
      if (tier.ticketTypeDescription.trim().length < 20)
        problems.push(
          t("errors.tier_description", { name: tier.ticketTypeName || "—" }),
        );
      const quantity = Number(tier.ticketTypeQuantity);
      if (!Number.isFinite(quantity) || quantity <= 0)
        problems.push(t("errors.tier_quantity", { name: tier.ticketTypeName }));
      // Capacity below what is already sold would leave buyers holding tickets
      // the activity says do not exist.
      if (quantity < tier.quantitySold)
        problems.push(
          t("errors.tier_below_sold", {
            name: tier.ticketTypeName,
            sold: tier.quantitySold,
          }),
        );
    }
    return problems;
  }

  function handleSubmitClick() {
    const problems = localProblems();
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmedSave() {
    setConfirmOpen(false);
    setIsSaving(true);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("eventName", eventName.trim());
    formData.append("eventDescription", eventDescription);
    if (!isOnline) {
      formData.append("address", address.trim());
      formData.append("city", city.trim());
      formData.append("state", state.trim());
      formData.append("country", country.trim());
      if (location) formData.append("location", JSON.stringify(location));
    }
    formData.append(
      "activityTags",
      JSON.stringify(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
    formData.append("eventCurrency", event.currency);
    /**
     * Sent from the event's own value, never hardcoded. `applyEventEdit` writes
     * this onto EVERY ticket tier it rebuilds, so a fixed `true` here would
     * silently make a non-refundable activity refundable on the first admin
     * edit — a change to the deal every existing buyer agreed to.
     */
    formData.append("isRefundable", JSON.stringify(isRefundable));
    formData.append("isPrivate", JSON.stringify(isPrivate));
    formData.append("absorbFees", JSON.stringify(absorbFees));
    if (ticketSalesEndAt) formData.append("ticketSalesEndAt", ticketSalesEndAt);
    if (imageFile) formData.append("eventImage", imageFile);

    formData.append(
      "eventDays",
      JSON.stringify(
        days.map((day, index) => ({
          dayNumber: index + 1,
          eventDate: day.eventDate,
          startTime: day.startTime,
          endTime: day.endTime,
          timezone: day.timezone,
        })),
      ),
    );

    formData.append(
      "ticketTypes",
      JSON.stringify(
        tiers.map((tier) => ({
          ...(tier.eventTicketTypeId
            ? { eventTicketTypeId: tier.eventTicketTypeId }
            : {}),
          ticketTypeName: tier.ticketTypeName.trim(),
          ticketTypeDescription: tier.ticketTypeDescription.trim(),
          ticketTypePrice: Number(tier.ticketTypePrice || 0),
          ticketTypeQuantity: Number(tier.ticketTypeQuantity || 0),
        })),
      ),
    );

    try {
      const result = await UpdateEventAsAdminAction({
        eventId: event.eventId,
        formData,
        accessToken: session?.user.accessToken ?? "",
        locale,
      });

      if ("error" in result) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }

      toast.success(
        result.refundWindowOpened
          ? t("saved_with_refund_window")
          : t("saved"),
      );
      if (result.calendarSyncFailed) toast.warning(t("calendar_sync_failed"));
      if (result.supersededRevisions > 0)
        toast.info(
          t("superseded", { count: result.supersededRevisions }),
        );

      router.push(`/activities/${event.eventId}`);
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "w-full bg-neutral-100 rounded-[1.4rem] px-6 py-4 text-[1.5rem] leading-8 text-deep-100 outline-none border-2 border-transparent focus:border-primary-500 transition-colors";
  const labelClass =
    "text-[1.3rem] font-medium leading-8 text-neutral-700 pb-2 block";

  function ErrorText({ field }: { field: string }) {
    if (!fieldErrors[field]) return null;
    return (
      <p className="text-[1.2rem] leading-6 text-failure pt-1">
        {fieldErrors[field]}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto">
      <BackButton text={t("back")} />

      <div className="flex flex-col gap-2">
        <h2 className="font-primary leading-12 font-medium text-[2.6rem]">
          {t("title")}
        </h2>
        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("subtitle", { name: event.eventName })}
        </p>
      </div>

      {/* The two things that make an edit here different from an organiser's,
          said before the admin starts typing rather than in a toast after. */}
      <div className="rounded-[1.4rem] bg-orange-50 border border-orange-200 p-6 flex flex-col gap-2">
        <p className="text-[1.4rem] leading-8 text-orange-700 font-medium">
          {t("notice.title")}
        </p>
        <p className="text-[1.3rem] leading-8 text-orange-700">
          {ticketsSold > 0
            ? t("notice.with_sales", { count: ticketsSold })
            : t("notice.no_sales")}
        </p>
      </div>

      {/* ── Details ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <h3 className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {t("sections.details")}
        </h3>

        <div>
          <label className={labelClass} htmlFor="eventName">
            {t("fields.name")}
          </label>
          <input
            id="eventName"
            className={inputClass}
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <ErrorText field="eventName" />
        </div>

        {/* The same editor the organiser writes the description in. It has to
            be: the activity page renders this field as HTML
            (`dangerouslySetInnerHTML` on `.rich-text`), so a plain textarea
            here meant an admin editing a formatted description flattened it to
            markup they then had to hand-edit. The counter is the editor's own —
            it counts text, while the 150/3000 limit the API enforces is on the
            HTML, which is the same pair the organiser form shows. */}
        <div>
          <label className={labelClass} htmlFor="eventDescription">
            {t("fields.description")}
          </label>
          <RichTextEditor
            value={eventDescription}
            onChange={setEventDescription}
            placeholder={t("fields.description_placeholder")}
            error={fieldErrors.eventDescription}
            minChars={150}
            maxChars={3000}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="tags">
            {t("fields.tags")}
          </label>
          <input
            id="tags"
            className={inputClass}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("fields.tags_placeholder")}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="eventImage">
            {t("fields.image")}
          </label>
          <input
            id="eventImage"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-[1.4rem] text-neutral-700 cursor-pointer"
          />
          <p className="text-[1.2rem] leading-6 text-neutral-500 pt-1">
            {imageFile ? t("fields.image_new") : t("fields.image_keep")}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 accent-primary-500 cursor-pointer"
            />
            <span className="text-[1.4rem] leading-8 text-neutral-700">
              {t("fields.is_private")}
            </span>
          </label>

          {!event.isFree && (
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={absorbFees}
                onChange={(e) => setAbsorbFees(e.target.checked)}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
              <span className="text-[1.4rem] leading-8 text-neutral-700">
                {t("fields.absorb_fees")}
              </span>
            </label>
          )}

          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isRefundable}
              onChange={(e) => setIsRefundable(e.target.checked)}
              className="w-5 h-5 accent-primary-500 cursor-pointer"
            />
            <span className="text-[1.4rem] leading-8 text-neutral-700">
              {t("fields.is_refundable")}
            </span>
          </label>
        </div>
      </section>

      <Separator />

      {/* ── Venue ───────────────────────────────────────────────── */}
      {!isOnline && (
        <>
          <section className="flex flex-col gap-6">
            <h3 className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("sections.venue")}
            </h3>

            <div>
              <label className={labelClass} htmlFor="address">
                {t("fields.address")}
              </label>
              <input
                id="address"
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <ErrorText field="address" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className={labelClass} htmlFor="city">
                  {t("fields.city")}
                </label>
                <input
                  id="city"
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="state">
                  {t("fields.state")}
                </label>
                <input
                  id="state"
                  className={inputClass}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="country">
                  {t("fields.country")}
                </label>
                <input
                  id="country"
                  className={inputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>

            <div>
              <span className={labelClass}>{t("fields.map")}</span>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </section>

          <Separator />
        </>
      )}

      {/* ── Schedule ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("sections.schedule")}
          </h3>
          <button
            type="button"
            onClick={addDay}
            className="text-[1.3rem] leading-8 text-primary-500 font-medium cursor-pointer"
          >
            {t("actions.add_day")}
          </button>
        </div>

        {days.map((day, index) => (
          <div
            key={index}
            className="rounded-[1.4rem] border border-neutral-200 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[1.3rem] font-medium text-neutral-700">
                {t("fields.day", { number: index + 1 })}
              </span>
              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(index)}
                  className="text-[1.3rem] text-failure cursor-pointer"
                >
                  {t("actions.remove")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{t("fields.date")}</label>
                <input
                  type="date"
                  className={inputClass}
                  value={day.eventDate}
                  onChange={(e) =>
                    updateDay(index, { eventDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>{t("fields.start_time")}</label>
                <input
                  type="time"
                  className={inputClass}
                  value={day.startTime}
                  onChange={(e) =>
                    updateDay(index, { startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>{t("fields.end_time")}</label>
                <input
                  type="time"
                  className={inputClass}
                  value={day.endTime}
                  onChange={(e) => updateDay(index, { endTime: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("fields.timezone")}</label>
                <input
                  className={inputClass}
                  value={day.timezone}
                  onChange={(e) =>
                    updateDay(index, { timezone: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <Separator />

      {/* ── Tickets ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("sections.tickets", { currency: event.currency })}
          </h3>
          <button
            type="button"
            onClick={addTier}
            className="text-[1.3rem] leading-8 text-primary-500 font-medium cursor-pointer"
          >
            {t("actions.add_tier")}
          </button>
        </div>

        {ticketsSold > 0 && (
          <p className="text-[1.3rem] leading-8 text-neutral-600">
            {t("tickets_frozen", { currency: event.currency })}
          </p>
        )}

        {tiers.map((tier, index) => (
          <div
            key={tier.eventTicketTypeId ?? `new-${index}`}
            className="rounded-[1.4rem] border border-neutral-200 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[1.3rem] font-medium text-neutral-700">
                {tier.quantitySold > 0
                  ? t("fields.tier_sold", { sold: tier.quantitySold })
                  : t("fields.tier_unsold")}
              </span>
              {/* A tier with sales cannot be removed: the rebuild would drop the
                  row those tickets point at. */}
              {tier.quantitySold === 0 && tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="text-[1.3rem] text-failure cursor-pointer"
                >
                  {t("actions.remove")}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("fields.tier_name")}</label>
                <input
                  className={inputClass}
                  value={tier.ticketTypeName}
                  onChange={(e) =>
                    updateTier(index, { ticketTypeName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("fields.tier_price", { currency: event.currency })}
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={tier.ticketTypePrice}
                  onChange={(e) =>
                    updateTier(index, { ticketTypePrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {t("fields.tier_description")}
              </label>
              <input
                className={inputClass}
                value={tier.ticketTypeDescription}
                onChange={(e) =>
                  updateTier(index, { ticketTypeDescription: e.target.value })
                }
              />
              <p className="text-[1.2rem] leading-6 text-neutral-500 pt-1">
                {t("fields.tier_description_hint", {
                  count: tier.ticketTypeDescription.length,
                })}
              </p>
            </div>

            <div>
              <label className={labelClass}>{t("fields.tier_quantity")}</label>
              <input
                type="number"
                min={tier.quantitySold}
                className={inputClass}
                value={tier.ticketTypeQuantity}
                onChange={(e) =>
                  updateTier(index, { ticketTypeQuantity: e.target.value })
                }
              />
            </div>
          </div>
        ))}

        <div>
          <label className={labelClass} htmlFor="ticketSalesEndAt">
            {t("fields.sales_end")}
          </label>
          <input
            id="ticketSalesEndAt"
            type="datetime-local"
            className={inputClass}
            value={ticketSalesEndAt}
            onChange={(e) => setTicketSalesEndAt(e.target.value)}
          />
          <p className="text-[1.2rem] leading-6 text-neutral-500 pt-1">
            {t("fields.sales_end_hint")}
          </p>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-16">
        <ButtonNeutral
          className="w-full lg:flex-1"
          onClick={() => router.push(`/activities/${event.eventId}`)}
        >
          {t("actions.cancel")}
        </ButtonNeutral>
        <ButtonPrimary
          className="w-full lg:flex-1"
          disabled={isSaving}
          onClick={handleSubmitClick}
        >
          {isSaving ? <LoadingCircleSmall /> : t("actions.save")}
        </ButtonPrimary>
      </div>

      {/* The edit goes live the moment this is confirmed — there is no review
          step behind an admin — so the consequences are spelled out first. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2rem] leading-10 text-black">
            {t("confirm.title")}
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <p className="text-[1.4rem] leading-8 text-neutral-600">
              {t("confirm.body", { name: event.eventName })}
            </p>
            {materialChanges.length > 0 && (
              <div className="rounded-[1.2rem] bg-neutral-100 p-4">
                <p className="text-[1.3rem] leading-8 text-neutral-700 font-medium">
                  {t("confirm.changing")}
                </p>
                <ul className="list-disc pl-8">
                  {materialChanges.map((change) => (
                    <li
                      key={change}
                      className="text-[1.3rem] leading-8 text-neutral-600"
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {willNotifyBuyers && (
              <p className="text-[1.3rem] leading-8 text-orange-700">
                {t("confirm.buyers", { count: ticketsSold })}
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-6 pt-8">
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">
                {t("actions.cancel")}
              </ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={isSaving}
              onClick={handleConfirmedSave}
            >
              {isSaving ? <LoadingCircleSmall /> : t("confirm.cta")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
