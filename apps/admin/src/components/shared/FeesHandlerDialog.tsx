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
import { FEE_ROUTES, getOverrideUnitFees, round2 } from "@ticketwaze/pricing";
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

const ROUTE_LABELS: Record<FeeRoute, string> = {
  moncash: "MonCash",
  natcash: "NatCash",
  card: "Card",
  wallet: "Wallet",
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

function toComponents(inputs: ComponentInputs): RouteFeeComponents | null {
  const service = parseAmount(inputs.service);
  const flat = parseAmount(inputs.flat);
  const processor = parseAmount(inputs.processor);
  if (service === null || flat === null || processor === null) return null;
  if (service > 100 || processor > 100) return null;
  return {
    serviceRate: service / 100,
    flatFee: round2(flat),
    processorRate: processor / 100,
  };
}

function eachRoute<T>(make: (route: FeeRoute) => T): Record<FeeRoute, T> {
  return Object.fromEntries(FEE_ROUTES.map((route) => [route, make(route)])) as Record<
    FeeRoute,
    T
  >;
}

/**
 * THE FEES HANDLER — cancel or rewrite what buyers pay in fees on one activity.
 *
 * Shows what each unit costs on each payment provider today, then lets an
 * admin pick one of three:
 *
 *   standard  — the activity kind's ordinary schedule (removes any override)
 *   cancelled — buyers pay the bare price; Ticketwaze forgoes its margin
 *   custom    — a service %, a flat fee and a processor % per provider, or one
 *               set for every provider when the toggle is on
 *
 * The preview below the form is computed with the same function the attendee
 * checkout quotes with, so what the admin sees before saving is what buyers
 * will be shown after.
 *
 * READ-ONLY WHEN THE ORGANISER ABSORBS THE FEES. Buyers on such an activity
 * pay the listed price and nothing else, so there is no fee to change; the
 * API refuses the write too.
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<Mode>("standard");
  const [sameForAll, setSameForAll] = useState(true);
  const [allInputs, setAllInputs] = useState<ComponentInputs>({
    service: "0",
    flat: "0",
    processor: "0",
  });
  const [routeInputs, setRouteInputs] = useState<Record<FeeRoute, ComponentInputs>>(
    eachRoute(() => ({ service: "0", flat: "0", processor: "0" })),
  );

  /** Seeds the form from what is saved, or from today's schedule if nothing is. */
  function seedForm(fees: ActivityFees) {
    const saved = fees.feeOverride;
    setMode(saved?.mode ?? "standard");
    const source = saved?.mode === "custom" ? saved.routes : fees.suggested;
    setSameForAll(saved ? saved.sameForAllProviders : true);
    setAllInputs(toInputs(source.moncash));
    setRouteInputs(eachRoute((route) => toInputs(source[route])));
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
      // Splitting: every provider starts from the shared set.
      setRouteInputs(eachRoute(() => ({ ...allInputs })));
    } else {
      // Merging: MonCash's values become everyone's.
      setAllInputs({ ...routeInputs.moncash });
    }
    setSameForAll(!sameForAll);
  }

  /** The components that would be saved, or null while any field is invalid. */
  const draftRoutes = useMemo(() => {
    const routes = {} as Record<FeeRoute, RouteFeeComponents>;
    for (const route of FEE_ROUTES) {
      const parsed = toComponents(sameForAll ? allInputs : routeInputs[route]);
      if (!parsed) return null;
      routes[route] = parsed;
    }
    return routes;
  }, [sameForAll, allInputs, routeInputs]);

  /** What each unit would cost after saving, per route. */
  function previewQuote(price: number, standard: RouteQuote, route: FeeRoute): RouteQuote | null {
    if (mode === "standard") return standard;
    if (mode === "cancelled") return { fees: 0, total: round2(price) };
    if (!draftRoutes) return null;
    const draft: FeeOverride = {
      mode: "custom",
      sameForAllProviders: sameForAll,
      routes: draftRoutes,
      updatedAt: "",
      updatedBy: "",
    };
    const { total } = getOverrideUnitFees(draft, route, price);
    return { fees: round2(total - price), total };
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
  const readOnly = data?.activity.absorbFees === true;

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
              {readOnly && (
                <div className="flex items-start gap-3 rounded-[15px] border border-warning bg-warning/10 p-5">
                  <InfoCircle size="20" color="#0d0d0d" variant="Bulk" className="shrink-0 mt-[2px]" />
                  <p className="text-[1.35rem] leading-7 text-neutral-700">
                    The organisation absorbs the fees on this activity: buyers pay
                    the listed price and nothing else, and the fees come out of
                    the organisation&apos;s earnings. There are no buyer fees to
                    cancel or change here.
                  </p>
                </div>
              )}

              {/* Current pricing */}
              <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[1.5rem] font-semibold text-black">
                    Current pricing
                  </span>
                  {!readOnly && <OverrideBadge override={saved} />}
                </div>
                <PricingTable
                  units={data.units.map((unit) => ({
                    label: unit.label,
                    price: unit.price,
                    quotes: unit.current,
                  }))}
                  money={money}
                />
                {saved && !readOnly && saved.updatedBy && (
                  <span className="text-[1.2rem] text-neutral-500">
                    Last changed by {saved.updatedBy}
                    {saved.updatedAt
                      ? ` on ${new Date(saved.updatedAt).toLocaleString(locale)}`
                      : ""}
                  </span>
                )}
              </section>

              {!readOnly && (
                <>
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
                        description="Buyers pay the listed price only. Ticketwaze earns nothing."
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
                              ? "MonCash, NatCash, card and wallet all charge the values below."
                              : "Each payment provider has its own values."}
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
                          title="All providers"
                          currency={currency}
                          value={allInputs}
                          onChange={setAllInputs}
                        />
                      ) : (
                        FEE_ROUTES.map((route) => (
                          <ComponentFields
                            key={route}
                            title={ROUTE_LABELS[route]}
                            currency={currency}
                            value={routeInputs[route]}
                            onChange={(next) =>
                              setRouteInputs((current) => ({ ...current, [route]: next }))
                            }
                          />
                        ))
                      )}

                      <p className="text-[1.25rem] leading-6 text-neutral-500">
                        Buyer total = price + service % of price + flat fee, then
                        the processor % on top. Free tickets stay free.
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
                        Percentages must be between 0 and 100, and amounts cannot
                        be negative.
                      </p>
                    ) : (
                      <PricingTable
                        units={data.units.map((unit) => ({
                          label: unit.label,
                          price: unit.price,
                          quotes: eachRoute(
                            (route) =>
                              previewQuote(unit.price, unit.standard[route], route) ??
                              unit.standard[route],
                          ),
                        }))}
                        money={money}
                      />
                    )}
                    <p className="text-[1.25rem] leading-6 text-neutral-500">
                      Applies to purchases from now on. The organisation is
                      credited the same amount whatever the fees are; only what
                      buyers pay and what Ticketwaze keeps changes.
                    </p>
                  </section>
                </>
              )}
            </>
          )}

          <DialogFooter>
            <ButtonNeutral className="flex-1" onClick={() => handleOpenChange(false)}>
              {readOnly || loadError ? "Close" : "Cancel"}
            </ButtonNeutral>
            {data && !readOnly && (
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
        active ? "border-black bg-neutral-100" : "border-neutral-200 hover:border-neutral-400",
      )}
    >
      <span className="text-[1.4rem] font-medium text-black">{title}</span>
      <span className="text-[1.2rem] leading-5 text-neutral-500">{description}</span>
    </button>
  );
}

