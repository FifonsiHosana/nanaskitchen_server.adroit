import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { order, orderUserDetail, review } from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";
import {
  buildDateFilter,
  getPeriodCondition,
  validatePeriod,
  type Period,
} from "../utils/period";
import { parsePeriodAndCurrency } from "./sales_analytics_controllers";
import { europeanCountries } from "../utils/country-currency";

const parsePeriod = (req: Request) => {
  const { period = "this_month" } = req.query as Record<string, string>;
  return period;
};

const periodError = (res: Response) =>
  res.status(400).json({
    message: `Invalid period. Use: today, this_week, this_month, last_month, this_year, last_year`,
  });

const VIP_ORDER_THRESHOLD = 5;
const VIP_SPEND_THRESHOLD = 800;

// GET /analytics/customers/segments?period=this_month
// Customer counts broken into new / returning / vip segments
// {
//   period: "this_month",
//   total: 320,
//   new: 180,        (1 order only)
//   returning: 105,  (2 orders)
//   vip: 35          (3+ orders or spend >= 500)
// }
export const getCustomerSegments = async (req: Request, res: Response) => {
  try {
    const { period, currency, from, to, pgId } = parsePeriodAndCurrency(req);

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
    if (currency && currency !== "all")
      conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));
    const rows = await db
      .select({
        email: orderUserDetail.email,
        totalOrders: sql<number>`COUNT(${order.id})`,
        totalSpend: sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
      })
      .from(orderUserDetail)
      .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(orderUserDetail.email);
    const segments = rows.map((c) => {
      const isVip =
        c.totalOrders >= VIP_ORDER_THRESHOLD ||
        c.totalSpend >= VIP_SPEND_THRESHOLD;
      const isNew = c.totalOrders === 1;

      return {
        ...c,
        isVip,
        isNew,
        isReturning: !isNew,
      };
    });

    return res.status(200).json({
      period: period || "custom",
      total: segments.length,
      new: segments.filter((c) => c.isNew).length,
      returning: segments.filter((c) => c.isReturning).length,
      vip: segments.filter((c) => c.isVip).length,
      newVip: segments.filter((c) => c.isNew && c.isVip).length,
      returningVip: segments.filter((c) => c.isReturning && c.isVip).length,
    });
  } catch (error) {
    console.error("getCustomerSegments error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch customer segments" });
  }
};

