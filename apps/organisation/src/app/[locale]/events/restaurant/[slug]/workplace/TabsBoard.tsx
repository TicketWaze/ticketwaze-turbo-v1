"use client";
import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { AddCircle, Minus, Receipt2, Trash } from "iconsax-reactjs";
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
import {
  ButtonPrimary,
  ButtonNeutral,
  ButtonRed,
} from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  OpenTab,
  UpdateTab,
  SettleTab,
  ReopenTab,
  DeleteTab,
  AddTabItem,
  UpdateTabItem,
  RemoveTabItem,
} from "@/actions/TabActions";
import type { CatalogItem, CustomerTab, TabItem } from "./types";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const pillClass =
  "shrink-0 px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer";
const roundButtonClass =
  "w-10 h-10 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

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
        <div className="flex gap-3 overflow-x-auto">
          {(["open", "closed", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`${pillClass} ${
                filter === value
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:text-deep-100"
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
              onReopen={() =>
                run(() => ReopenTab(orgId, restId, tab.tabId, token, locale))
              }
              onDelete={() =>
                run(() => DeleteTab(orgId, restId, tab.tabId, token, locale))
              }
              onAddItem={(itemId) =>
                run(() =>
                  AddTabItem(orgId, restId, tab.tabId, token, locale, {
                    itemId,
                  }),
                )
              }
              onSetQuantity={(tabItemId, quantity) =>
                run(() =>
                  UpdateTabItem(
                    orgId,
                    restId,
                    tab.tabId,
                    tabItemId,
                    token,
                    locale,
                    quantity,
                  ),
                )
              }
              onRemoveItem={(tabItemId) =>
                run(() =>
                  RemoveTabItem(
                    orgId,
                    restId,
                    tab.tabId,
                    tabItemId,
                    token,
                    locale,
                  ),
                )
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
  onReopen,
  onDelete,
  onAddItem,
  onSetQuantity,
  onRemoveItem,
}: {
  tab: CustomerTab;
  catalog: CatalogItem[];
  busy: boolean;
  locale: string;
  onRename: (payload: { label: string; note?: string }) => Promise<boolean>;
  onSettle: (payload: {
    paymentMethod: "cash";
    amountTendered: number;
  }) => Promise<boolean>;
  onReopen: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onAddItem: (itemId: string) => Promise<boolean>;
  onSetQuantity: (tabItemId: string, quantity: number) => Promise<boolean>;
  onRemoveItem: (tabItemId: string) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const isOpen = tab.status === "open";
  const count = tab.items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="w-full p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 truncate">
              {tab.label}
            </span>
            <span
              className={`px-4 py-1 rounded-[30px] text-[1.1rem] font-medium uppercase ${
                isOpen
                  ? "bg-success/10 text-success"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {t(`status.${tab.status}`)}
            </span>
          </div>
          <span className="text-[1.2rem] text-neutral-600">
            {t("items_count", { count })}
            {tab.note ? ` · ${tab.note}` : ""}
          </span>
        </div>
        <span className="text-[1.8rem] font-medium leading-8 text-primary-500 shrink-0">
          {display(tab.total, tab.usdTotal, tab.currency, locale)}
        </span>
      </div>

      {/* What was actually taken at the counter, kept visible after the fact —
          a change dispute an hour later is settled by this line. */}
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

      <ul className="flex flex-col divide-y divide-neutral-100">
        {tab.items.map((line) => (
          <TabLine
            key={line.tabItemId}
            line={line}
            busy={busy}
            locale={locale}
            editable={isOpen}
            /* The last line cannot go: an empty tab is exactly what opening one
               refuses to create. Deleting the tab is the way out. */
            isOnlyLine={tab.items.length === 1}
            onSetQuantity={(quantity) => onSetQuantity(line.tabItemId, quantity)}
            onRemove={() => onRemoveItem(line.tabItemId)}
          />
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {isOpen && (
          <AddToTabDialog
            catalog={catalog}
            busy={busy}
            locale={locale}
            onPick={onAddItem}
          />
        )}
        <EditTabDialog
          trigger={
            <ButtonNeutral className="py-[7.5px]">{t("edit")}</ButtonNeutral>
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
          />
        ) : (
          <ButtonNeutral
            className="py-[7.5px]"
            disabled={busy}
            onClick={onReopen}
          >
            {t("reopen_tab")}
          </ButtonNeutral>
        )}
        <ConfirmDelete
          title={t("delete_tab")}
          body={t("delete_tab_warning")}
          busy={busy}
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

function TabLine({
  line,
  busy,
  locale,
  editable,
  isOnlyLine,
  onSetQuantity,
  onRemove,
}: {
  line: TabItem;
  busy: boolean;
  locale: string;
  editable: boolean;
  isOnlyLine: boolean;
  onSetQuantity: (quantity: number) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const atLastUnit = line.quantity === 1;
  const locked = isOnlyLine && atLastUnit;

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

      {editable ? (
        <div className="flex items-center gap-3 shrink-0">
          {/* One tap down, and at 1 the next tap removes the line entirely —
              a server does not want a two-step "set to zero, then delete". */}
          <button
            type="button"
            disabled={busy || locked}
            title={locked ? t("last_item") : undefined}
            onClick={() =>
              atLastUnit ? onRemove() : onSetQuantity(line.quantity - 1)
            }
            className={roundButtonClass}
          >
            <Minus size="14" color="#737C8A" variant="Bulk" />
          </button>
          <span className="text-[1.4rem] font-medium text-deep-100 w-8 text-center">
            {line.quantity}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetQuantity(line.quantity + 1)}
            className={roundButtonClass}
          >
            <AddCircle size="14" color="#737C8A" variant="Bulk" />
          </button>
        </div>
      ) : (
        <span className="text-[1.4rem] text-neutral-600 shrink-0">
          x{line.quantity}
        </span>
      )}

      <span className="text-[1.5rem] font-medium leading-8 text-deep-100 shrink-0 w-32 text-right">
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

// ── Catalogue picker ───────────────────────────────────────────────────────

/**
 * Search, filter, pick. Unavailable dishes are shown greyed and cannot be
 * picked rather than hidden — a server looking for something that ran out needs
 * to see that it ran out, not wonder whether they misremembered the menu.
 */
function CatalogPicker({
  catalog,
  busy,
  locale,
  onPick,
}: {
  catalog: CatalogItem[];
  busy: boolean;
  locale: string;
  onPick: (itemId: string) => void;
}) {
  const t = useTranslations("Events.workplace");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "food" | "drink">("all");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      return !needle || item.name.toLowerCase().includes(needle);
    });
  }, [catalog, query, category]);

  return (
    <div className="flex flex-col gap-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass}
        placeholder={t("search_catalog")}
      />
      <div className="flex gap-3">
        {(["all", "food", "drink"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`${pillClass} ${
              category === value
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {t(`filter.${value}`)}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-neutral-100 max-h-[32vh] overflow-y-auto">
        {results.length === 0 && (
          <li className="text-[1.4rem] text-neutral-600 py-6">
            {catalog.length === 0 ? t("no_catalog_yet") : t("no_results")}
          </li>
        )}
        {results.map((item) => (
          <li
            key={item.itemId}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="flex flex-col min-w-0">
              <span
                className={`text-[1.5rem] font-medium leading-8 text-deep-100 truncate ${
                  item.isAvailable ? "" : "opacity-50"
                }`}
              >
                {item.name}
              </span>
              <span className="text-[1.2rem] text-neutral-600">
                {display(item.price, item.usdPrice, item.currency, locale)}
                {item.isAvailable ? "" : ` · ${t("unavailable")}`}
              </span>
            </div>
            <ButtonNeutral
              className="py-[7.5px] shrink-0"
              disabled={busy || !item.isAvailable}
              onClick={() => onPick(item.itemId)}
            >
              {t("add")}
            </ButtonNeutral>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Dialogs ────────────────────────────────────────────────────────────────

/**
 * Opening a tab is one step, not two: a name and what they ordered. The venue
 * opens a tab *because* an order was placed, so the order comes with it and no
 * empty rows can reach the board.
 */
function OpenTabDialog({
  catalog,
  currency,
  busy,
  locale,
  onSubmit,
}: {
  catalog: CatalogItem[];
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
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const byId = useMemo(
    () => new Map(catalog.map((item) => [item.itemId, item])),
    [catalog],
  );

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
    setDraft({});
    setError("");
  }

  async function submit() {
    if (!label.trim()) return setError(t("errors.label"));
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
          <DialogDescription className="text-[1.4rem] leading-7 text-neutral-600 pt-4">
            {t("open_tab_hint")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 max-h-[60vh] overflow-y-auto">
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

          <div className="flex flex-col gap-4 border-t border-neutral-100 pt-6">
            <span className="text-[1.4rem] font-medium text-neutral-700">
              {t("open_tab_order")}
            </span>
            <CatalogPicker
              catalog={catalog}
              busy={busy}
              locale={locale}
              onPick={(itemId) => bump(itemId, 1)}
            />
          </div>

          {lines.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-6">
              <span className="text-[1.4rem] font-medium text-neutral-700">
                {t("on_this_tab")}
              </span>
              <ul className="flex flex-col divide-y divide-neutral-100">
                {lines.map((line) => (
                  <li
                    key={line.item.itemId}
                    className="flex items-center gap-4 py-4"
                  >
                    <span className="flex-1 min-w-0 text-[1.5rem] font-medium leading-8 text-deep-100 truncate">
                      {line.item.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => bump(line.item.itemId, -1)}
                        className={roundButtonClass}
                      >
                        <Minus size="14" color="#737C8A" variant="Bulk" />
                      </button>
                      <span className="text-[1.4rem] font-medium text-deep-100 w-8 text-center">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => bump(line.item.itemId, 1)}
                        className={roundButtonClass}
                      >
                        <AddCircle size="14" color="#737C8A" variant="Bulk" />
                      </button>
                    </div>
                    <span className="text-[1.5rem] font-medium leading-8 text-deep-100 shrink-0 w-32 text-right">
                      {display(
                        line.item.price * line.quantity,
                        line.item.usdPrice * line.quantity,
                        line.item.currency,
                        locale,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[1.5rem] font-medium text-deep-100">
                  {t("draft_total")}
                </span>
                <span className="text-[1.8rem] font-medium leading-8 text-primary-500">
                  {display(totals.htg, totals.usd, currency, locale)}
                </span>
              </div>
            </div>
          )}

          {error && <span className="text-[1.2rem] text-failure">{error}</span>}
        </div>

        <DialogFooter>
          <ButtonPrimary className="w-full" disabled={busy} onClick={submit}>
            {busy ? <LoadingCircleSmall /> : t("open_tab")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
}: {
  tab: CustomerTab;
  busy: boolean;
  locale: string;
  onSettle: (payload: {
    paymentMethod: "cash";
    amountTendered: number;
  }) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [tendered, setTendered] = useState("");
  const [error, setError] = useState("");

  // The guest pays what the tab shows them, in the currency the venue prices in.
  const due = tab.currency === "USD" ? tab.usdTotal : tab.total;
  const received = Number(tendered);
  const hasAmount = tendered.trim() !== "" && Number.isFinite(received);
  const change = hasAmount ? received - due : 0;
  const short = hasAmount && change < 0;
  const canSettle = hasAmount && !short;

  function reset() {
    setMethod("cash");
    setTendered("");
    setError("");
  }

  async function submit() {
    if (!canSettle) return setError(t("errors.tendered"));
    setError("");
    const ok = await onSettle({
      paymentMethod: "cash",
      amountTendered: received,
    });
    if (ok) {
      reset();
      closeRef.current?.click();
    }
  }

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && reset()}>
      <DialogTrigger asChild>
        <ButtonPrimary className="py-[7.5px]">{t("close_tab")}</ButtonPrimary>
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
function AddToTabDialog({
  catalog,
  busy,
  locale,
  onPick,
}: {
  catalog: CatalogItem[];
  busy: boolean;
  locale: string;
  onPick: (itemId: string) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonPrimary className="py-[7.5px] flex items-center gap-3">
          <AddCircle size="18" color="#fff" variant="Bulk" />
          {t("add_to_tab")}
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("add_to_tab")}
          </DialogTitle>
          <DialogDescription className="sr-only">Add to tab</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CatalogPicker
            catalog={catalog}
            busy={busy}
            locale={locale}
            onPick={onPick}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({
  title,
  body,
  busy,
  onConfirm,
}: {
  title: string;
  body: string;
  busy: boolean;
  onConfirm: () => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);

  async function confirm() {
    const ok = await onConfirm();
    if (ok) closeRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonNeutral className="py-[7.5px] flex items-center gap-3">
          <Trash size="18" color="#DE0028" variant="Bulk" />
          {t("delete")}
        </ButtonNeutral>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Delete</DialogDescription>
        </DialogHeader>
        <p className="text-[1.5rem] leading-8 text-neutral-600 py-4">{body}</p>
        <DialogFooter>
          <ButtonRed className="w-full" disabled={busy} onClick={confirm}>
            {busy ? <LoadingCircleSmall /> : t("delete")}
          </ButtonRed>
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