function ComponentFields({
  title,
  currency,
  value,
  onChange,
}: {
  title: string;
  currency: string;
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
      <span className="text-[1.4rem] font-medium text-black">{title}</span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {field("service", "Service fee", "%")}
        {field("flat", "Flat fee per unit", currency)}
        {field("processor", "Processor fee", "%")}
      </div>
    </div>
  );
}

function PricingTable({
  units,
  money,
}: {
  units: { label: string; price: number; quotes: Record<FeeRoute, RouteQuote> }[];
  money: (amount: number) => string;
}) {
  if (units.length === 0) {
    return (
      <p className="text-[1.3rem] text-neutral-500">
        Nothing is on sale on this activity yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-neutral-200">
      <table className="w-full min-w-[56rem] text-[1.3rem]">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600">
            <th className="px-4 py-3 text-left font-medium">Item</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            {FEE_ROUTES.map((route) => (
              <th key={route} className="px-4 py-3 text-right font-medium">
                {ROUTE_LABELS[route]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((unit, index) => (
            <tr key={`${unit.label}-${index}`} className="border-t border-neutral-200">
              <td className="px-4 py-3 text-black">{unit.label}</td>
              <td className="px-4 py-3 text-right text-black">{money(unit.price)}</td>
              {FEE_ROUTES.map((route) => {
                const quote = unit.quotes[route];
                return (
                  <td key={route} className="px-4 py-3 text-right">
                    <span className="flex flex-col items-end">
                      <span className="text-black font-medium">{money(quote.total)}</span>
                      <span className="text-[1.1rem] text-neutral-500">
                        {quote.fees > 0 ? `+${money(quote.fees)} fees` : "no fees"}
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
