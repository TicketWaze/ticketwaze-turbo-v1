"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { TickSquare } from "iconsax-reactjs";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  BundleMatch,
  DeleteMatchBundle,
  GetMatchBundle,
  MatchBundle,
  SaveMatchBundle,
} from "@/actions/SeasonActions";

const selectTriggerClass =
  "bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500";

/**
 * MULTI-MATCH TICKET (2026-11-09), from a match's More menu. One ticket
 * valid at two or more of the organiser's matches: a name, a price, an
 * optional limit, and the matches it covers. Every match in the group opens
 * the same ticket here. Attendees see it as a ticket type in each match's
 * checkout.
 */
export default function MultiMatchTicketDialog({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Events.multi_match");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisationId = session?.activeOrganisation?.organisationId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bundle, setBundle] = useState<MatchBundle | null>(null);
  const [candidates, setCandidates] = useState<BundleMatch[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"HTG" | "USD">("HTG");
  const [quantity, setQuantity] = useState("");
  const [picked, setPicked] = useState<string[]>([eventId]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !organisationId) return;
    // Mounted on first open (MountOnOpen), so `loading` starts true; a
    // reopen refreshes in place.
    let cancelled = false;
    GetMatchBundle(organisationId, eventId, locale).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.status !== "success") {
        toast.error(result.error);
        return;
      }
      const b = result.bundle;
      setBundle(b);
      setCandidates(result.candidates);
      setName(b?.name ?? "");
      setPrice(
        b?.price != null
          ? String(b.currency === "USD" ? b.usdPrice : b.price)
          : "",
      );
      setCurrency(b?.currency ?? "HTG");
      setQuantity(b?.quantity != null ? String(b.quantity) : "");
      setPicked(b ? b.matches.map((m) => m.eventId) : [eventId]);
    });
    return () => {
      cancelled = true;
    };
  }, [open, organisationId, eventId, locale]);

  /** Once a ticket is sold, a match already covered cannot be taken out. */
  const locked = (id: string) =>
    id === eventId ||
    Boolean(
      bundle && bundle.sold > 0 && bundle.matches.some((m) => m.eventId === id),
    );

  function toggle(id: string) {
    if (locked(id)) return;
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  async function save() {
    if (!organisationId) return;
    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = t("errors.name");
    const amount = Number(price);
    if (!price || !Number.isFinite(amount) || amount <= 0)
      found.price = t("errors.price");
    const limit = quantity.trim() === "" ? null : Number(quantity);
    if (limit !== null && (!Number.isInteger(limit) || limit < 1))
      found.quantity = t("errors.quantity");
    if (picked.length < 2) found.matches = t("errors.matches");
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    const result = await SaveMatchBundle(
      organisationId,
      bundle?.seasonId ?? null,
      {
        name: name.trim(),
        price: amount,
        currency,
        quantity: limit,
        eventIds: picked,
      },
      locale,
    );
    setSaving(false);
    if (result.status !== "success") {
      toast.error(result.error);
      return;
    }
    toast.success(t("saved"));
    onOpenChange(false);
    router.refresh();
  }

  async function remove() {
    if (!organisationId || !bundle) return;
    setSaving(true);
    const result = await DeleteMatchBundle(
      organisationId,
      bundle.seasonId,
      locale,
    );
    setSaving(false);
    if (result.status !== "success") {
      toast.error(result.error);
      return;
    }
    toast.success(t("removed"));
    onOpenChange(false);
    router.refresh();
  }

  const when = (iso: string | null) =>
    iso
      ? DateTime.fromISO(iso)
          .setLocale(locale)
          .toLocaleString(DateTime.DATETIME_MED)
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalShell
        title={bundle ? t("title_edit") : t("title")}
        description={t("hint")}
        className="lg:w-[64rem] max-w-[64rem]"
      >
        {loading ? (
          <div className="w-full flex justify-center py-16">
            <LoadingCircleSmall />
          </div>
        ) : (
          <div className="w-full flex flex-col gap-8 pt-8 min-w-0">
            <Input
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            >
              {t("name")}
            </Input>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                >
                  {t("price")}
                </Input>
              </div>
              <div className="lg:w-[16rem]">
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as "HTG" | "USD")}
                >
                  <SelectTrigger
                    className={selectTriggerClass}
                    aria-label={t("currency")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["HTG", "USD"] as const).map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="text-[1.4rem] text-deep-100"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={errors.quantity}
            >
              {t("quantity")}
            </Input>
            {bundle && bundle.sold > 0 && (
              <p className="text-[1.3rem] leading-7 text-neutral-600 -mt-4">
                {t("sold_note", { count: bundle.sold })}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <span className="font-medium text-[1.5rem] text-deep-100">
                {t("matches")}
              </span>
              {candidates.length < 2 && (
                <p className="text-[1.3rem] leading-7 text-neutral-600">
                  {t("need_more")}
                </p>
              )}
              <ul className="flex flex-col gap-3 min-w-0">
                {candidates.map((m) => {
                  const on = picked.includes(m.eventId);
                  return (
                    <li key={m.eventId}>
                      <button
                        type="button"
                        onClick={() => toggle(m.eventId)}
                        disabled={locked(m.eventId)}
                        className={cn(
                          "w-full min-w-0 flex items-center gap-4 rounded-[1.5rem] border p-5 text-left transition-colors",
                          on
                            ? "border-primary-500 bg-primary-50/40"
                            : "border-neutral-100 hover:border-neutral-300",
                          locked(m.eventId) && "cursor-not-allowed",
                        )}
                      >
                        {on ? (
                          <TickSquare
                            size="22"
                            variant="Bold"
                            color="#E45B00"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="size-[2.2rem] shrink-0 rounded-[0.6rem] border-2 border-neutral-300"
                          />
                        )}
                        <span className="flex flex-1 flex-col min-w-0">
                          <span className="text-[1.5rem] text-deep-100 truncate">
                            {m.eventName}
                          </span>
                          <span className="text-[1.3rem] text-neutral-600">
                            {[m.round, when(m.startsAt)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {errors.matches && (
                <span className="text-[1.2rem] px-2 text-failure">
                  {errors.matches}
                </span>
              )}
            </div>

            <div className="flex flex-col-reverse lg:flex-row gap-4">
              {bundle && bundle.sold === 0 && (
                <ButtonRed
                  className="lg:flex-1 whitespace-nowrap"
                  disabled={saving}
                  onClick={remove}
                >
                  {t("remove")}
                </ButtonRed>
              )}
              <DialogClose asChild>
                <ButtonPrimary className="lg:flex-1 bg-neutral-100 text-deep-100 hover:bg-neutral-200">
                  {t("cancel")}
                </ButtonPrimary>
              </DialogClose>
              <ButtonPrimary
                className="lg:flex-1"
                disabled={saving || candidates.length < 2}
                onClick={save}
              >
                {saving ? <LoadingCircleSmall /> : t("save")}
              </ButtonPrimary>
            </div>
          </div>
        )}
      </ModalShell>
    </Dialog>
  );
}
