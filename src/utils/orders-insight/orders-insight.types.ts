export type Period =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "all_time";

export type Currency = "GHS" | "USD" | "EUR" | "all";

export interface OrderItem {
  title: string;
  quantity: number;
  totalPrice: number;
}

export interface Customer {
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  deliveryLocation?: string | null;
}

export interface Attribution {
  source: string[];
  preference: string[];
}

export interface OrderInsight {
  id: number;
  sourceId: string;
  status: string;
  currency?: string | null;
  total: number;
  createdAt: string;

  customer?: Customer | null;
  items?: OrderItem[];
  attribution?: Attribution | null;
}

export interface StatusCounts {
  completed: number;
  delivered: number;
  awaiting_payment: number;
  [key: string]: number;
}

export interface RevenueByCountry {
  country: string;
  GHS: number;
  USD: number;
  EUR: number;
  orderCount: number;
}

export interface TopItem {
  title: string;
  totalQuantity: number;
  totalRevenueGHS: number;
  totalRevenueUSD: number;
  totalRevenueEUR: number;
}

export interface CountryProductStat {
  title: string;
  totalQuantity: number;
  totalRevenue: number; // in that country's native currency
  currency: "GHS" | "USD" | "EUR";
}

export interface CountryBreakdown {
  country: string;
  currency: "GHS" | "USD" | "EUR";
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusCounts: StatusCounts;
  topItems: CountryProductStat[];
}

export interface OrdersInsightsSummary {
  totalOrders: number;
  statusCounts: StatusCounts;
  revenue: {
    GHS: number;
    USD: number;
    EUR: number;
  };
  averageOrderValue: {
    GHS: number;
    USD: number;
    EUR: number;
  };
  revenueByCountry: RevenueByCountry[];
  topItems: TopItem[];
  byCountry: CountryBreakdown[]; // new
}

export interface OrdersInsightsResponse {
  orders: OrderInsight[];
  summary: OrdersInsightsSummary | null;
  nextCursor: string | null;
}
