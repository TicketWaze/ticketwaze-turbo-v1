/** What the venue serves, flat. The menu tree is the API's business, not the UI's. */
export interface CatalogItem {
  itemId: string;
  name: string;
  description: string | null;
  category: "food" | "drink";
  price: number;
  usdPrice: number;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

/**
 * One line on a check. Name and price are snapshots taken when the line was
 * added, so repricing a dish tomorrow cannot restate what a guest already
 * agreed to pay.
 */
export interface TabItem {
  tabItemId: string;
  itemId: string | null;
  name: string;
  category: "food" | "drink";
  unitPrice: number;
  usdUnitPrice: number;
  currency: string;
  quantity: number;
}

/**
 * A trading day. The venue opens and closes it by hand — no clock guesses on
 * its behalf — and every tab belongs to exactly one, which is what stops one
 * day's takings merging into the next.
 */
export interface ServiceDay {
  serviceDayId: string;
  restaurantId: string;
  businessDate: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  /** Frozen at close; zero while the day is still running (use DayTotals). */
  totalSales: number;
  usdTotalSales: number;
  cashSales: number;
  usdCashSales: number;
  tabCount: number;
  itemCount: number;
  currency: string;
  note: string | null;
}

/** Live figures for the day in progress. Only settled tabs count as sales. */
export interface DayTotals {
  totalSales: number;
  usdTotalSales: number;
  cashSales: number;
  usdCashSales: number;
  tabCount: number;
  itemCount: number;
  openTabs: number;
}

export interface CustomerTab {
  tabId: string;
  restaurantId: string;
  serviceDayId: string | null;
  label: string;
  note: string | null;
  status: "open" | "closed";
  total: number;
  usdTotal: number;
  currency: string;
  /** Settlement is a record of what happened at the counter — cash books no fee. */
  paymentMethod: "cash" | "online" | null;
  amountTendered: number | null;
  changeGiven: number | null;
  closedAt: string | null;
  settledAt: string | null;
  createdAt: string;
  items: TabItem[];
}
