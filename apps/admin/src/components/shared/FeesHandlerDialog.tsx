"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { InfoCircle, ReceiptDiscount } from "iconsax-reactjs";
import type {
  FeeOverride,
  FeeRoute,
  RouteFeeComponents,
} from "@ticketwaze/typescript-config";
import {
  FEE_GROUPS,
  FEE_GROUP_ROUTE,
  FEE_ROUTES,
  getOverrideUnitFees,
  normalizeFeeRoutes,
  round2,
  type FeeGroup,
} from "@ticketwaze/pricing";
import { formatMoney } from "@ticketwaze/currency";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonBlack, ButtonNeutral } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  GetActivityFeesAction,
  UpdateActivityFeesAction,
  type ActivityFees,
  type FeeActivityKind,
  type RouteQuote,
} from "@/actions/Fees";
import useAdminCan from "@/lib/useAdminCan";
import { cn } from "@/lib/utils";

type Mode = "standard" | "cancelled" | "custom";

/** What the admin is typing: percentages and amounts, as the inputs hold them. */
type ComponentInputs = { service: string; flat: string; processor: string };

/**
 * THREE SCHEDULES, NOT FOUR PROVIDERS.
 *
 * MonCash and NatCash charge the same 2.5% through the same flow and are
 * priced identically by every ordinary schedule, so the handler sets them as
 * one mobile-money group instead of asking for the same three numbers twice.
 * The wallet is its own group because it has no processor fee at all — see
 * `GROUPS_WITH_PROCESSOR`.
 */
const GROUP_LABELS: Record<FeeGroup, string> = {
  mobile: "MonCash / NatCash",
  card: "Card",
  wallet: "Wallet",
};

const GROUP_HINTS: Record<FeeGroup, string> = {
  mobile: "Both mobile-money providers charge these values.",
  card: "Stripe card payments.",
  wallet:
    "A wallet payment moves a Ticketwaze balance, so no processor takes a cut.",
};

/**
 * A WALLET PAYMENT HAS NO PROCESSOR FEE.
 *
 * It moves a balance that is already inside Ticketwaze — there is no MonCash,
 * NatCash or Stripe on the other side to pay. So the wallet group offers a
 * service fee and a flat fee only, and its processor rate is always zero,
 * including when one set of values is shared across every provider.
 */
const GROUPS_WITH_PROCESSOR: Record<FeeGroup, boolean> = {
  mobile: true,
  card: true,
  wallet: false,
};

/** 0.025 → "2.5". Trimmed so a stored fraction does not show as 2.4999999. */
function toPercent(rate: number) {
  return String(round2(rate * 100 * 100) / 100);
}

function toInputs(components: RouteFeeComponents): ComponentInputs {
  return {
    service: toPercent(components.serviceRate),
    flat: String(components.flatFee),
    processor: toPercent(components.processorRate),
  };
}

