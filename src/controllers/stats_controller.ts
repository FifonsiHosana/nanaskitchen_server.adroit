import { and, count, eq, or, sql } from "drizzle-orm";
import { order, orderUserDetail } from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";
import {
  getPeriodCondition,
  getGroupFormat,
  validatePeriod,
  type Period,
  buildDateFilter,
} from "../utils/period";
import { parsePeriodAndCurrency } from "./sales_analytics_controllers";
import { europeanCountries } from "../utils/country-currency";

// GET /stats
// Returns order counts by status and country for dashboard header cards
// {
//   delivered: 502,
//   pending: 525,
//   countries: { GH: 786, US: 323, EU: 2 }
// }
const PRICE_GROUP_IDS: Record<string, number> = {
  retailer: 1,
  wholesaler: 2,
  distributor: 3,
};

export const getStats = async (req: Request, res: Response) => {
  const { status } = req.params;
  try {
    const { period, from, to } = parsePeriodAndCurrency(req);
    const { pricingGroup } = req.query as Record<string, string>;
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(period === "custom" && from && { from }),
        ...(period === "custom" && to && { to }),
      },
      order.createdAt,
    );
    const deletedCondition = () => {
      if (status === "trash") return eq(order.deletedMode, true);
      return eq(order.deletedMode, false);
    };
    const conditions: any[] = [deletedCondition()];
    if (status && status !== "all" && status !== "trash") {
      conditions.push(eq(order.status, status as typeof order.status._.data));
    }
    if (dateCondition) conditions.push(dateCondition);
    const pgId = pricingGroup ? PRICE_GROUP_IDS[pricingGroup] : undefined;
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));
    const [statusCount, countryOrderCount] = await Promise.all([
      db
        .select({ count: count(), status: order.status })
        .from(order)
        .where(and(...conditions))
        .groupBy(order.status),

      db
        .select({ count: count(), country: orderUserDetail.country })
        .from(order)
        .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
        .where(and(...conditions))
        .groupBy(orderUserDetail.country),
    ]);

    const byStatus = Object.fromEntries(
      statusCount.map(({ status, count }) => [status, count]),
    );

    const byCountry = Object.fromEntries(
      countryOrderCount.map(({ country, count }) => [country, count]),
    );

    const EU_COUNTRIES = europeanCountries;
    const GH_VARIANTS = ["Ghana", "GH"];
    const US_VARIANTS = [
      "United States of America (the)",
      "US",
      "UNITED STATES",
    ];

    const euTotal = EU_COUNTRIES.reduce(
      (sum, code) => sum + (byCountry[code] ?? 0),
      0,
    );
    const usTotal = US_VARIANTS.reduce(
      (sum, code) => sum + (byCountry[code] ?? 0),
      0,
    );
    const ghTotal = GH_VARIANTS.reduce(
      (sum, code) => sum + (byCountry[code] ?? 0),
      0,
    );
    return res.status(200).json({
      delivered: byStatus["delivered"] ?? 0,
      pending: byStatus["awaiting_payment"] ?? 0,
      completed: byStatus["completed"] ?? 0,
      countries: {
        GH: ghTotal,
        US: usTotal,
        EU: euTotal,
      },
    });
  } catch (error) {
    console.error("getStats error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch stats" });
  }
};

// GET /stats/chart?period=this_month&currency=GHS
// Returns revenue over time grouped by period granularity
// {
//   period: "this_month",
//   currency: "all",
//   stats: [
//     { period: "2024-12-01", total: 450.00, orderCount: 3, currency: "GHS" },
//     { period: "2024-12-02", total: 890.00, orderCount: 5, currency: "USD" }
//   ]
// }
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { period = "this_month", currency } = req.query as Record<
      string,
      string
    >;

    if (!validatePeriod(period)) {
      return res.status(400).json({
        message: `Invalid period. Use: ${["today", "this_week", "this_month", "last_month", "this_year", "last_year"].join(", ")}`,
      });
    }

    const format = getGroupFormat(period as Period);

    const conditions: any[] = [
      eq(order.deletedMode, false),
      getPeriodCondition(period as Period, order.createdAt),
    ];

    if (currency) conditions.push(eq(order.currency, currency));

    const stats = await db
      .select({
        period: sql<string>`DATE_FORMAT(${order.createdAt}, ${format})`,
        total: sql<number>`SUM(CAST(${order.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
        currency: order.currency,
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(sql`DATE_FORMAT(${order.createdAt}, ${format})`, order.currency)
      .orderBy(sql`DATE_FORMAT(${order.createdAt}, ${format}) ASC`);

    return res.status(200).json({ period, currency: currency ?? "all", stats });
  } catch (error) {
    console.error("getOrderStats error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch order stats" });
  }
};
