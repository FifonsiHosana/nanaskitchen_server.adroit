import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  attributionAndPreferences,
  order,
  orderUserDetail,
  pricingGroups,
  product,
  review,
  userRoles,
} from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";
import { europeanCountries } from "../utils/country-currency";
import { buildDateFilter } from "../utils/period";

export const getCustomerFeedback = async (req: Request, res: Response) => {
  try {
    const {
      country = "all",
      page = "1",
      pageSize = "20",
      pricingGroup,
      period: rawPeriod = "all_time",
      from,
      to,
    } = req.query as Record<string, string>;

    const period = rawPeriod?.trim() || "all_time";

    const PRICE_GROUP_IDS: Record<string, number> = {
      retailer: 1,
      wholesaler: 2,
      distributor: 3,
    };

    const offset = (Number(page) - 1) * Number(pageSize);

    const conditions = [];

    // Pricing group
    const pgId = pricingGroup ? PRICE_GROUP_IDS[pricingGroup] : undefined;
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));

    // Country filter
    const countryToDb: Record<string, string[]> = {
      GHS: ["GH", "ghana", "Ghana"],
      USD: ["US", "UNITED STATES", "United States of America (the)"],
      EUR: europeanCountries,
    };

    if (country && country !== "all") {
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

    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    if (dateCondition) conditions.push(dateCondition);

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // ── Run paginated page data, total count, and full-set aggregations ──
    const [rows, countResult, attributionAgg, preferenceAgg] =
      await Promise.all([
        db
          .select()
          .from(attributionAndPreferences)
          .innerJoin(
            orderUserDetail,
            eq(orderUserDetail.orderId, attributionAndPreferences.orderId),
          )
          .leftJoin(order, eq(order.id, attributionAndPreferences.orderId))
          .leftJoin(pricingGroups, eq(order.pricingGroupId, pricingGroups.id))
          .where(whereClause)
          .limit(Number(pageSize))
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)` })
          .from(attributionAndPreferences)
          .innerJoin(
            orderUserDetail,
            eq(orderUserDetail.orderId, attributionAndPreferences.orderId),
          )
          .leftJoin(order, eq(order.id, attributionAndPreferences.orderId))
          .where(whereClause),

        // attribution counts across the FULL filtered set (not just the page)
        db
          .select({
            label: sql<string>`jt.elem`,
            count: sql<number>`count(*)`,
          })
          .from(attributionAndPreferences)
          .innerJoin(
            orderUserDetail,
            eq(orderUserDetail.orderId, attributionAndPreferences.orderId),
          )
          .leftJoin(order, eq(order.id, attributionAndPreferences.orderId))
          .innerJoin(
            sql`JSON_TABLE(
              ${attributionAndPreferences.attributionAnswer},
              '$[*]' COLUMNS (elem VARCHAR(255) PATH '$')
            ) AS jt`,
            sql`true`,
          )
          .where(whereClause)
          .groupBy(sql`jt.elem`),

        // preference counts across the FULL filtered set
        db
          .select({
            label: sql<string>`jt.elem`,
            count: sql<number>`count(*)`,
          })
          .from(attributionAndPreferences)
          .innerJoin(
            orderUserDetail,
            eq(orderUserDetail.orderId, attributionAndPreferences.orderId),
          )
          .leftJoin(order, eq(order.id, attributionAndPreferences.orderId))
          .innerJoin(
            sql`JSON_TABLE(
              ${attributionAndPreferences.preferenceAnswer},
              '$[*]' COLUMNS (elem VARCHAR(255) PATH '$')
            ) AS jt`,
            sql`true`,
          )
          .where(whereClause)
          .groupBy(sql`jt.elem`),
      ]);

    const total = Number(countResult[0]?.count ?? 0);

    // ── Build page-level `data` array (unchanged) ──
    const data = rows.map((row) => {
      const {
        AttributionAndPreferences: ap,
        OrderUserDetail: user,
        PricingGroups: pg,
      } = row;

      const rawAttribution: string[] = Array.isArray(ap.attributionAnswer)
        ? (ap.attributionAnswer as string[])
        : [];
      const rawPreferences: string[] = Array.isArray(ap.preferenceAnswer)
        ? (ap.preferenceAnswer as string[])
        : [];

      return {
        id: ap.id,
        orderId: ap.orderId,
        customer: {
          name: `${user.firstName?.trim()} ${user.lastName?.trim()}`,
          email: user.email,
          phone: user.phone,
          country: user.country,
          priceGroup: pg?.groupName ?? null,
        },
        attribution: rawAttribution,
        preferences: rawPreferences,
        dateSubmitted: row.Order?.createdAt
          ? new Date(row.Order?.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              timeZone: "UTC",
            })
          : null,
      };
    });

    // ── Normalize attribution labels into known channels + "Other" ──
    const knownChannels = [
      "Social Media",
      "Word of Mouth",
      "Event Functions",
      "Gift",
    ];

    const attributionCount: Record<string, number> = {};
    attributionAgg.forEach(({ label, count }) => {
      const isKnown = knownChannels.some(
        (k) => k.toLowerCase() === label.toLowerCase(),
      );
      const key = isKnown ? label : "Other";
      attributionCount[key] = (attributionCount[key] ?? 0) + Number(count);
    });

    const preferenceCount: Record<string, number> = {};
    preferenceAgg.forEach(({ label, count }) => {
      preferenceCount[label] = Number(count);
    });

    // ── Summaries, now computed over the full filtered set ──
    const sortedAttribution = Object.entries(attributionCount).sort(
      ([, a], [, b]) => b - a,
    );
    const sortedPreferences = Object.entries(preferenceCount).sort(
      ([, a], [, b]) => b - a,
    );

    const summary = {
      totalResponses: total,
      topChannel: sortedAttribution[0]?.[0] ?? null,
      topPreference: sortedPreferences[0]?.[0] ?? null,
      // percentage = % of respondents (out of `total`) who gave this answer.
      // Since these are multi-select questions, percentages can sum to >100%.
      howTheyHeardAboutUs: sortedAttribution.map(([label, count]) => ({
        label,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      })),
      whatTheyLike: sortedPreferences.map(([label, count]) => ({
        label,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      })),
    };

    return res.status(200).json({ summary, data, total });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to fetch customer feedback`,
      error: String(error),
    });
  }
};
