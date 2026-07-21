"use client";
import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  AddCircle,
  ArrowRotateLeft,
  Edit2,
  Minus,
  Receipt2,
  SearchNormal,
  Trash,
} from "iconsax-reactjs";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonPrimary, ButtonNeutral } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  OpenTab,
  UpdateTab,
  SettleTab,
  ReopenTab,
  AddTabItem,
  SearchCustomerCredits,
} from "@/actions/TabActions";
import type {
  CatalogItem,
  CustomerCredit,
  CustomerTab,
  TabItem,
} from "./types";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const pillClass =
  "shrink-0 px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer";
/**
 * Filters read as one control on a phone: full width, split evenly, never
 * scrolling sideways. They go back to sitting inline at their natural width on
 * desktop, where there is room. Each caller supplies its own gap.
 */
const filterRowClass = "grid grid-cols-3 w-full lg:flex lg:w-auto";
/**
 * Black marks the active *filter*. A coloured pill that picks a value rather
 * than narrowing a list — payment method, currency — stays primary, so the two
 * kinds of control never read as the same thing.
 */
const pillActive = "bg-black text-white";
const pillIdle = "bg-neutral-100 text-neutral-600";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.4rem] font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Money is stored in HTG with a USD equivalent; show whichever the venue prices in. */
function display(
  htg: number,
  usd: number,
  currency: string,
  locale: string,
): string {
  return formatMoney(currency === "USD" ? usd : htg, currency, locale);
}

/**
 * The board: every check the venue has open right now, and what each comes to.
 * Payment is Phase 3 — closing a tab records that the venue is done adding to
 * it, and the money is still collected at the counter.
 */
