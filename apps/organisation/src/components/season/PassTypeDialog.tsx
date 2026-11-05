"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModalShell from "@/components/shared/ModalShell";
import { Input, TextArea } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import TeamCrest from "@/components/season/TeamCrest";
import { DeletePassType, SavePassType } from "@/actions/SeasonActions";
import { useRouter } from "@/i18n/navigation";
import { eventStartsAt } from "@/lib/eventTime";
import { SeasonMatch, SeasonPassType } from "@ticketwaze/typescript-config";

const selectTriggerClass =
  "bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[5rem] shadow-none focus-visible:ring-0 px-6 text-[1.4rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600";

/**
 * Create or edit a season pass type: what it is, what it costs, how many,
 * and — for every match still to play — which of that match's ticket types
 * its holders sit in. The API checks every mapping has room and refuses the
 * whole save otherwise, so nothing is half-applied.
 */
export default function PassTypeDialog({
  open,
  onOpenChange,
  seasonId,
  matches,
  passType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonId: string;
  /** Matches still to play and not cancelled: the ones a pass must seat at. */
  matches: SeasonMatch[];
  passType?: SeasonPassType;
}) {
  const t = useTranslations("Events.season.passes");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisationId = session?.activeOrganisation?.organisationId;

  const [name, setName] = useState(passType?.name ?? "");
  const [description, setDescription] = useState(passType?.description ?? "");
  const [currency, setCurrency] = useState<"HTG" | "USD">(
    passType?.currency ?? "HTG",
  );
  const [price, setPrice] = useState(
    passType
      ? String(passType.currency === "USD" ? passType.usdPrice : passType.price)
      : "",
  );
  const [quantity, setQuantity] = useState(
    passType ? String(passType.quantity) : "",
  );
  // Current mapping per match, or the first ticket type for a new one.
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      matches.map((m) => [
        m.eventId,
        passType?.mappings.find((x) => x.eventId === m.eventId)
          ?.eventTicketTypeId ??
          m.event.eventTicketTypes?.[0]?.eventTicketTypeId ??
          "",
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const sold = passType?.quantitySold ?? 0;

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("errors.name");
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0)
      next.price = t("errors.price");
    const quantityNumber = Number(quantity);
    if (!Number.isInteger(quantityNumber) || quantityNumber < 1)
      next.quantity = t("errors.quantity");
    else if (quantityNumber < sold)
      next.quantity = t("errors.quantity_below_sold", { sold });
    for (const m of matches) {
      if (!mapping[m.eventId]) next[m.eventId] = t("errors.mapping");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!organisationId || !validate()) return;
    setSaving(true);
    const result = await SavePassType(
      organisationId,
      seasonId,
      {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        currency,
        quantity: Number(quantity),
        mappings: matches.map((m) => ({
          eventId: m.eventId,
          eventTicketTypeId: mapping[m.eventId]!,
        })),
      },
      locale,
      passType?.seasonPassTypeId,
    );
    setSaving(false);
    if (result.status !== "success") {
      const details = (result as { details?: Record<string, unknown> }).details;
      const eventId = details?.eventId as string | undefined;
      const message =
        result.code === "NOT_ENOUGH_SEATS"
          ? t("errors.not_enough_seats", {
              left: Number(details?.seatsLeft ?? 0),
              needed: Number(details?.seatsNeeded ?? sold),
            })
          : result.code === "MAPPING_MISSING"
            ? t("errors.mapping")
            : result.error;
      if (eventId) setErrors((e) => ({ ...e, [eventId]: message }));
      toast.error(message);
      return;
    }
    toast.success(passType ? t("saved") : t("created"));
    onOpenChange(false);
    router.refresh();
  }

  async function remove() {
    if (!organisationId || !passType) return;
    setSaving(true);
    const result = await DeletePassType(
      organisationId,
      seasonId,
      passType.seasonPassTypeId,
      locale,
    );
    setSaving(false);
    if (result.status !== "success") {
      toast.error(
        result.code === "HAS_SALES" ? t("errors.has_sales") : result.error,
      );
      return;
    }
    toast.success(t("deleted"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalShell
        title={passType ? t("edit_title") : t("create_title")}
        className="lg:w-[60rem] max-w-[60rem]"
      >
        <div className="w-full flex flex-col gap-6">
          <Input
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          >
            {t("name")}
          </Input>
          <TextArea
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            className="[&_textarea]:min-h-[10rem]"
          >
            {t("description")}
          </TextArea>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex gap-4 flex-1">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
                className="flex-1"
              >
                {t("price")}
              </Input>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as "HTG" | "USD")}
              >
                <SelectTrigger
                  className={`${selectTriggerClass} w-[10rem] data-[size=default]:h-[6rem]`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["HTG", "USD"] as const).map((c) => (
                    <SelectItem key={c} value={c} className="text-[1.4rem]">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={Math.max(1, sold)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={errors.quantity}
              className="flex-1"
            >
              {t("quantity")}
            </Input>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-primary font-medium text-[1.7rem] leading-8 text-deep-100">
              {t("mapping_title")}
            </p>
            <p className="text-[1.3rem] leading-7 text-neutral-600">
              {sold > 0 ? t("mapping_hint_sold", { sold }) : t("mapping_hint")}
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {matches.map((m) => {
              const starts = eventStartsAt(m.event.eventDays);
              const current = passType?.mappings.find(
                (x) => x.eventId === m.eventId,
              );
              return (
                <li
                  key={m.eventId}
                  className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-[1.5rem] border border-neutral-100 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <TeamCrest
                      name={m.homeTeamName}
                      logoUrl={m.homeTeamLogoUrl}
                      size={28}
                    />
                    <TeamCrest
                      name={m.awayTeamName}
                      logoUrl={m.awayTeamLogoUrl}
                      size={28}
                      className="-ml-4"
                    />
                    <div className="min-w-0">
                      <p className="text-[1.4rem] font-medium leading-7 text-deep-100 truncate">
                        {m.title}
                      </p>
                      <p className="text-[1.2rem] leading-6 text-neutral-600">
                        {starts
                          ? starts
                              .setLocale(locale)
                              .toFormat("ccc d LLL · HH:mm")
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="lg:w-[24rem] shrink-0">
                    <Select
                      value={mapping[m.eventId] || undefined}
                      onValueChange={(v) =>
                        setMapping((prev) => ({ ...prev, [m.eventId]: v }))
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder={t("choose_ticket_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(m.event.eventTicketTypes ?? []).map((tt) => {
                          // Seats this pass already holds there are not "taken" for it.
                          const held =
                            current?.eventTicketTypeId === tt.eventTicketTypeId
                              ? current.seatsReserved
                              : 0;
                          const left =
                            tt.ticketTypeQuantity -
                            tt.ticketTypeQuantitySold +
                            held;
                          return (
                            <SelectItem
                              key={tt.eventTicketTypeId}
                              value={tt.eventTicketTypeId}
                              className="text-[1.4rem]"
                            >
                              {tt.ticketTypeName}{" "}
                              <span className="text-neutral-500">
                                · {t("seats_left", { count: left })}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors[m.eventId] && (
                      <p className="text-[1.2rem] px-6 py-2 text-failure">
                        {errors[m.eventId]}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col-reverse lg:flex-row gap-4 pt-4">
            {passType && sold === 0 && (
              <ButtonRed
                type="button"
                className="lg:w-auto lg:px-10"
                disabled={saving}
                onClick={remove}
              >
                {t("delete")}
              </ButtonRed>
            )}
            <ButtonPrimary
              type="button"
              className="flex-1"
              disabled={saving}
              onClick={save}
            >
              {saving ? t("saving") : passType ? t("save") : t("create")}
            </ButtonPrimary>
          </div>
        </div>
      </ModalShell>
    </Dialog>
  );
}
