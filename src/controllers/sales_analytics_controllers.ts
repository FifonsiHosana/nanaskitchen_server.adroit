import { and, desc, eq, or, sql } from "drizzle-orm";
import { order, orderCartItem, orderUserDetail } from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";
import {
  getPeriodCondition,
  getGroupFormat,
  validatePeriod,
  type Period,
  buildDateFilter,
  getCustomGroupFormat,
} from "../utils/period";
import { count } from "node:console";
import { derivedCurrency } from "../utils/country-currency";

const PRICE_GROUP_IDS: Record<string, number> = {
  retailer: 1,
  wholesaler: 2,
  distributor: 3,
};

export const parsePeriodAndCurrency = (req: Request) => {
  const {
    period = "all_time",
    currency,
    from,
    to,
    pricingGroup,
  } = req.query as Record<string, string>;
  const pgId = pricingGroup ? PRICE_GROUP_IDS[pricingGroup] : undefined;
  return { period, currency, from, to, pgId };
};

const periodError = (res: Response) =>
  res.status(400).json({
    message: `Invalid period. Use: today, this_week, this_month, last_month, this_year, last_year`,
  });

// GET /analytics/sales/revenue?period=this_month&currency=GHS
// Revenue and order count grouped by time (hour/day/month depending on period)
// {
//   period: "this_month",
//   currency: "all",
//   data: [
//     { period: "2024-12-01", totalRevenue: 450.00, orderCount: 3, currency: "GHS" },
//     { period: "2024-12-02", totalRevenue: 890.00, orderCount: 5, currency: "USD" }
//   ]
// }
export const getRevenueOverTime = async (req: Request, res: Response) => {
  try {
    const { period, from, to, currency, pgId } = parsePeriodAndCurrency(req);
    const groupFormat =
      from || to
        ? getCustomGroupFormat(from, to)
        : getGroupFormat(period as Period);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(sql`${derivedCurrency} = ${currency}`);
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const data = await db
      .select({
        period: sql<string>`DATE_FORMAT(${order.createdAt}, ${groupFormat})`,
        totalRevenue: sql<number>`SUM(CAST(${order.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
        currency: derivedCurrency,
        // country: orderUserDetail.country,
      })
      .from(order)
      .innerJoin(orderUserDetail, eq(orderUserDetail.orderId, order.id))
      .where(and(...conditions))
      .groupBy(
        sql`DATE_FORMAT(${order.createdAt}, ${groupFormat})`,
        derivedCurrency,
      )
      .orderBy(sql`DATE_FORMAT(${order.createdAt}, ${groupFormat}) ASC`);

    return res.status(200).json({ period, currency: currency ?? "all", data });
  } catch (error) {
    console.error(
      "getRevenueOverTime error:",
      error instanceof Error ? error.message : error,
    );
    return res.status(500).json({
      message: "status 500: Failed to fetch revenue",
      error: error instanceof Error ? error.message : String(error), // add this temporarily
    });
  }
};

// GET /analytics/sales/by-country?period=this_month
// Order count and revenue broken down by country
// {
//   period: "this_month",
//   data: [
//     { country: "GH", totalOrders: 120, totalRevenue: 5400.00 },
//     { country: "US", totalOrders: 45, totalRevenue: 9800.00 }
//   ]
// }
export const getSalesByCountry = async (req: Request, res: Response) => {
  try {
    const { period, from, to, pgId } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const data = await db
      .select({
        country: orderUserDetail.country,
        totalOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
      })
      .from(order)
      .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(orderUserDetail.country)
      .orderBy(sql`SUM(CAST(${order.totalAmount} AS DECIMAL)) DESC`);

    return res.status(200).json({ period, data });
  } catch (error) {
    console.error("getSalesByCountry error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch sales by country" });
  }
};

// GET /analytics/sales/top-products?period=this_month&limit=10
// Top products ranked by quantity sold and revenue
// {
//   period: "this_month",
//   data: [
//     { productName: "Kente Tote Bag", totalQuantity: 45, totalRevenue: 2025.00, totalOrders: 38 },
//     { productName: "Shea Butter Cream", totalQuantity: 30, totalRevenue: 360.00, totalOrders: 28 }
//   ]
// }
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const { limit = "10" } = req.query as Record<string, string>;
    const { period, from, to, currency, pgId } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const data = await db
      .select({
        productName: sql<string>`TRIM(TRAILING '.' FROM TRIM(${orderCartItem.title}))`,
        totalQuantity: sql<number>`SUM(${orderCartItem.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL))`,
        totalOrders: sql<number>`COUNT(DISTINCT ${orderCartItem.orderId})`,
      })
      .from(orderCartItem)
      .innerJoin(order, eq(order.id, orderCartItem.orderId))
      .where(and(...conditions))
      .groupBy(
        sql<string>`TRIM(TRAILING '.' FROM TRIM(${orderCartItem.title}))`,
      )
      .orderBy(sql`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL)) DESC`)
      .limit(Number(limit));

    return res.status(200).json({ period, data });
  } catch (error) {
    console.error("getTopProducts error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch `top product`s" });
  }
};

// GET /analytics/sales/by-product?period=this_month&currency=GHS
// Revenue and quantity per product for bar chart
// {
//   period: "this_month",
//   currency: "GHS",
//   data: [
//     { productName: "Kente Tote Bag", totalRevenue: 2025.00, totalQuantity: 45 },
//   ]
// }
export const getRevenueByProduct = async (req: Request, res: Response) => {
  try {
    const { period, from, to, currency, pgId } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const data = await db
      .select({
        productName: orderCartItem.title,
        totalRevenue: sql<number>`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL))`,
        totalQuantity: sql<number>`SUM(${orderCartItem.quantity})`,
      })
      .from(orderCartItem)
      .innerJoin(order, eq(order.id, orderCartItem.orderId))
      .where(and(...conditions))
      .groupBy(orderCartItem.title)
      .orderBy(sql`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL)) DESC`);

    return res.status(200).json({ period, currency: currency ?? "all", data });
  } catch (error) {
    console.error("getRevenueByProduct error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch revenue by product" });
  }
};

// GET /analytics/sales/order-status?period=this_month
// Order count per status for donut chart
// {
//   period: "this_month",
//   data: [
//     { status: "delivered", count: 120 },
//     { status: "awaiting_payment", count: 45 },
//     { status: "completed", count: 30 }
//   ]
// }
export const getOrderStatusBreakdown = async (req: Request, res: Response) => {
  try {
    const { period, from, to, currency, pgId } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);

    if (currency) conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const deletedConditions = [
      eq(order.deletedMode, true),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) deletedConditions.push(dateCondition);
    const data = await db
      .select({
        status: order.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(order.status);

    const deletedOrders = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(order)
      .where(and(...deletedConditions));

    return res.status(200).json({ period, data, deletedOrders });
  } catch (error) {
    console.error("getOrderStatusBreakdown error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch order status breakdown" });
  }
};

export const getAvgOrderValue = async (req: Request, res: Response) => {
  try {
    const { period, currency } = parsePeriodAndCurrency(req);
    if (!validatePeriod(period)) return periodError(res);

    const format = getGroupFormat(period as Period);
    const conditions: any[] = [
      eq(order.deletedMode, false),
      getPeriodCondition(period as Period, order.createdAt),
    ];
    if (currency) conditions.push(eq(order.currency, currency));

    const data = await db
      .select({
        period: sql<string>`DATE_FORMAT(${order.createdAt}, ${format})`,
        avgOrderValue: sql<number>`AVG(CAST(${order.totalAmount} AS DECIMAL))`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(sql`DATE_FORMAT(${order.createdAt}, ${format})`)
      .orderBy(sql`DATE_FORMAT(${order.createdAt}, ${format}) ASC`);

    return res.status(200).json({ period, currency: currency ?? "all", data });
  } catch (error) {
    console.error("getAvgOrderValue error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch avg order value" });
  }
};

export const getRevenueByCountryOverTime = async (
  req: Request,
  res: Response,
) => {
  try {
    const { period, from, to, currency } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );
    const groupFormat =
      from || to
        ? getCustomGroupFormat(from, to)
        : getGroupFormat(period as Period);
    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    const rows = await db
      .select({
        period: sql<string>`DATE_FORMAT(${order.createdAt}, ${groupFormat})`,
        country: orderUserDetail.country,
        revenue: sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
      })
      .from(order)
      .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
      .where(
        and(
          eq(order.deletedMode, false),
          getPeriodCondition(period as Period, order.createdAt),
        ),
      )
      .groupBy(
        sql`DATE_FORMAT(${order.createdAt}, ${groupFormat})`,
        orderUserDetail.country,
      )
      .orderBy(sql`DATE_FORMAT(${order.createdAt}, ${groupFormat}) ASC`);

    // normalize country codes
    const normalizeCountry = (c: string | null) => {
      if (!c) return "Other";
      if (c === "UNITED STATES") return "US";
      if (c === "United States of America (the)") return "US";
      return c;
    };

    // pivot rows into { period, GH: x, US: y, ... }
    const periodMap: Record<string, Record<string, number>> = {};
    const countrySet = new Set<string>();

    rows.forEach(({ period, country, revenue }) => {
      const c = normalizeCountry(country);
      countrySet.add(c);
      if (!periodMap[period]) periodMap[period] = {};
      periodMap[period][c] = (periodMap[period][c] ?? 0) + Number(revenue);
    });

    const countries = Array.from(countrySet);
    const data = Object.entries(periodMap).map(([period, values]) => ({
      period,
      ...countries.reduce((acc, c) => ({ ...acc, [c]: values[c] ?? 0 }), {}),
    }));

    return res.status(200).json({ period, countries, data, new_: true });
  } catch (error) {
    console.error("getRevenueByCountryOverTime error:", error);
    return res.status(500).json({
      message: "status 500: Failed to fetch revenue by country over time",
    });
  }
};

//Order by product
export const getOrdersByCountry = async (req: Request, res: Response) => {
  try {
    const { period, from, to, currency, pgId } = parsePeriodAndCurrency(req);
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    const normalizedCountry = sql<string>`
  CASE
    WHEN LOWER(${orderUserDetail.country}) IN ('us','usa','united states','united states of america','united states of america (the)')
      THEN 'United States'
    WHEN LOWER(${orderUserDetail.country}) IN ('gh','ghana')
      THEN 'Ghana'
    ELSE ${orderUserDetail.country}
  END
`;
    const data = await db
      .select({
        // country: orderUserDetail.country,
        country: normalizedCountry,
        totalRevenue: sql<number>`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${order.id})`,
        totalQuantity: sql<number>`SUM(${orderCartItem.quantity})`,
      })
      .from(order)
      .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
      .innerJoin(orderCartItem, eq(order.id, orderCartItem.orderId))
      .where(and(...conditions))
      .groupBy(normalizedCountry)
      .orderBy(sql`SUM(CAST(${orderCartItem.totalPrice} AS DECIMAL)) DESC`);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("getRevenueByProduct error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch orders by country" });
  }
};