// GET /analytics/customers/top?period=this_year&limit=5
// Top customers by total spend
// {
//   period: "this_year",
//   data: [
//     { email: "k@gmail.com", firstName: "Kwame", lastName: "Asante", country: "GH", totalSpend: 1250.00, totalOrders: 8 },
//   ]
// }
export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { period, currency, from, to, pgId } = parsePeriodAndCurrency(req);

    const {
      limit = "5",
      country = "all",
      sort = "date",
      page = "1",
      pageSize = "20",
      minPrice,
      maxPrice,
      search,
      // period = "this_month",
      // from,
      // to,
    } = req.query as Record<string, string>;
    // if (!validatePeriod(period)) return periodError(res);
    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );
    const offset = (Number(page) - 1) * Number(pageSize);
    const orderBy = (() => {
      switch (sort) {
        case "country":
          return [
            asc(orderUserDetail.country),
            sql`MAX(${order.createdAt}) DESC`,
          ];
        case "spend":
          return [sql`SUM(CAST(${order.totalAmount} AS DECIMAL)) DESC`];
        case "orders":
          return [sql`COUNT(${order.id}) DESC`];
        case "date":
        default:
          return [sql`MAX(${order.createdAt}) DESC`];
      }
    })();
    // sort === "country"
    //   ? [asc(orderUserDetail.country), desc(order.createdAt)]
    //   : [desc(order.createdAt)];

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(eq(order.currency, currency));
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    if (search) {
      conditions.push(
        or(
          like(orderUserDetail.firstName, `%${search}%`),
          like(orderUserDetail.lastName, `%${search}%`),
          like(orderUserDetail.email, `%${search}%`),
          // and(
          //   like(orderUserDetail.firstName, `%${search}%`),
          //   like(orderUserDetail.lastName, `%${search}%`),
          // ),
          // like(order.id, `%${search}%`),
          like(
            sql`CONCAT(${orderUserDetail.firstName}, ' ', ${orderUserDetail.lastName})`,
            `%${search}%`,
          ),
          like(
            sql`CONCAT(${orderUserDetail.lastName}, ' ', ${orderUserDetail.firstName})`,
            `%${search}%`,
          ),
        ),
      );
    }
    // if (minPrice) {
    //   conditions.push(
    //     gte(
    //       sql<number>`CAST(${order.totalAmount} AS DECIMAL)`,
    //       Number(minPrice),
    //     ),
    //   );
    // }
    // if (maxPrice) {
    //   conditions.push(
    //     lte(
    //       sql<number>`CAST(${order.totalAmount} AS DECIMAL)`,
    //       Number(maxPrice),
    //     ),
    //   );
    // }
    const havingConditions: any[] = [];

    if (minPrice) {
      havingConditions.push(
        gte(
          sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
          Number(minPrice),
        ),
      );
    }
    if (maxPrice) {
      havingConditions.push(
        lte(
          sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
          Number(maxPrice),
        ),
      );
    }
    const normalizedCountry = sql<string>`
  CASE
    WHEN LOWER(${orderUserDetail.country}) IN ('us','usa','united states','united states of america','united states of america (the)')
      THEN 'United States'
    WHEN LOWER(${orderUserDetail.country}) IN ('gh','ghana')
      THEN 'Ghana'
    ELSE ${orderUserDetail.country}
  END
`;
    const countryToDb: Record<string, string[]> = {
      GHS: ["GH", "Ghana"],
      USD: ["US", "UNITED STATES", "United States of America (the)"],
      EUR: europeanCountries,
    };
    if (country && country != "all") {
      const dbValues = countryToDb[country] ?? [country];
      conditions.push(
        dbValues.length > 1
          ? inArray(orderUserDetail.country, dbValues)
          : eq(
              orderUserDetail.country,
              dbValues[0] as typeof orderUserDetail.country._.data,
            ),
      );
    }
    const subquery = db
      .select({
        email: orderUserDetail.email,
      })
      .from(orderUserDetail)
      .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(
        orderUserDetail.email,
        orderUserDetail.firstName,
        orderUserDetail.lastName,
        normalizedCountry,
      )
      .having(havingConditions.length ? and(...havingConditions) : undefined)
      .as("subquery");
    const [rows, countResult] = await Promise.all([
      db
        .select({
          email: orderUserDetail.email,
          firstName: orderUserDetail.firstName,
          lastName: orderUserDetail.lastName,
          country: normalizedCountry,
          totalSpend: sql<number>`SUM(CAST(${order.totalAmount} AS DECIMAL))`,
          totalOrders: sql<number>`COUNT(${order.id})`,
        })
        .from(orderUserDetail)
        .innerJoin(order, eq(order.id, orderUserDetail.orderId))
        .where(and(...conditions))

        .groupBy(
          orderUserDetail.email,
          orderUserDetail.firstName,
          orderUserDetail.lastName,
          normalizedCountry,
        )
        .having(havingConditions.length ? and(...havingConditions) : undefined)
        // .orderBy(sql`totalSpend DESC`)
        // .orderBy(sql`SUM(CAST(${order.totalAmount} AS DECIMAL)) DESC`)/descending -actual top customers
        .orderBy(...orderBy)
        .limit(Number(pageSize))
        .offset(offset),
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${orderUserDetail.email})`,
        })
        .from(subquery),
      // .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      // .where(and(...conditions))
      // .having(havingConditions.length ? and(...havingConditions) : undefined),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return res.status(200).json({ period, rows, total, new: "o" });
  } catch (error) {
    console.error("getTopCustomers error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch top customers" });
  }
};

// GET /analytics/customers/satisfaction
// Review rating distribution and average  (not period dependent)
// {
//   averageRating: 4.3,
//   totalReviews: 245,
//   distribution: {
//     "5": 120,
//     "4": 75,
//     "3": 30,
//     "2": 12,
//     "1": 8
//   }
// }
export const getCustomerSatisfaction = async (req: Request, res: Response) => {
  try {
    const data = await db
      .select({
        averageRating: sql<number>`AVG(${review.rating})`,
        totalReviews: sql<number>`COUNT(*)`,
        fiveStars: sql<number>`SUM(CASE WHEN ${review.rating} = 5 THEN 1 ELSE 0 END)`,
        fourStars: sql<number>`SUM(CASE WHEN ${review.rating} = 4 THEN 1 ELSE 0 END)`,
        threeStars: sql<number>`SUM(CASE WHEN ${review.rating} = 3 THEN 1 ELSE 0 END)`,
        twoStars: sql<number>`SUM(CASE WHEN ${review.rating} = 2 THEN 1 ELSE 0 END)`,
        oneStar: sql<number>`SUM(CASE WHEN ${review.rating} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(review)
      .where(eq(review.status, "approved"));

    const row = data[0];
    return res.status(200).json({
      averageRating: Number(row?.averageRating).toFixed(1),
      totalReviews: row?.totalReviews,
      distribution: {
        "5": row?.fiveStars,
        "4": row?.fourStars,
        "3": row?.threeStars,
        "2": row?.twoStars,
        "1": row?.oneStar,
      },
    });
  } catch (error) {
    console.error("getCustomerSatisfaction error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch satisfaction" });
  }
};

