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

/**
 * A single day with everything that happened on it. What `GET
 * /service-days/:id` returns, as opposed to the summary rows in the list.
 */
export interface ServiceDayDetail extends ServiceDay {
  tabs: CustomerTab[];
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

/**
 * Money the venue is holding for a named guest — change it could not give, or a
 * float left on purpose. Keyed on a name the venue types, never on a tab label:
 * a tab is usually a table, and two guests at "Table 4" are not one customer.
 */
export interface CustomerCredit {
  customerCreditId: string;
  restaurantId: string;
  customerName: string;
  balance: number;
  currency: string;
  note: string | null;
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
  /** Cash actually handed back — change kept as credit is not counted here. */
  changeGiven: number | null;
  /** Who this check belongs to, when a balance was involved. Not the label. */
  customerName: string | null;
  /** Balance spent on this check. */
  creditApplied: number;
  /** Change the venue could not give, left on the guest's balance instead. */
  creditKept: number;
  closedAt: string | null;
  settledAt: string | null;
  createdAt: string;
  items: TabItem[];
}