export default function TabsBoard({
  restaurant,
  tabs,
  catalog,
}: {
  restaurant: Restaurant;
  tabs: CustomerTab[];
  catalog: CatalogItem[];
}) {
  const t = useTranslations("Events.workplace");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user.accessToken ?? "";
  const orgId = restaurant.organisationId;
  const restId = restaurant.restaurantId;

  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");

  /**
   * Every mutation refreshes from the server rather than patching local state:
   * the API owns the totals, and an optimistic figure that disagreed with the
   * check in the guest's hand would be worse than a moment's latency.
   */
  async function run(action: () => Promise<{ error?: string }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(t("saved"));
    router.refresh();
    return true;
  }

  const visible = useMemo(
    () =>
      filter === "all" ? tabs : tabs.filter((tab) => tab.status === filter),
    [tabs, filter],
  );

  const canOpen = catalog.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* The filters carry the heading's job: which slice of the board you are
          looking at, without a label repeating what the page obviously is. */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className={`${filterRowClass} gap-3`}>
          {(["open", "closed", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`${pillClass} ${
                filter === value
                  ? pillActive
                  : `${pillIdle} hover:text-deep-100`
              }`}
            >
              {t(`filter.${value}`)}
            </button>
          ))}
        </div>
        {/* Nothing to serve means nothing to open a tab with — the API would
            refuse it anyway, so the button says so instead of failing. */}
        {canOpen ? (
          <OpenTabDialog
            catalog={catalog}
            tabs={tabs}
            currency={restaurant.reservationFeeCurrency}
            busy={busy}
            locale={locale}
            onSubmit={(payload) =>
              run(() => OpenTab(orgId, restId, token, locale, payload))
            }
          />
        ) : (
          <ButtonPrimary
            className="py-[7.5px] flex items-center gap-3"
            disabled
            title={t("no_catalog_yet")}
          >
            <AddCircle size="20" color="#fff" variant="Bulk" />
            {t("open_tab")}
          </ButtonPrimary>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message={canOpen ? t(`empty.${filter}`) : t("no_catalog_yet")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visible.map((tab) => (
            <TabCard
              key={tab.tabId}
              tab={tab}
              catalog={catalog}
              busy={busy}
              locale={locale}
              onRename={(payload) =>
                run(() =>
                  UpdateTab(orgId, restId, tab.tabId, token, locale, payload),
                )
              }
              onSettle={(payload) =>
                run(() =>
                  SettleTab(orgId, restId, tab.tabId, token, locale, payload),
                )
              }
              /**
               * Read-only lookup, so it deliberately bypasses `run`: that
               * wrapper toasts and refreshes the board, which is right for a
               * mutation and wrong for typing in a search box.
               */
              onSearchCredits={async (search) => {
                const result = await SearchCustomerCredits(
                  orgId,
                  restId,
                  token,
                  locale,
                  search,
                );
                if ("error" in result) return [];
                return result.data?.credits ?? [];
              }}
              onReopen={() =>
                run(() => ReopenTab(orgId, restId, tab.tabId, token, locale))
              }
              /**
               * The API adds one line at a time, so a selection becomes a short
               * sequence of calls — one per distinct dish, quantity included,
               * not one per unit. It stops at the first failure and lets `run`
               * refresh, so the board shows exactly what actually landed rather
               * than what was selected.
               */
              onAddItems={(items) =>
                run(async () => {
                  for (const item of items) {
                    const result = await AddTabItem(
                      orgId,
                      restId,
                      tab.tabId,
                      token,
                      locale,
                      item,
                    );
                    if (result?.error) return result;
                  }
                  return {};
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab card ───────────────────────────────────────────────────────────────

function TabCard({
  tab,
  catalog,
  busy,
  locale,
  onRename,
  onSettle,
  onSearchCredits,
  onReopen,
  onAddItems,
}: {
  tab: CustomerTab;
  catalog: CatalogItem[];
  busy: boolean;
  locale: string;
  onRename: (payload: { label: string; note?: string }) => Promise<boolean>;
  onSettle: (payload: {
    paymentMethod: "cash";
    amountTendered: number;
    customerName?: string;
    creditApplied?: number;
    keepChangeAsCredit?: boolean;
  }) => Promise<boolean>;
  onSearchCredits: (search: string) => Promise<CustomerCredit[]>;
  onReopen: () => Promise<boolean>;
  onAddItems: (
    items: { itemId: string; quantity: number }[],
  ) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const isOpen = tab.status === "open";
  const count = tab.items.reduce((sum, line) => sum + line.quantity, 0);

  const statusBadgeClass = `shrink-0 px-4 py-1 rounded-[30px] text-[1.1rem] font-medium uppercase ${
    isOpen ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-600"
  }`;

  return (
    <Dialog>
      {/* The board answers one question — who is here and what do they owe —
          so the card carries that and nothing else. Lines, steppers and four
          buttons per check turned a board of six tables into a wall. */}
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full p-6 rounded-[15px] border border-neutral-100 flex items-center justify-between gap-4 text-left cursor-pointer transition-colors hover:border-primary-500"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 truncate min-w-0">
                {tab.label}
              </span>
              <span className={statusBadgeClass}>
                {t(`status.${tab.status}`)}
              </span>
            </div>
            <span className="text-[1.2rem] text-neutral-600 truncate">
              {t("items_count", { count })}
              {tab.note ? ` · ${tab.note}` : ""}
            </span>
          </div>
          <span className="text-[1.8rem] font-medium leading-8 text-primary-500 shrink-0 whitespace-nowrap">
            {display(tab.total, tab.usdTotal, tab.currency, locale)}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary flex items-center gap-4">
            <span className="truncate min-w-0">{tab.label}</span>
            <span className={statusBadgeClass}>
              {t(`status.${tab.status}`)}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("edit_tab")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[1.4rem] text-neutral-600">
              {t("items_count", { count })}
              {tab.note ? ` · ${tab.note}` : ""}
            </span>
            <span className="text-[2.2rem] font-medium leading-10 text-primary-500 font-primary whitespace-nowrap">
              {display(tab.total, tab.usdTotal, tab.currency, locale)}
            </span>
          </div>

          {/* What was actually taken at the counter, kept visible after the
              fact — a change dispute an hour later is settled by this line. */}
          {!isOpen && tab.paymentMethod && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[1.2rem] text-neutral-600">
              <span className="font-medium text-deep-100">
                {t(`paid_${tab.paymentMethod}`)}
              </span>
              {tab.amountTendered !== null && (
                <span>
                  {t("received")}{" "}
                  {formatMoney(tab.amountTendered, tab.currency, locale)}
                </span>
              )}
              {tab.changeGiven !== null && (
                <span>
                  {t("change_due")}{" "}
                  {formatMoney(tab.changeGiven, tab.currency, locale)}
                </span>
              )}
            </div>
          )}

          <ul className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-100 max-h-[38vh] overflow-y-auto">
            {tab.items.map((line) => (
              <TabLine key={line.tabItemId} line={line} locale={locale} />
            ))}
          </ul>

          {/* Icons alone on a phone. The labels are long enough in French that
              "Ajouter à l'addition" broke onto two lines and left the row
              ragged; the icon carries it at that width and the label comes
              back on desktop. `[&>*]` reaches the dialog triggers, which are
              the direct children here — the dialog bodies themselves are
              portalled out and so are untouched by it. */}
          <div className="flex gap-3 border-t border-neutral-100 pt-6 lg:flex-wrap lg:items-center [&>*]:flex-1 lg:[&>*]:flex-none">
            {isOpen && (
              <AddToTabDialog
                catalog={catalog}
                busy={busy}
                locale={locale}
                onAdd={onAddItems}
              />
            )}
            <EditTabDialog
              trigger={
                <ButtonNeutral
                  className="py-[7.5px] flex items-center justify-center gap-3"
                  aria-label={t("edit")}
                >
                  <Edit2 size="18" color="#737C8A" variant="Bulk" />
                  <span className="hidden lg:inline">{t("edit")}</span>
                </ButtonNeutral>
              }
              title={t("edit_tab")}
              busy={busy}
              initial={tab}
              onSubmit={onRename}
            />
            {isOpen ? (
              <SettleDialog
                tab={tab}
                busy={busy}
                locale={locale}
                onSettle={onSettle}
                onSearchCredits={onSearchCredits}
              />
            ) : (
              <ButtonNeutral
                className="py-[7.5px] flex items-center justify-center gap-3"
                aria-label={t("reopen_tab")}
                disabled={busy}
                onClick={onReopen}
              >
                <ArrowRotateLeft size="18" color="#737C8A" variant="Bulk" />
                <span className="hidden lg:inline">{t("reopen_tab")}</span>
              </ButtonNeutral>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One line on the check, as a record rather than a control. Quantity is shown
 * but not adjustable here: what a guest already ordered is not edited from the
 * summary — more of something goes on through "add to tab".
 */
function TabLine({
  line,
  locale,
}: {
  line: TabItem;
  locale: string;
}) {
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-[1.5rem] font-medium leading-8 text-deep-100 truncate">
          {line.name}
        </span>
        <span className="text-[1.2rem] text-neutral-600">
          {display(line.unitPrice, line.usdUnitPrice, line.currency, locale)}
        </span>
      </div>

      <span className="text-[1.4rem] text-neutral-600 shrink-0">
        x{line.quantity}
      </span>

      {/* No fixed width: at 8rem "500,00 HTG" broke onto a second line on a
          phone. It is the last item and cannot shrink, so the right edges
          still line up across rows without one. */}
      <span className="text-[1.5rem] font-medium leading-8 text-deep-100 shrink-0 whitespace-nowrap text-right">
        {display(
          line.unitPrice * line.quantity,
          line.usdUnitPrice * line.quantity,
          line.currency,
          locale,
        )}
      </span>
    </li>
  );
}


// ── Dialogs ────────────────────────────────────────────────────────────────

/**
 * Opening a tab is one step, not two: a name and what they ordered. The venue
 * opens a tab *because* an order was placed, so the order comes with it and no
 * empty rows can reach the board.
 *
 * Built for a cashier in a rush, which drives every choice here:
 *
 *  - **The grid is the order.** An earlier version had a catalogue list and a
 *    separate draft list, each with its own scrollbar, so raising a quantity
 *    meant scrolling away from the menu and back. Quantity now lives on the
 *    tile you tapped, and there is only one scrolling region on the screen.
 *  - **Tap to add, tap again for two.** The fastest thing anyone can do is hit
 *    the same target twice, so that is what a second portion costs.
 *  - **What sold today comes first**, because a venue sells the same handful of
 *    things all night.
 */
function OpenTabDialog({
  catalog,
  tabs,
  currency,
  busy,
  locale,
  onSubmit,
}: {
  catalog: CatalogItem[];
  /** Today's checks, read only to rank what the venue is actually selling. */
  tabs: CustomerTab[];
  currency: string;
  busy: boolean;
  locale: string;
  onSubmit: (payload: {
    label: string;
    note?: string;
    items: { itemId: string; quantity: number }[];
  }) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const labelRef = React.useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "food" | "drink">("all");
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const byId = useMemo(
    () => new Map(catalog.map((item) => [item.itemId, item])),
    [catalog],
  );

  /**
   * How often each dish has been ordered today. Derived from the board rather
   * than fetched — it costs nothing and sharpens as the day goes on.
   */
  const popularity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tab of tabs) {
      for (const line of tab.items) {
        if (!line.itemId) continue;
        counts.set(line.itemId, (counts.get(line.itemId) ?? 0) + line.quantity);
      }
    }
    return counts;
  }, [tabs]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        return !needle || item.name.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        // Sold-out sinks: still visible, never in the way.
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        const byUse =
          (popularity.get(b.itemId) ?? 0) - (popularity.get(a.itemId) ?? 0);
        if (byUse !== 0) return byUse;
        return a.name.localeCompare(b.name);
      });
  }, [catalog, query, category, popularity]);

  const lines = useMemo(
    () =>
      Object.entries(draft)
        .map(([itemId, quantity]) => ({ item: byId.get(itemId)!, quantity }))
        .filter((line) => line.item),
    [draft, byId],
  );

  const totals = lines.reduce(
    (sum, line) => ({
      htg: sum.htg + line.item.price * line.quantity,
      usd: sum.usd + line.item.usdPrice * line.quantity,
    }),
    { htg: 0, usd: 0 },
  );

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  function bump(itemId: string, by: number) {
    setDraft((current) => {
      const next = { ...current };
      const quantity = (next[itemId] ?? 0) + by;
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = quantity;
      return next;
    });
  }

  function reset() {
    setLabel("");
    setNote("");
    setQuery("");
    setCategory("all");
    setDraft({});
    setError("");
  }

  async function submit() {
    if (!label.trim()) {
      setError(t("errors.label"));
      // The one field that needs a keyboard, so put them in it rather than
      // making them hunt for what the error is about.
      labelRef.current?.focus();
      return;
    }
    if (lines.length === 0) return setError(t("errors.items"));
    setError("");

    const ok = await onSubmit({
      label: label.trim(),
      note: note.trim() || undefined,
      items: lines.map((line) => ({
        itemId: line.item.itemId,
        quantity: line.quantity,
      })),
    });
    if (ok) {
      reset();
      closeRef.current?.click();
    }
  }

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && reset()}>
      <DialogTrigger asChild>
        <ButtonPrimary className="py-[7.5px] flex items-center gap-3">
          <AddCircle size="20" color="#fff" variant="Bulk" />
          {t("open_tab")}
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("open_tab")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("open_tab_hint")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Name first and focused: it is required, so the keyboard is coming
              either way and it may as well not cost a tap to find. */}
          <input
            ref={labelRef}
            autoFocus
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (error) setError("");
            }}
            aria-label={t("tab_label")}
            placeholder={t("tab_label_placeholder")}
            className="w-full bg-neutral-100 rounded-[1.5rem] px-6 py-4 text-[1.6rem] font-medium leading-8 text-deep-100 placeholder:text-neutral-500 placeholder:font-normal outline-none border border-transparent focus:border-primary-500"
          />

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="bg-neutral-100 rounded-[30px] flex items-center justify-between flex-1 px-6 py-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_catalog")}
                className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
            <div className={`${filterRowClass} gap-2 lg:shrink-0`}>
              {(["all", "food", "drink"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`${pillClass} ${
                    category === value ? pillActive : pillIdle
                  }`}
                >
                  {t(`filter.${value}`)}
                </button>
              ))}
            </div>
          </div>

          {/* The only thing on this screen that scrolls. */}
          {results.length === 0 ? (
            <p className="text-[1.4rem] text-neutral-600 py-6">
              {catalog.length === 0 ? t("no_catalog_yet") : t("no_results")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[34vh] overflow-y-auto content-start">
              {results.map((item) => (
                <li key={item.itemId}>
                  <ItemTile
                    item={item}
                    quantity={draft[item.itemId] ?? 0}
                    locale={locale}
                    onAdd={() => bump(item.itemId, 1)}
                    onRemove={() => bump(item.itemId, -1)}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Reading the order back to the guest, without a second scroll
              region: picked items only, compact enough to wrap. */}
          {lines.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              {lines.map((line) => (
                <span
                  key={line.item.itemId}
                  className="px-4 py-1 rounded-[30px] bg-primary-50 text-primary-500 text-[1.3rem] leading-7"
                >
                  {line.quantity}x {line.item.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-[1.4rem] text-neutral-600">
              {t("items_count", { count })}
            </span>
            <span className="text-[2.2rem] font-medium leading-10 text-primary-500 font-primary">
              {display(totals.htg, totals.usd, currency, locale)}
            </span>
          </div>

          {error && <span className="text-[1.2rem] text-failure">{error}</span>}
        </div>

        <DialogFooter>
          <ButtonPrimary
            className="w-full"
            disabled={busy || lines.length === 0}
            onClick={submit}
          >
            {busy ? <LoadingCircleSmall /> : t("open_tab")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One dish, as a target rather than a row. Tapping adds; the count lives on the
 * tile so the cashier confirms what they just did without looking away, and the
 * minus only appears once there is something to take off.
 */
function ItemTile({
  item,
  quantity,
  locale,
  onAdd,
  onRemove,
}: {
  item: CatalogItem;
  quantity: number;
  locale: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Events.workplace");
  const picked = quantity > 0;

  return (
    <div className="relative h-full">
      <button
        type="button"
        disabled={!item.isAvailable}
        onClick={onAdd}
        aria-label={t("add_one", { name: item.name })}
        className={`w-full h-full min-h-[8.5rem] p-4 rounded-[15px] border text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${
          picked
            ? "border-primary-500 bg-primary-50"
            : "border-neutral-100 hover:border-primary-500"
        } ${item.isAvailable ? "" : "opacity-50"}`}
      >
        <span className="text-[1.4rem] font-medium leading-7 text-deep-100 pr-10 line-clamp-2">
          {item.name}
        </span>
        <span className="text-[1.2rem] text-neutral-600">
          {display(item.price, item.usdPrice, item.currency, locale)}
          {item.isAvailable ? "" : ` · ${t("unavailable")}`}
        </span>
      </button>

      {picked && (
        <>
          <span className="absolute top-2 right-2 min-w-[2.4rem] h-[2.4rem] px-2 rounded-full bg-primary-500 text-white text-[1.3rem] font-medium flex items-center justify-center pointer-events-none">
            {quantity}
          </span>
          {/* A sibling, not a child: a button inside a button is invalid and
              swallows the tap on some browsers. */}
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("remove_one", { name: item.name })}
            className="absolute bottom-2 right-2 w-10 h-10 cursor-pointer rounded-full bg-white border border-neutral-200 flex items-center justify-center"
          >
            {quantity === 1 ? (
              <Trash size="14" color="#DE0028" variant="Bulk" />
            ) : (
              <Minus size="14" color="#737C8A" variant="Bulk" />
            )}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Taking payment. Closing a tab and paying are the same act at a counter, so
 * this is the close button.
 *
 * The change due is computed live as the cashier types, because that is the one
 * number they need before the guest walks away — not after a round trip.
 */
function SettleDialog({
  tab,
  busy,
  locale,
  onSettle,
  onSearchCredits,
}: {
  tab: CustomerTab;
  busy: boolean;
  locale: string;
  onSettle: (payload: {
    paymentMethod: "cash";
    amountTendered: number;
    customerName?: string;
    creditApplied?: number;
    keepChangeAsCredit?: boolean;
  }) => Promise<boolean>;
  onSearchCredits: (search: string) => Promise<CustomerCredit[]>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [tendered, setTendered] = useState("");
  const [error, setError] = useState("");

  // Spending an existing balance.
  const [creditQuery, setCreditQuery] = useState("");
  const [creditResults, setCreditResults] = useState<CustomerCredit[]>([]);
  const [searching, setSearching] = useState(false);
  const [applied, setApplied] = useState<CustomerCredit | null>(null);

  // Keeping change as credit, when the venue has nothing to give back.
  const [keepChange, setKeepChange] = useState(false);
  const [keepName, setKeepName] = useState("");

  // The guest pays what the tab shows them, in the currency the venue prices in.
  const due = tab.currency === "USD" ? tab.usdTotal : tab.total;
  const received = tendered.trim() === "" ? 0 : Number(tendered);
  const hasAmount = tendered.trim() !== "" && Number.isFinite(received);

  /**
   * Credit never exceeds the check. Applying a 500 balance to a 200 tab would
   * otherwise turn the difference into cash out of the till, which is a
   * withdrawal, not a payment.
   */
  const creditAvailable = applied ? Number(applied.balance) : 0;
  const creditUsed = Math.min(creditAvailable, due);
  const covered = (hasAmount ? received : 0) + creditUsed;
  const change = covered - due;
  const short = covered < due;
  // Credit alone can settle a check, so an empty cash field is valid when the
  // balance already covers it.
  const canSettle = !short && (hasAmount || creditUsed > 0);

  const keptAsCredit = keepChange ? Math.max(0, change) : 0;
  const cashBack = Math.max(0, change) - keptAsCredit;

  // A name is only required when a balance is actually touched.
  const creditName = applied?.customerName ?? keepName.trim();
  const needsName = keptAsCredit > 0 && !creditName;

  async function runSearch(value: string) {
    setCreditQuery(value);
    if (value.trim().length < 2) {
      setCreditResults([]);
      return;
    }
    setSearching(true);
    setCreditResults(await onSearchCredits(value.trim()));
    setSearching(false);
  }

  function reset() {
    setMethod("cash");
    setTendered("");
    setError("");
    setCreditQuery("");
    setCreditResults([]);
    setApplied(null);
    setKeepChange(false);
    setKeepName("");
  }

  async function submit() {
    if (short || (!hasAmount && creditUsed === 0)) {
      return setError(t("errors.tendered"));
    }
    if (needsName) return setError(t("errors.credit_name"));
    setError("");

    const ok = await onSettle({
      paymentMethod: "cash",
      amountTendered: hasAmount ? received : 0,
      customerName: creditName || undefined,
      creditApplied: creditUsed > 0 ? creditUsed : undefined,
      keepChangeAsCredit: keptAsCredit > 0 ? true : undefined,
    });
    if (ok) {
      reset();
      closeRef.current?.click();
    }
  }

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && reset()}>
      <DialogTrigger asChild>
        <ButtonPrimary
          className="py-[7.5px] flex items-center justify-center gap-3"
          aria-label={t("close_tab")}
        >
          <Receipt2 size="18" color="#fff" variant="Bulk" />
          <span className="hidden lg:inline">{t("close_tab")}</span>
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("settle_title", { label: tab.label })}
          </DialogTitle>
          <DialogDescription className="sr-only">Payment</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col divide-y divide-neutral-100">
              {tab.items.map((line) => (
                <li
                  key={line.tabItemId}
                  className="flex items-center gap-4 py-3"
                >
                  <span className="flex-1 min-w-0 text-[1.5rem] leading-8 text-deep-100 truncate">
                    {line.name}
                  </span>
                  <span className="text-[1.4rem] text-neutral-600 shrink-0">
                    x{line.quantity}
                  </span>
                  <span className="text-[1.5rem] font-medium leading-8 text-deep-100 shrink-0 w-32 text-right">
                    {display(
                      line.unitPrice * line.quantity,
                      line.usdUnitPrice * line.quantity,
                      line.currency,
                      locale,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-[1.6rem] font-medium text-deep-100">
                {t("total_due")}
              </span>
              <span className="text-[2rem] font-medium leading-10 text-primary-500">
                {formatMoney(due, tab.currency, locale)}
              </span>
            </div>
          </div>

          <Field label={t("payment_method")}>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMethod("cash")}
                className={`${pillClass} ${
                  method === "cash"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {t("cash")}
              </button>
              {/* Online payment is Phase 3. Shown so the venue knows it is
                  coming, disabled so it cannot promise what it cannot do. */}
              <button
                type="button"
                disabled
                title={t("online_soon")}
                className={`${pillClass} bg-neutral-100 text-neutral-500 opacity-50 cursor-not-allowed`}
              >
                {t("online")}
              </button>
            </div>
          </Field>

          {/* Spending a balance the guest already has. Explicit, never
              automatic: credit is the venue's debt and must not be settled by
              a name collision. */}
          <Field label={t("customer_credit")}>
            {applied ? (
              <div className="flex items-center justify-between gap-4 p-4 rounded-[15px] bg-primary-50">
                <div className="flex flex-col min-w-0">
                  <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                    {applied.customerName}
                  </span>
                  <span className="text-[1.2rem] text-neutral-600">
                    {t("balance")}{" "}
                    {formatMoney(
                      Number(applied.balance),
                      applied.currency,
                      locale,
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setApplied(null)}
                  className="text-[1.3rem] text-primary-500 underline cursor-pointer shrink-0"
                >
                  {t("remove_credit")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-neutral-100 rounded-[30px] flex items-center justify-between px-6 py-3">
                  <input
                    value={creditQuery}
                    onChange={(e) => runSearch(e.target.value)}
                    placeholder={t("search_customer")}
                    className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                  />
                  <SearchNormal size="20" color="#737c8a" variant="Bulk" />
                </div>
                {searching && (
                  <span className="text-[1.2rem] text-neutral-600">
                    {t("searching")}
                  </span>
                )}
                {!searching &&
                  creditQuery.trim().length >= 2 &&
                  creditResults.length === 0 && (
                    <span className="text-[1.2rem] text-neutral-600">
                      {t("no_customer_found")}
                    </span>
                  )}
                {creditResults.length > 0 && (
                  <ul className="flex flex-col divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                    {creditResults.map((credit) => (
                      <li
                        key={credit.customerCreditId}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-[1.5rem] text-deep-100 truncate">
                            {credit.customerName}
                          </span>
                          <span className="text-[1.2rem] text-neutral-600">
                            {formatMoney(
                              Number(credit.balance),
                              credit.currency,
                              locale,
                            )}
                          </span>
                        </div>
                        <ButtonNeutral
                          className="py-[7.5px] shrink-0"
                          onClick={() => {
                            setApplied(credit);
                            setCreditResults([]);
                            setCreditQuery("");
                          }}
                        >
                          {t("apply")}
                        </ButtonNeutral>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>

          <Field label={t("amount_received")}>
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              autoFocus
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              className={inputClass}
              placeholder={String(due)}
            />
          </Field>

          {creditUsed > 0 && (
            <div className="flex items-center justify-between text-[1.4rem] text-neutral-600">
              <span>{t("credit_applied")}</span>
              <span className="text-primary-500 font-medium">
                - {formatMoney(creditUsed, tab.currency, locale)}
              </span>
            </div>
          )}

          <div
            className={`flex items-center justify-between p-6 rounded-[15px] ${
              short ? "bg-failure/10" : "bg-neutral-100"
            }`}
          >
            <span className="text-[1.6rem] font-medium text-deep-100">
              {short ? t("still_owed") : t("change_due")}
            </span>
            <span
              className={`text-[2.2rem] font-medium leading-10 ${
                short ? "text-failure" : "text-deep-100"
              }`}
            >
              {formatMoney(Math.abs(change), tab.currency, locale)}
            </span>
          </div>

          {/* The case this exists for: there is change owed and no small notes
              to give it in. Keeping it on the guest's name is a debt the venue
              records rather than a rounding it pockets. */}
          {change > 0 && (
            <div className="flex flex-col gap-3 p-6 rounded-[15px] border border-neutral-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepChange}
                  onChange={(e) => setKeepChange(e.target.checked)}
                  className="w-6 h-6 accent-primary-500 cursor-pointer"
                />
                <span className="text-[1.5rem] leading-8 text-deep-100">
                  {t("keep_change_as_credit")}
                </span>
              </label>

              {keepChange && !applied && (
                <input
                  value={keepName}
                  onChange={(e) => {
                    setKeepName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={t("customer_name_placeholder")}
                  aria-label={t("customer_name")}
                  className={inputClass}
                />
              )}

              {keepChange && (
                <div className="flex items-center justify-between text-[1.4rem]">
                  <span className="text-neutral-600">{t("cash_to_give")}</span>
                  <span className="font-medium text-deep-100">
                    {formatMoney(cashBack, tab.currency, locale)}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && <span className="text-[1.2rem] text-failure">{error}</span>}
        </div>

        <DialogFooter>
          <ButtonPrimary
            className="w-full"
            disabled={busy || !canSettle}
            onClick={submit}
          >
            {busy ? <LoadingCircleSmall /> : t("close_tab")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Renaming a tab or changing its note. The order is edited on the card. */
function EditTabDialog({
  trigger,
  title,
  busy,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  busy: boolean;
  initial: CustomerTab;
  onSubmit: (payload: { label: string; note?: string }) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [label, setLabel] = useState(initial.label);
  const [note, setNote] = useState(initial.note ?? "");
  const [error, setError] = useState("");

  async function submit() {
    if (!label.trim()) return setError(t("errors.label"));
    setError("");
    const ok = await onSubmit({
      label: label.trim(),
      note: note.trim() || undefined,
    });
    if (ok) closeRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Tab</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <Field label={t("tab_label")}>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              placeholder={t("tab_label_placeholder")}
            />
          </Field>
          <Field label={t("note")}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
              placeholder={t("note_placeholder")}
            />
          </Field>
          {error && <span className="text-[1.2rem] text-failure">{error}</span>}
        </div>
        <DialogFooter>
          <ButtonPrimary className="w-full" disabled={busy} onClick={submit}>
            {busy ? <LoadingCircleSmall /> : t("save")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Adding to a tab that is already open — one tap per round. */
/**
 * Adding to a check that is already open.
 *
 * Builds a selection and sends it on submit, rather than firing a request per
 * tap: a guest ordering three more things is one decision, and the old
 * behaviour meant three round trips, three toasts and three board refreshes
 * while the server was still standing at the table.
 *
 * Same grid and the same tap-to-increment as opening a tab — it is the same
 * act, only against an existing check.
 */
function AddToTabDialog({
  catalog,
  busy,
  locale,
  onAdd,
}: {
  catalog: CatalogItem[];
  busy: boolean;
  locale: string;
  onAdd: (items: { itemId: string; quantity: number }[]) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "food" | "drink">("all");
  const [draft, setDraft] = useState<Record<string, number>>({});

  const byId = useMemo(
    () => new Map(catalog.map((item) => [item.itemId, item])),
    [catalog],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        return !needle || item.name.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [catalog, query, category]);

  const lines = useMemo(
    () =>
      Object.entries(draft)
        .map(([itemId, quantity]) => ({ item: byId.get(itemId)!, quantity }))
        .filter((line) => line.item),
    [draft, byId],
  );

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  function bump(itemId: string, by: number) {
    setDraft((current) => {
      const next = { ...current };
      const quantity = (next[itemId] ?? 0) + by;
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = quantity;
      return next;
    });
  }

  function reset() {
    setQuery("");
    setCategory("all");
    setDraft({});
  }

  async function submit() {
    const ok = await onAdd(
      lines.map((line) => ({
        itemId: line.item.itemId,
        quantity: line.quantity,
      })),
    );
    if (ok) {
      reset();
      closeRef.current?.click();
    }
  }

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && reset()}>
      <DialogTrigger asChild>
        <ButtonPrimary
          className="py-[7.5px] flex items-center justify-center gap-3"
          aria-label={t("add_to_tab")}
        >
          <AddCircle size="18" color="#fff" variant="Bulk" />
          <span className="hidden lg:inline">{t("add_to_tab")}</span>
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("add_to_tab")}
          </DialogTitle>
          <DialogDescription className="sr-only">Add to tab</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="bg-neutral-100 rounded-[30px] flex items-center justify-between flex-1 px-6 py-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_catalog")}
                className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
            <div className={`${filterRowClass} gap-2 lg:shrink-0`}>
              {(["all", "food", "drink"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`${pillClass} ${
                    category === value ? pillActive : pillIdle
                  }`}
                >
                  {t(`filter.${value}`)}
                </button>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <p className="text-[1.4rem] text-neutral-600 py-6">
              {catalog.length === 0 ? t("no_catalog_yet") : t("no_results")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[34vh] overflow-y-auto content-start">
              {results.map((item) => (
                <li key={item.itemId}>
                  <ItemTile
                    item={item}
                    quantity={draft[item.itemId] ?? 0}
                    locale={locale}
                    onAdd={() => bump(item.itemId, 1)}
                    onRemove={() => bump(item.itemId, -1)}
                  />
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              {lines.map((line) => (
                <span
                  key={line.item.itemId}
                  className="px-4 py-1 rounded-[30px] bg-primary-50 text-primary-500 text-[1.3rem] leading-7"
                >
                  {line.quantity}x {line.item.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <ButtonPrimary
            className="w-full"
            disabled={busy || lines.length === 0}
            onClick={submit}
          >
            {busy ? (
              <LoadingCircleSmall />
            ) : (
              `${t("add")} (${t("items_count", { count })})`
            )}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center gap-[5rem] py-20">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <Receipt2 size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
        {message}
      </p>
    </div>
  );
}