/** Empty reads as zero; anything else must be a non-negative number. */
function parseAmount(value: string): number | null {
  if (value.trim() === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** A group's typed values as components. The wallet's processor is always 0. */
function toComponents(
  inputs: ComponentInputs,
  group: FeeGroup,
): RouteFeeComponents | null {
  const service = parseAmount(inputs.service);
  const flat = parseAmount(inputs.flat);
  const processor = GROUPS_WITH_PROCESSOR[group]
    ? parseAmount(inputs.processor)
    : 0;
  if (service === null || flat === null || processor === null) return null;
  if (service > 100 || processor > 100) return null;
  return {
    serviceRate: service / 100,
    flatFee: round2(flat),
    processorRate: processor / 100,
  };
}

function eachGroup<T>(make: (group: FeeGroup) => T): Record<FeeGroup, T> {
  return Object.fromEntries(
    FEE_GROUPS.map((group) => [group, make(group)]),
  ) as Record<FeeGroup, T>;
}

/**
 * THE FEES HANDLER — cancel or rewrite the fees on one activity.
 *
 * Shows what each unit costs on each payment provider today, then lets an
 * admin pick one of three:
 *
 *   standard  — the activity kind's ordinary schedule (removes any override)
 *   cancelled — buyers pay the bare price; Ticketwaze forgoes its margin
 *   custom    — a service %, a flat fee and a processor % per provider, or one
 *               set for every provider when the toggle is on
 *
 * Providers are handled in the three groups that actually price differently:
 * mobile money (MonCash and NatCash together), card, and wallet — which has no
 * processor fee to set. See `GROUP_LABELS` and `GROUPS_WITH_PROCESSOR`.
 *
 * The preview below the form is computed with the same function the attendee
 * checkout quotes with, so what the admin sees before saving is what buyers
 * will be shown after.
 *
 * EDITABLE WHEN THE ORGANISER ABSORBS THE FEES TOO, and this screen used to be
 * read-only there. The reasoning was that buyers on such an activity pay the
 * listed price and nothing else — true, and beside the point: the fee still
 * exists, the ORGANISER pays it, and an admin cutting it is deciding what the
 * organisation takes home. So the form stays live and every figure switches to
 * the organisation's side, because the buyer's total is the listed price on
 * every route and would tell an admin nothing.
 *
 * Rendered as a sibling of the actions menu on the event page (`hideTrigger`),
 * and with its own trigger button on the raffle, product and venue pages.
 */
export default function FeesHandlerDialog({
  kind,
  activityId,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  kind: FeeActivityKind;
  activityId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("Activities");
  const locale = useLocale();
  const { data: session } = useSession();
  const canManage = useAdminCan("activity.manage");

  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  function setOpenState(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  const [data, setData] = useState<ActivityFees | null>(null);
  /**
   * Does the ORGANISER carry the fees on this activity?
   *
   * Not a reason to refuse the edit any more — it decides whose side the change
   * lands on. Buyers on an absorbing activity always pay the listed price, so
   * everything below reads the organisation's column instead of the buyer's.
   */
  const absorbs = data?.activity.absorbFees === true;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<Mode>("standard");
  const [sameForAll, setSameForAll] = useState(true);
  const [allInputs, setAllInputs] = useState<ComponentInputs>({
    service: "0",
    flat: "0",
    processor: "0",
  });
  const [groupInputs, setGroupInputs] = useState<
    Record<FeeGroup, ComponentInputs>
  >(eachGroup(() => ({ service: "0", flat: "0", processor: "0" })));

  /** Seeds the form from what is saved, or from today's schedule if nothing is. */
  function seedForm(fees: ActivityFees) {
    const saved = fees.feeOverride;
    setMode(saved?.mode ?? "standard");
    const source = saved?.mode === "custom" ? saved.routes : fees.suggested;
    setSameForAll(saved ? saved.sameForAllProviders : true);
    setAllInputs(toInputs(source[FEE_GROUP_ROUTE.mobile]));
    setGroupInputs(
      eachGroup((group) => toInputs(source[FEE_GROUP_ROUTE[group]])),
    );
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const result = await GetActivityFeesAction(
        kind,
        activityId,
        session?.user.accessToken ?? "",
        locale,
      );
      if (cancelled) return;
      if ("error" in result) {
        setLoadError(result.error);
        return;
      }
      setLoadError(null);
      setData(result.data);
      seedForm(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, kind, activityId, session?.user.accessToken, locale]);

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (!next) {
      setData(null);
      setLoadError(null);
    }
  }

  function toggleSameForAll() {
    if (sameForAll) {
      // Splitting: every group starts from the shared set.
      setGroupInputs(eachGroup(() => ({ ...allInputs })));
    } else {
      // Merging: mobile money's values become everyone's.
      setAllInputs({ ...groupInputs.mobile });
    }
    setSameForAll(!sameForAll);
  }

  /**
   * The components that would be saved, or null while any field is invalid.
   *
   * Typed per group and expanded to the four routes the API stores against —
   * NatCash takes MonCash's values, and the wallet's processor rate stays zero
   * even when one set is shared across every provider.
   */
  const draftRoutes = useMemo(() => {
    const byGroup = {} as Record<FeeGroup, RouteFeeComponents>;
    for (const group of FEE_GROUPS) {
      const parsed = toComponents(
        sameForAll ? allInputs : groupInputs[group],
        group,
      );
      if (!parsed) return null;
      byGroup[group] = parsed;
    }
    return normalizeFeeRoutes({
      moncash: byGroup.mobile,
      natcash: byGroup.mobile,
      card: byGroup.card,
      wallet: byGroup.wallet,
    });
  }, [sameForAll, allInputs, groupInputs]);

  /**
   * What each unit would cost after saving, per route.
   *
   * `organisation` is carried through because an absorbing activity is read
   * from that column rather than from the buyer's total: there, the fee comes
   * off the organiser's side and the buyer pays the listed price whatever is
   * typed here.
   */
  function previewQuote(
    price: number,
    standard: RouteQuote,
    route: FeeRoute,
  ): RouteQuote | null {
    if (mode === "standard") return standard;
    if (mode === "cancelled")
      return { fees: 0, total: round2(price), organisation: round2(price) };
    if (!draftRoutes) return null;
    const draft: FeeOverride = {
      mode: "custom",
      sameForAllProviders: sameForAll,
      routes: draftRoutes,
      updatedAt: "",
      updatedBy: "",
    };
    const { total } = getOverrideUnitFees(draft, route, price);
    const fees = round2(total - price);
    return {
      fees,
      // On an absorbing activity the buyer keeps paying the listed price; it is
      // the organiser's net that the fee comes out of.
      total: absorbs ? round2(price) : total,
      organisation: round2(price - fees),
    };
  }

  async function handleSave() {
    if (!data) return;
    if (mode === "custom" && !draftRoutes) return;
    setIsSaving(true);
    const result = await UpdateActivityFeesAction(
      kind,
      activityId,
      mode === "custom"
        ? { mode, sameForAllProviders: sameForAll, routes: draftRoutes! }
        : { mode },
      session?.user.accessToken ?? "",
      locale,
    );
    setIsSaving(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(
      mode === "standard"
        ? "Standard fees restored."
        : mode === "cancelled"
          ? "Fees cancelled. Buyers now pay the listed price only."
          : "Custom fees saved. Checkout reflects them from now on.",
    );
    handleOpenChange(false);
  }

  if (!canManage) return null;

  const currency = data?.activity.currency ?? "HTG";
  const money = (amount: number) => formatMoney(amount, currency, locale);
  const saved = data?.feeOverride ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <ButtonBlack className="w-full lg:w-fit gap-3">
            <ReceiptDiscount size="18" color="#ffffff" variant="Bulk" />
            {t("activity.actions.fees")}
          </ButtonBlack>
        </DialogTrigger>
      )}
      <DialogContent className="lg:w-[760px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-8 min-w-0">
          <div className="flex flex-col gap-2">
            <DialogTitle>Fees handler</DialogTitle>
            {data && (
              <p className="text-[1.3rem] leading-6 text-neutral-500">
                {data.activity.name} · {currency}
              </p>
            )}
          </div>

          {loadError ? (
            <p className="text-[1.4rem] text-failure">{loadError}</p>
          ) : !data ? (
            <div className="flex justify-center py-10">
              <LoadingCircleSmall />
            </div>
          ) : (
            <>
              {/*
                Informational, not a refusal. This used to say there was
                nothing to change here and made the whole screen read-only —
                but the fee exists on an absorbing activity too, it is simply
                the organiser who pays it, so changing it changes what they
                take home.
              */}
              {absorbs && (
                <div className="flex items-start gap-3 rounded-[15px] border border-warning bg-warning/10 p-5">
                  <InfoCircle
                    size="20"
                    color="#0d0d0d"
                    variant="Bulk"
                    className="shrink-0 mt-[2px]"
                  />
                  <p className="text-[1.35rem] leading-7 text-neutral-700">
                    The organisation absorbs the fees on this activity: buyers
                    pay the listed price and nothing else, and the fees come out
                    of the organisation&apos;s earnings. Anything you change
                    here therefore changes what the ORGANISER takes home, never
                    what a buyer is charged &mdash; so the figures below are
                    what the organiser nets per ticket.
                  </p>
                </div>
              )}

              {/* Current pricing */}
              <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[1.5rem] font-semibold text-black">
                    Current pricing
                  </span>
                  <OverrideBadge override={saved} />
                </div>
                <PricingTable
                  units={data.units.map((unit) => ({
                    label: unit.label,
                    price: unit.price,
                    quotes: unit.current,
                  }))}
                  money={money}
                  absorbs={absorbs}
                />
                {saved && saved.updatedBy && (
                  <span className="text-[1.2rem] text-neutral-500">
                    Last changed by {saved.updatedBy}
                    {saved.updatedAt
                      ? ` on ${new Date(saved.updatedAt).toLocaleString(locale)}`
                      : ""}
                  </span>
                )}
              </section>

              {/* Choice */}
              <section className="flex flex-col gap-4">
                <span className="text-[1.5rem] font-semibold text-black">
                  Change fees
                </span>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <ModeOption
                    active={mode === "standard"}
                    onClick={() => setMode("standard")}
                    title="Standard fees"
                    description="The normal Ticketwaze schedule for this activity."
                  />
                  <ModeOption
                    active={mode === "cancelled"}
                    onClick={() => setMode("cancelled")}
                    title="Cancel all fees"
                    description={
                      absorbs
                        ? "The organisation keeps the whole listed price. Ticketwaze earns nothing."
                        : "Buyers pay the listed price only. Ticketwaze earns nothing."
                    }
                  />
                  <ModeOption
                    active={mode === "custom"}
                    onClick={() => setMode("custom")}
                    title="Custom fees"
                    description="Set the service, flat and processor fees yourself."
                  />
                </div>
              </section>

              {mode === "custom" && (
                <section className="flex flex-col gap-5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sameForAll}
                    onClick={toggleSameForAll}
                    className="flex items-center justify-between gap-4 rounded-[15px] bg-neutral-100 px-5 py-4 cursor-pointer text-left"
                  >
                    <span className="flex flex-col">
                      <span className="text-[1.4rem] font-medium text-black">
                        Same fees for all providers
                      </span>
                      <span className="text-[1.25rem] text-neutral-500">
                        {sameForAll
                          ? "Mobile money, card and wallet all charge the values below."
                          : "Each payment method has its own values."}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "relative h-8 w-14 shrink-0 rounded-full transition-colors",
                        sameForAll ? "bg-black" : "bg-neutral-300",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-6 w-6 rounded-full bg-white transition-all",
                          sameForAll ? "left-7" : "left-1",
                        )}
                      />
                    </span>
                  </button>

                  {sameForAll ? (
                    <ComponentFields
                      title="All payment methods"
                      hint="Wallet payments take the service and flat fee only — they have no processor fee."
                      currency={currency}
                      showProcessor
                      value={allInputs}
                      onChange={setAllInputs}
                    />
                  ) : (
                    FEE_GROUPS.map((group) => (
                      <ComponentFields
                        key={group}
                        title={GROUP_LABELS[group]}
                        hint={GROUP_HINTS[group]}
                        currency={currency}
                        showProcessor={GROUPS_WITH_PROCESSOR[group]}
                        value={groupInputs[group]}
                        onChange={(next) =>
                          setGroupInputs((current) => ({
                            ...current,
                            [group]: next,
                          }))
                        }
                      />
                    ))
                  )}

                  <p className="text-[1.25rem] leading-6 text-neutral-500">
                    Buyer total = price + service % of price + flat fee, then
                    the processor % on top. Free tickets stay free, and a wallet
                    payment never carries a processor fee.
                  </p>
                </section>
              )}

              {/* Preview */}
              <section className="flex flex-col gap-4">
                <span className="text-[1.5rem] font-semibold text-black">
                  After saving
                </span>
                {mode === "custom" && !draftRoutes ? (
                  <p className="text-[1.3rem] text-failure">
                    Percentages must be between 0 and 100, and amounts cannot be
                    negative.
                  </p>
                ) : (
                  <PricingTable
                    units={data.units.map((unit) => ({
                      label: unit.label,
                      price: unit.price,
                      quotes: Object.fromEntries(
                        FEE_ROUTES.map((route) => [
                          route,
                          previewQuote(
                            unit.price,
                            unit.standard[route],
                            route,
                          ) ?? unit.standard[route],
                        ]),
                      ) as Record<FeeRoute, RouteQuote>,
                    }))}
                    money={money}
                    absorbs={absorbs}
                  />
                )}
                <p className="text-[1.25rem] leading-6 text-neutral-500">
                  {absorbs
                    ? "Applies to purchases from now on. Buyers keep paying the listed price whatever you set here; what changes is how much of it the organisation keeps and how much Ticketwaze does."
                    : "Applies to purchases from now on. The organisation is credited the same amount whatever the fees are; only what buyers pay and what Ticketwaze keeps changes."}
                </p>
              </section>
            </>
          )}

          <DialogFooter>
            <ButtonNeutral
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {loadError ? "Close" : "Cancel"}
            </ButtonNeutral>
            {data && (
              <ButtonBlack
                className="flex-1"
                disabled={isSaving || (mode === "custom" && !draftRoutes)}
                onClick={handleSave}
              >
                {isSaving ? <LoadingCircleSmall /> : "Save fees"}
              </ButtonBlack>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OverrideBadge({ override }: { override: FeeOverride | null }) {
  const label = !override
    ? "Standard fees"
    : override.mode === "cancelled"
      ? "Fees cancelled"
      : override.sameForAllProviders
        ? "Custom fees"
        : "Custom fees per provider";
  return (
    <span
      className={cn(
        "py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px]",
        override ? "bg-black text-white" : "bg-neutral-100 text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}

function ModeOption({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-1 rounded-2xl border-2 px-5 py-4 text-left transition-colors cursor-pointer",
        active
          ? "border-black bg-neutral-100"
          : "border-neutral-200 hover:border-neutral-400",
      )}
    >
      <span className="text-[1.4rem] font-medium text-black">{title}</span>
      <span className="text-[1.2rem] leading-5 text-neutral-500">
        {description}
      </span>
    </button>
  );
}

function ComponentFields({
  title,
  hint,
  currency,
  showProcessor,
  value,
  onChange,
}: {
  title: string;
  hint?: string;
  currency: string;
  /** False on the wallet, which no processor charges. */
  showProcessor: boolean;
  value: ComponentInputs;
  onChange: (next: ComponentInputs) => void;
}) {
  const field = (key: keyof ComponentInputs, label: string, suffix: string) => (
    <label className="flex flex-col gap-2 min-w-0">
      <span className="text-[1.25rem] text-neutral-600">{label}</span>
      <span className="flex items-center rounded-2xl border-2 border-neutral-200 focus-within:border-black transition-colors">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value[key]}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          className="w-full min-w-0 bg-transparent px-4 py-3 text-[1.4rem] text-black outline-none"
        />
        <span className="pr-4 text-[1.3rem] text-neutral-500">{suffix}</span>
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-3 rounded-[15px] border border-neutral-200 p-5">
      <span className="flex flex-col">
        <span className="text-[1.4rem] font-medium text-black">{title}</span>
        {hint && <span className="text-[1.2rem] text-neutral-500">{hint}</span>}
      </span>
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showProcessor ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {field("service", "Service fee", "%")}
        {field("flat", "Flat fee per unit", currency)}
        {showProcessor && field("processor", "Processor fee", "%")}
      </div>
    </div>
  );
}

function PricingTable({
  units,
  money,
  absorbs,
}: {
  units: {
    label: string;
    price: number;
    quotes: Record<FeeRoute, RouteQuote>;
  }[];
  money: (amount: number) => string;
  /**
   * The organiser carries the fees, so the buyer's total is the listed price on
   * every route and says nothing. The cells show what the ORGANISER nets
   * instead — the figure the fees actually move here.
   */
  absorbs?: boolean;
}) {
  if (units.length === 0) {
    return (
      <p className="text-[1.3rem] text-neutral-500">
        Nothing is on sale on this activity yet.
      </p>
    );
  }

  // One column per group: MonCash and NatCash are always quoted the same, so a
  // NatCash column beside MonCash would only ever repeat it.
  return (
    <div className="overflow-x-auto rounded-[12px] border border-neutral-200">
      <table className="w-full min-w-[48rem] text-[1.3rem]">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600">
            <th className="px-4 py-3 text-left font-medium">Item</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            {FEE_GROUPS.map((group) => (
              <th key={group} className="px-4 py-3 text-right font-medium">
                {GROUP_LABELS[group]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((unit, index) => (
            <tr
              key={`${unit.label}-${index}`}
              className="border-t border-neutral-200"
            >
              <td className="px-4 py-3 text-black">{unit.label}</td>
              <td className="px-4 py-3 text-right text-black">
                {money(unit.price)}
              </td>
              {FEE_GROUPS.map((group) => {
                const quote = unit.quotes[FEE_GROUP_ROUTE[group]];
                // Absorbing: the organiser's net, and the fee that came out of
                // it. Falls back to the price when a preview quote carries no
                // organisation figure, which is the same thing when fees are 0.
                const net =
                  quote.organisation ?? round2(unit.price - quote.fees);
                return (
                  <td key={group} className="px-4 py-3 text-right">
                    <span className="flex flex-col items-end">
                      <span className="text-black font-medium">
                        {money(absorbs ? net : quote.total)}
                      </span>
                      <span className="text-[1.1rem] text-neutral-500">
                        {quote.fees > 0
                          ? absorbs
                            ? `−${money(quote.fees)} fees`
                            : `+${money(quote.fees)} fees`
                          : "no fees"}
                      </span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
