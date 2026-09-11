import { z } from "zod";
import { eq, and, or, inArray, gte, lte, desc, lt } from "drizzle-orm";

import { deliveryLocation, order } from "../../../db/schema.js";
import { db } from "../../models/db_connection.js";
import {
  TopItem,
  CountryBreakdown,
  CountryProductStat,
  Currency,
  Customer,
  OrderInsight,
  OrderItem,
  OrdersInsightsResponse,
  OrdersInsightsSummary,
  RevenueByCountry,
  StatusCounts,
} from "../../utils/orders-insight/orders-insight.types.js";
import { ordersInsightsQuerySchema } from "../../utils/orders-insight/orders-insight.schema.js";
import { formatCountry } from "../../utils/orders-insight/orders-insight.utils.js";

type OrdersInsightsQuery = z.infer<typeof ordersInsightsQuerySchema>;

export class OrdersInsightsService {
  private async computeFullSummary(params: {
    from?: string;
    to?: string;
    currency?: Currency;
    includeItems?: boolean;
    includeCustomer?: boolean;
  }): Promise<OrdersInsightsSummary> {
    const {
      from,
      to,
      currency = "all",
      includeItems,
      includeCustomer,
    } = params;

    const conditions: any[] = [eq(order.deletedMode, false)];

    if (from && to) {
      conditions.push(gte(order.createdAt, from), lte(order.createdAt, to));
    }

    const orders = await db.query.order.findMany({
      where: and(...conditions),
      orderBy: [desc(order.createdAt), desc(order.id)],
    });

    if (!orders.length) {
      return {
        totalOrders: 0,
        statusCounts: {} as StatusCounts,
        revenue: { GHS: 0, USD: 0, EUR: 0 },
        averageOrderValue: { GHS: 0, USD: 0, EUR: 0 },
        revenueByCountry: [],
        topItems: [],
        byCountry: [],
      };
    }

    const orderIds = orders.map((o) => o.id);

    const [items, customers] = await Promise.all([
      includeItems
        ? db.query.orderCartItem.findMany({
            where: (fields, { inArray }) => inArray(fields.orderId, orderIds),
          })
        : [],
      includeCustomer
        ? db.query.orderUserDetail.findMany({
            where: (fields, { inArray }) => inArray(fields.orderId, orderIds),
          })
        : [],
    ]);

    // --- Build Maps ---

    const itemsMap = new Map<number, OrderItem[]>();
    items.forEach((i) => {
      if (!itemsMap.has(i.orderId)) itemsMap.set(i.orderId, []);
      itemsMap.get(i.orderId)!.push({
        title: i.title,
        quantity: i.quantity,
        totalPrice: Number(i.totalPrice),
      });
    });

    const deliveryLocationIds = customers
      .map((c) => c.deliveryLocationId)
      .filter((id): id is number => !!id);

    const locations = deliveryLocationIds.length
      ? await db
          .select()
          .from(deliveryLocation)
          .where(inArray(deliveryLocation.id, deliveryLocationIds))
      : [];

    const locationMap = new Map<number, string>();
    locations.forEach((loc) => {
      locationMap.set(loc.id, loc.location);
    });

    const customerMap = new Map<number, Customer>();
    customers.forEach((c) => {
      customerMap.set(c.orderId, {
        country: c.country,
        firstName: c.firstName,
        lastName: c.lastName,
        deliveryLocation: c.deliveryLocationId
          ? locationMap.get(c.deliveryLocationId) || null
          : null,
      });
    });

    // --- Format ---

    const formatted = orders
      .filter((o) => {
        if (currency === "all") return true;
        return o.currency === currency;
      })
      .map((o) => ({
        id: o.id,
        status: o.status,
        currency: o.currency,
        total: Number(o.totalAmount),
        subTotal: Number(o.subtotal),
        customer: customerMap.get(o.id) || null,
        items: itemsMap.get(o.id) || [],
      }));

    // --- Global Aggregates ---

    const REVENUE_STATUSES = new Set(["completed", "delivered"]);
    const revenueOrders = formatted.filter((o) =>
      REVENUE_STATUSES.has(o.status),
    );

    const statusCounts = formatted.reduce((acc, o) => {
      const s = o.status ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {} as StatusCounts);

    const revenue = revenueOrders.reduce(
      (acc, o) => {
        const c = o.currency as "GHS" | "USD" | "EUR";
        if (c in acc) acc[c] += o.total;
        return acc;
      },
      { GHS: 0, USD: 0, EUR: 0 },
    );

    const currencyOrderCounts = revenueOrders.reduce(
      (acc, o) => {
        const c = o.currency as "GHS" | "USD" | "EUR";
        if (c in acc) acc[c] += 1;
        return acc;
      },
      { GHS: 0, USD: 0, EUR: 0 },
    );

    const averageOrderValue = {
      GHS:
        currencyOrderCounts.GHS > 0 ? revenue.GHS / currencyOrderCounts.GHS : 0,
      USD:
        currencyOrderCounts.USD > 0 ? revenue.USD / currencyOrderCounts.USD : 0,
      EUR:
        currencyOrderCounts.EUR > 0 ? revenue.EUR / currencyOrderCounts.EUR : 0,
    };

    // --- Global Revenue by Country ---

    const countryRevenueMap = new Map<
      string,
      { GHS: number; USD: number; EUR: number; orderCount: number }
    >();

    revenueOrders.forEach((o) => {
      const country = formatCountry(o.customer?.country);
      const existing = countryRevenueMap.get(country) ?? {
        GHS: 0,
        USD: 0,
        EUR: 0,
        orderCount: 0,
      };
      const c = o.currency as "GHS" | "USD" | "EUR";
      countryRevenueMap.set(country, {
        ...existing,
        [c]: existing[c] + o.total,
        orderCount: existing.orderCount + 1,
      });
    });

    const revenueByCountry: RevenueByCountry[] = Array.from(
      countryRevenueMap.entries(),
    ).map(([country, data]) => ({ country, ...data }));

    // --- Global Top Items ---

    const itemsAggMap = new Map<
      string,
      {
        totalQuantity: number;
        totalRevenueGHS: number;
        totalRevenueUSD: number;
        totalRevenueEUR: number;
      }
    >();

    revenueOrders.forEach((o) => {
      const c = o.currency as "GHS" | "USD" | "EUR";
      o.items?.forEach((item) => {
        const existing = itemsAggMap.get(item.title) ?? {
          totalQuantity: 0,
          totalRevenueGHS: 0,
          totalRevenueUSD: 0,
          totalRevenueEUR: 0,
        };
        itemsAggMap.set(item.title, {
          totalQuantity: existing.totalQuantity + item.quantity,
          totalRevenueGHS:
            existing.totalRevenueGHS + (c === "GHS" ? item.totalPrice : 0),
          totalRevenueUSD:
            existing.totalRevenueUSD + (c === "USD" ? item.totalPrice : 0),
          totalRevenueEUR:
            existing.totalRevenueEUR + (c === "EUR" ? item.totalPrice : 0),
        });
      });
    });

    const topItems: TopItem[] = Array.from(itemsAggMap.entries())
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // --- Per-Country Breakdown ---

    const countryOrdersMap = new Map<string, typeof formatted>();

    formatted.forEach((o) => {
      const country = formatCountry(o.customer?.country);
      if (!countryOrdersMap.has(country)) countryOrdersMap.set(country, []);
      countryOrdersMap.get(country)!.push(o);
    });

    const byCountry: CountryBreakdown[] = Array.from(
      countryOrdersMap.entries(),
    ).map(([country, countryOrders]) => {
      const countryRevenueOrders = countryOrders.filter((o) =>
        REVENUE_STATUSES.has(o.status),
      );

      const countryCurrency = (countryOrders[0]?.currency ?? "GHS") as
        | "GHS"
        | "USD"
        | "EUR";

      const totalRevenue = countryRevenueOrders.reduce(
        (sum, o) => sum + o.total,
        0,
      );

      const averageOrderValue =
        countryRevenueOrders.length > 0
          ? totalRevenue / countryRevenueOrders.length
          : 0;

      const countryStatusCounts = countryOrders.reduce((acc, o) => {
        const s = o.status ?? "unknown";
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {} as StatusCounts);

      const countryItemsMap = new Map<
        string,
        { totalQuantity: number; totalRevenue: number }
      >();

      countryRevenueOrders.forEach((o) => {
        o.items?.forEach((item) => {
          const existing = countryItemsMap.get(item.title) ?? {
            totalQuantity: 0,
            totalRevenue: 0,
          };
          countryItemsMap.set(item.title, {
            totalQuantity: existing.totalQuantity + item.quantity,
            totalRevenue: existing.totalRevenue + item.totalPrice,
          });
        });
      });

      const countryTopItems: CountryProductStat[] = Array.from(
        countryItemsMap.entries(),
      )
        .map(([title, data]) => ({ title, currency: countryCurrency, ...data }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      return {
        country,
        currency: countryCurrency,
        totalOrders: countryOrders.length,
        totalRevenue,
        averageOrderValue,
        statusCounts: countryStatusCounts,
        topItems: countryTopItems,
      };
    });

    return {
      totalOrders: formatted.length,
      statusCounts,
      revenue,
      averageOrderValue,
      revenueByCountry,
      topItems,
      byCountry,
    };
  }

  async getOrdersInsights(
    query_params: OrdersInsightsQuery,
  ): Promise<OrdersInsightsResponse> {
    const {
      from,
      to,
      currency = "all",
      includeItems,
      includeCustomer,
      includeAttribution,
      cursor,
      limit = 100,
    } = query_params;

    // Branch off immediately if summaryOnly
    const summaryOnly =
      query_params.summaryOnly === true ||
      (query_params.summaryOnly as any) === "true";

    if (summaryOnly) {
      const summary = await this.computeFullSummary({
        from: from as string,
        to: to as string,
        currency: currency as Currency,
        includeItems: includeItems === true || (includeItems as any) === "true",
        includeCustomer:
          includeCustomer === true || (includeCustomer as any) === "true",
      });

      return {
        orders: [],
        summary,
        nextCursor: null,
      };
    }

    const conditions: any[] = [eq(order.deletedMode, false)];

    if (from && to) {
      conditions.push(gte(order.createdAt, from), lte(order.createdAt, to));
    }

    let cursorCondition = null;

    if (cursor && cursor.trim()) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
      cursorCondition = decoded;
    }

    const orders = await db.query.order.findMany({
      where: (fields) => {
        const base = and(...conditions);

        if (!cursorCondition) return base;

        return and(
          base,
          or(
            lt(fields.createdAt, cursorCondition.createdAt),
            and(
              eq(fields.createdAt, cursorCondition.createdAt),
              lt(fields.id, cursorCondition.id),
            ),
          ),
        );
      },
      orderBy: [desc(order.createdAt), desc(order.id)],
      limit: limit ? Number(limit) : 100,
    });

    if (!orders.length) {
      return { orders: [], summary: null, nextCursor: null };
    }

    const orderIds = orders.map((o) => o.id);

    const [items, customers, attributions] = await Promise.all([
      includeItems === true || (includeItems as any) === "true"
        ? db.query.orderCartItem.findMany({
            where: (fields, { inArray }) => inArray(fields.orderId, orderIds),
          })
        : [],
      includeCustomer === true || (includeCustomer as any) === "true"
        ? db.query.orderUserDetail.findMany({
            where: (fields, { inArray }) => inArray(fields.orderId, orderIds),
          })
        : [],
      includeAttribution === true || (includeAttribution as any) === "true"
        ? db.query.attributionAndPreferences.findMany({
            where: (fields, { inArray }) => inArray(fields.orderId, orderIds),
          })
        : [],
    ]);

    // --- Build Maps ---

    const itemsMap = new Map<number, OrderItem[]>();
    items.forEach((i) => {
      if (!itemsMap.has(i.orderId)) itemsMap.set(i.orderId, []);
      itemsMap.get(i.orderId)!.push({
        title: i.title,
        quantity: i.quantity,
        totalPrice: Number(i.totalPrice),
      });
    });

    const deliveryLocationIds = customers
      .map((c) => c.deliveryLocationId)
      .filter((id): id is number => !!id);

    const locations = deliveryLocationIds.length
      ? await db
          .select()
          .from(deliveryLocation)
          .where(inArray(deliveryLocation.id, deliveryLocationIds))
      : [];

    const locationMap = new Map<number, string>();
    locations.forEach((loc) => {
      locationMap.set(loc.id, loc.location);
    });

    const customerMap = new Map<number, Customer>();
    customers.forEach((c) => {
      customerMap.set(c.orderId, {
        country: c.country,
        firstName: c.firstName,
        lastName: c.lastName,
        deliveryLocation: c.deliveryLocationId
          ? locationMap.get(c.deliveryLocationId) || null
          : null,
      });
    });

    const attributionMap = new Map<number, any>();
    attributions.forEach((a) => {
      attributionMap.set(a.orderId, {
        source: a.attributionAnswer || [],
        preference: a.preferenceAnswer || [],
      });
    });

    // --- Format Orders ---

    const formatted = orders
      .filter((o) => {
        if (currency === "all") return true;
        return o.currency === currency;
      })
      .map((o) => ({
        id: o.id,
        sourceId: o.sourceId,
        status: o.status,
        currency: o.currency,
        total: Number(o.totalAmount),
        subTotal: Number(o.subtotal),
        createdAt: o.createdAt,
        customer: includeCustomer ? customerMap.get(o.id) || null : undefined,
        items: includeItems ? itemsMap.get(o.id) || [] : undefined,
        attribution: includeAttribution
          ? attributionMap.get(o.id) || null
          : undefined,
      }));

    // --- Global Aggregates ---

    const REVENUE_STATUSES = new Set(["completed", "delivered"]);
    const revenueOrders = formatted.filter((o) =>
      REVENUE_STATUSES.has(o.status),
    );

    const statusCounts = formatted.reduce((acc, o) => {
      const s = o.status ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {} as StatusCounts);

    const revenue = revenueOrders.reduce(
      (acc, o) => {
        const c = o.currency as "GHS" | "USD" | "EUR";
        if (c in acc) acc[c] += o.total;
        return acc;
      },
      { GHS: 0, USD: 0, EUR: 0 },
    );

    const currencyOrderCounts = revenueOrders.reduce(
      (acc, o) => {
        const c = o.currency as "GHS" | "USD" | "EUR";
        if (c in acc) acc[c] += 1;
        return acc;
      },
      { GHS: 0, USD: 0, EUR: 0 },
    );

    const averageOrderValue = {
      GHS:
        currencyOrderCounts.GHS > 0 ? revenue.GHS / currencyOrderCounts.GHS : 0,
      USD:
        currencyOrderCounts.USD > 0 ? revenue.USD / currencyOrderCounts.USD : 0,
      EUR:
        currencyOrderCounts.EUR > 0 ? revenue.EUR / currencyOrderCounts.EUR : 0,
    };

    // --- Global Revenue by Country ---

    const countryRevenueMap = new Map<
      string,
      { GHS: number; USD: number; EUR: number; orderCount: number }
    >();

    revenueOrders.forEach((o) => {
      const country = formatCountry(o.customer?.country);
      const existing = countryRevenueMap.get(country) ?? {
        GHS: 0,
        USD: 0,
        EUR: 0,
        orderCount: 0,
      };
      const c = o.currency as "GHS" | "USD" | "EUR";
      countryRevenueMap.set(country, {
        ...existing,
        [c]: existing[c] + o.total,
        orderCount: existing.orderCount + 1,
      });
    });

    const revenueByCountry: RevenueByCountry[] = Array.from(
      countryRevenueMap.entries(),
    ).map(([country, data]) => ({ country, ...data }));

    // --- Global Top Items ---

    const itemsAggMap = new Map<
      string,
      {
        totalQuantity: number;
        totalRevenueGHS: number;
        totalRevenueUSD: number;
        totalRevenueEUR: number;
      }
    >();

    revenueOrders.forEach((o) => {
      const c = o.currency as "GHS" | "USD" | "EUR";
      o.items?.forEach((item) => {
        const existing = itemsAggMap.get(item.title) ?? {
          totalQuantity: 0,
          totalRevenueGHS: 0,
          totalRevenueUSD: 0,
          totalRevenueEUR: 0,
        };
        itemsAggMap.set(item.title, {
          totalQuantity: existing.totalQuantity + item.quantity,
          totalRevenueGHS:
            existing.totalRevenueGHS + (c === "GHS" ? item.totalPrice : 0),
          totalRevenueUSD:
            existing.totalRevenueUSD + (c === "USD" ? item.totalPrice : 0),
          totalRevenueEUR:
            existing.totalRevenueEUR + (c === "EUR" ? item.totalPrice : 0),
        });
      });
    });

    const topItems: TopItem[] = Array.from(itemsAggMap.entries())
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // --- Per-Country Breakdown ---

    const countryOrdersMap = new Map<string, typeof formatted>();

    formatted.forEach((o) => {
      const country = formatCountry(o.customer?.country);
      if (!countryOrdersMap.has(country)) countryOrdersMap.set(country, []);
      countryOrdersMap.get(country)!.push(o);
    });

    const byCountry: CountryBreakdown[] = Array.from(
      countryOrdersMap.entries(),
    ).map(([country, countryOrders]) => {
      const countryRevenueOrders = countryOrders.filter((o) =>
        REVENUE_STATUSES.has(o.status),
      );

      const countryCurrency = (countryOrders[0]?.currency ?? "GHS") as
        | "GHS"
        | "USD"
        | "EUR";

      const totalRevenue = countryRevenueOrders.reduce(
        (sum, o) => sum + o.total,
        0,
      );

      const averageOrderValue =
        countryRevenueOrders.length > 0
          ? totalRevenue / countryRevenueOrders.length
          : 0;

      const countryStatusCounts = countryOrders.reduce((acc, o) => {
        const s = o.status ?? "unknown";
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {} as StatusCounts);

      const countryItemsMap = new Map<
        string,
        { totalQuantity: number; totalRevenue: number }
      >();

      countryRevenueOrders.forEach((o) => {
        o.items?.forEach((item) => {
          const existing = countryItemsMap.get(item.title) ?? {
            totalQuantity: 0,
            totalRevenue: 0,
          };
          countryItemsMap.set(item.title, {
            totalQuantity: existing.totalQuantity + item.quantity,
            totalRevenue: existing.totalRevenue + item.totalPrice,
          });
        });
      });

      const countryTopItems: CountryProductStat[] = Array.from(
        countryItemsMap.entries(),
      )
        .map(([title, data]) => ({ title, currency: countryCurrency, ...data }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      return {
        country,
        currency: countryCurrency,
        totalOrders: countryOrders.length,
        totalRevenue,
        averageOrderValue,
        statusCounts: countryStatusCounts,
        topItems: countryTopItems,
      };
    });

    const summary: OrdersInsightsSummary = {
      totalOrders: formatted.length,
      statusCounts,
      revenue,
      averageOrderValue,
      revenueByCountry,
      topItems,
      byCountry,
    };

    const last = orders[orders.length - 1];
    const nextCursor = Buffer.from(
      JSON.stringify({
        id: last?.id,
        createdAt: last?.createdAt,
      }),
    ).toString("base64");

    return {
      orders: formatted as OrderInsight[],
      summary,
      nextCursor,
    };
  }
}
