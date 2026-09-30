/**
 * Shapes returned by /admin/finance/*. Every amount comes in both currencies,
 * converted at each order's own snapshot rate — see services/finance.ts in the
 * API for how each figure is derived and which ones are estimates.
 */
export type Money = { htg: number; usd: number };

export type FinancePeriod = "all" | "this_month" | "last_month" | "this_year";

export const FINANCE_PERIODS: FinancePeriod[] = [
  "all",
  "this_month",
  "last_month",
  "this_year",
];

export type ActivityType = "event" | "raffle" | "sale" | "restaurant";

type ChannelTotals = { gross: Money; net: Money };

export type FinanceSummary = {
  period: FinancePeriod;
  gross: Money;
  net: Money;
  collected: Money;
  channels: {
    moncash: ChannelTotals;
    stripe: ChannelTotals;
    natcash: ChannelTotals;
    wallet: ChannelTotals;
    other: ChannelTotals;
  };
  breakdown: {
    activityFees: Money;
    subscriptions: Money;
    processing: Money;
    tokens: Money;
    giveaways: Money;
    refunds: Money;
  };
};

export type FinanceActivityRow = {
  activityId: string;
  activityType: ActivityType;
  name: string;
  organisationId: string;
  organisationName: string;
  currency: string;
  unitsSold: number;
  orders: number;
  collected: Money;
  fees: Money;
  net: Money;
  lastSaleAt: string | null;
};

export type FinanceActivitiesPage = {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    firstPage: number;
    lastPage: number;
  };
  data: FinanceActivityRow[];
};

type MoneyBlock = {
  orders: number;
  collected: Money;
  organiserCredit: Money;
  fees: Money;
  tokens: Money;
  giveaways: Money;
  processing: Money;
};

export type FinanceActivityDetail = {
  activity: {
    activityId: string;
    activityType: ActivityType;
    name: string;
    organisationId: string;
    organisationName: string;
    currency: string;
    status: string | null;
    cancelledAt: string | null;
    absorbFees: boolean;
    hasFeeOverride: boolean;
    balanceReleasedAt: string | null;
  };
  period: FinancePeriod;
  counts: {
    unitsSold: number;
    orders: number;
    returnedOrders: number;
    giveawayTickets: number;
    rewardTickets: number;
    refundedTickets: number;
    firstSaleAt: string | null;
    lastSaleAt: string | null;
  };
  money: MoneyBlock & {
    refundsPaid: Money;
    refundsDebited: Money;
    refundCost: Money;
    net: Money;
  };
  byProvider: (MoneyBlock & { provider: string; net: Money })[];
  pricing: {
    name: string;
    price: Money;
    currency: string;
    quantity: number | null;
    sold: number | null;
  }[];
  itemsSold: {
    name: string;
    unitPrice: Money;
    quantity: number;
    total: Money;
  }[];
  recentOrders: {
    orderId: string;
    orderName: string;
    provider: string;
    status: string;
    createdAt: string;
    collected: Money;
    fees: Money;
    tokens: Money;
  }[];
};

export const EMPTY_MONEY: Money = { htg: 0, usd: 0 };

export function formatAmount(n: number) {
  return (n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** An amount in the currency it is naturally read in, e.g. "1,250.00 HTG". */
export function formatMoney(money: Money, currency: string) {
  return currency === "USD"
    ? `${formatAmount(money.usd)} USD`
    : `${formatAmount(money.htg)} HTG`;
}