// GET /analytics/customers/reviews?page=1&pageSize=10
// Paginated approved reviews for carousel or list
// {
//   total: 245,
//   reviews: [
//     { name: "Abena", comment: "...", rating: 5, createdAt: "2024-12-01", productId: 3 }
//   ]
// }
export const getRecentReviews = async (req: Request, res: Response) => {
  try {
    const { page = "1", pageSize = "10" } = req.query as Record<string, string>;
    const offset = (Number(page) - 1) * Number(pageSize);

    const [reviews, countResult] = await Promise.all([
      db
        .select({
          name: review.name,
          comment: review.comment,
          rating: review.rating,
          createdAt: review.createdAt,
          productId: review.productId,
        })
        .from(review)
        .where(eq(review.status, "approved"))
        .orderBy(desc(review.createdAt))
        .limit(Number(pageSize))
        .offset(offset),

      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(review)
        .where(eq(review.status, "approved")),
    ]);

    return res.status(200).json({
      total: Number(countResult[0]?.count ?? 0),
      reviews,
    });
  } catch (error) {
    console.error("getRecentReviews error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch reviews" });
  }
};

// GET /analytics/customers/repeat-rate?period=this_year
// Percentage of customers who ordered more than once
// {
//   period: "this_year",
//   totalCustomers: 320,
//   repeatCustomers: 140,
//   repeatRate: 43.75   (percentage)
// }
export const getRepeatPurchaseRate = async (req: Request, res: Response) => {
  try {
    const { period, currency, from, to } = parsePeriodAndCurrency(req);

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

    const customerOrders = await db
      .select({
        email: orderUserDetail.email,
        currency: order.currency,
        orderCount: sql<number>`COUNT(${order.id})`,
      })
      .from(orderUserDetail)
      .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(orderUserDetail.email, order.currency);

    const total = customerOrders.length;
    const repeat = customerOrders.filter((c) => c.orderCount > 1).length;
    const repeatRate =
      total === 0 ? 0 : Math.round((repeat / total) * 10000) / 100;

    return res.status(200).json({
      period,
      totalCustomers: total,
      repeatCustomers: repeat,
      repeatRate,
      new_: true,
    });
  } catch (error) {
    console.error("getRepeatPurchaseRate error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch repeat rate" });
  }
};

// GET /analytics/customers/country-distribution?period=this_month
// Unique customer count per country for pie chart
// {
//   period: "this_month",
//   data: [
//     { country: "GH", customerCount: 180 },
//     { country: "US", customerCount: 95 }
//   ]
// }
export const getCustomerCountryDistribution = async (
  req: Request,
  res: Response,
) => {
  try {
    const { period, from, to } = parsePeriodAndCurrency(req);
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

    const data = await db
      .select({
        country: orderUserDetail.country,
        customerCount: sql<number>`COUNT(DISTINCT ${orderUserDetail.email})`,
      })
      .from(orderUserDetail)
      .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(orderUserDetail.country)
      // .orderBy(sql`customerCount DESC`);
      .orderBy(sql`SUM(CAST(${order.totalAmount} AS DECIMAL)) DESC`);

    return res.status(200).json({ period, data });
  } catch (error) {
    console.error("getCustomerCountryDistribution error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch country distribution" });
  }
};

// GET /analytics/customers/orders-distribution?period=this_year
// How many customers made 1, 2, 3, 4, 5+ orders — loyalty breakdown
// {
//   period: "this_year",
//   data: [
//     { bucket: "1 order", customerCount: 180 },
//     { bucket: "2 orders", customerCount: 75 },
//     { bucket: "3 orders", customerCount: 40 },
//     { bucket: "4 orders", customerCount: 15 },
//     { bucket: "5+ orders", customerCount: 10 }
//   ]
// }
export const getOrdersPerCustomerDistribution = async (
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

    const conditions: any[] = [
      eq(order.deletedMode, false),
      or(eq(order.status, "completed"), eq(order.status, "delivered")),
      // getPeriodCondition(period as Period, order.createdAt),
    ];
    if (dateCondition) conditions.push(dateCondition);
    if (currency) conditions.push(eq(order.currency, currency));

    const customerOrders = await db
      .select({
        email: orderUserDetail.email,
        orderCount: sql<number>`COUNT(${order.id})`,
      })
      .from(orderUserDetail)
      .innerJoin(order, eq(order.id, orderUserDetail.orderId))
      .where(and(...conditions))
      .groupBy(orderUserDetail.email);

    // bucket into 1 / 2 / 3 / 4 / 5+
    const buckets: Record<string, number> = {
      "1 order": 0,
      "2 orders": 0,
      "3 orders": 0,
      "4 orders": 0,
      "5+ orders": 0,
    };

    customerOrders.forEach(({ orderCount }) => {
      const count = Number(orderCount ?? 0);
      if (count === 1) buckets["1 order"]!++;
      else if (count === 2) buckets["2 orders"]!++;
      else if (count === 3) buckets["3 orders"]!++;
      else if (count === 4) buckets["4 orders"]!++;
      else if (count >= 5) buckets["5+ orders"]!++;
    });

    const data = Object.entries(buckets).map(([bucket, customerCount]) => ({
      bucket,
      customerCount,
    }));

    return res.status(200).json({ period, data });
  } catch (error) {
    console.error("getOrdersPerCustomerDistribution error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch orders distribution" });
  }
};
