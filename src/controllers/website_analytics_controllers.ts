import { Request, Response } from "express";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
// const path = require("path");

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
let analyticsClient: BetaAnalyticsDataClient;

if (process.env.GA4_KEY_JSON) {
  const credentials = JSON.parse(process.env.GA4_KEY_JSON);
  analyticsClient = new BetaAnalyticsDataClient({ credentials });
}

type ChartGrouping = "date" | "month" | "hour";

function getPeriodDateRange(
  period: string = "this_month",
  from?: string,
  to?: string,
) {
  if (period === "custom" && from && to)
    return { startDate: from, endDate: to };

  const ranges: Record<string, { startDate: string; endDate: string }> = {
    today: { startDate: "today", endDate: "today" },
    yesterday: { startDate: "yesterday", endDate: "yesterday" },
    this_week: { startDate: "7daysAgo", endDate: "today" },
    last_week: { startDate: "14daysAgo", endDate: "7daysAgo" },
    this_month: { startDate: "30daysAgo", endDate: "today" },
    last_month: { startDate: "60daysAgo", endDate: "30daysAgo" },
    this_year: { startDate: "365daysAgo", endDate: "today" },
    last_year: { startDate: "730daysAgo", endDate: "365daysAgo" },
  };
  return ranges[period] ?? { startDate: "2025-01-01", endDate: "today" };
}

// Decide the chart dimension and grouping label based on the selected period.
// Year-scope → monthly buckets (12 bars instead of 365 squished ones)
// Today/Yesterday → hourly buckets
// Everything else → daily
function getChartGrouping(period: string): {
  grouping: ChartGrouping;
  dimension: string;
} {
  if (period === "this_year" || period === "last_year" || period === "all_time") {
    return { grouping: "month", dimension: "month" };
  }
  if (period === "today" || period === "yesterday") {
    return { grouping: "hour", dimension: "hour" };
  }
  return { grouping: "date", dimension: "date" };
}

export const getWebsiteAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "", from, to } = req.query as Record<string, string>;
    const dateRange = getPeriodDateRange(period, from, to);
    const { grouping, dimension } = getChartGrouping(period);

    const [
      kpiResponse,
      dailyResponse,
      newVsReturningResponse,
      trafficSourcesResponse,
      funnelResponse,
      radialResponse,
    ] = await Promise.all([
      // 1. KPI totals
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [dateRange],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "userEngagementDuration" },
          { name: "engagedSessions" },
        ],
      }),

      // 2. Chart breakdown — dimension switches between date/month/hour
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [dateRange],
        dimensions: [{ name: dimension }, { name: "deviceCategory" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: dimension } }],
      }),

      // 3. New vs returning
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [dateRange],
        dimensions: [{ name: "newVsReturning" }],
        metrics: [{ name: "totalUsers" }],
      }),

      // 4. Traffic sources
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }),

      // 5. Conversion funnel
      // 5. Conversion funnel — page-based proxies (no ecommerce setup needed)
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [dateRange],
        metrics: [
          { name: "screenPageViews" }, // total page views = visited
          { name: "sessions" }, // sessions = showed some intent
          { name: "engagedSessions" }, // engaged = went deeper
          { name: "conversions" }, // any conversion goal configured in GA4
        ],
      }),

      // 6. Last 6 months for radial chart (always monthly, fixed range)
      analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: "180daysAgo", endDate: "today" }],
        dimensions: [{ name: "month" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "month" } }],
      }),
    ]);

    // ── Parse KPIs ──
    const kpiRow = kpiResponse[0].rows?.[0]?.metricValues ?? [];
    const sessions = Number(kpiRow[0]?.value ?? 0);
    const totalUsers = Number(kpiRow[1]?.value ?? 0);
    const bounceRate = Number(kpiRow[2]?.value ?? 0);
    const engagementDuration = Number(kpiRow[3]?.value ?? 0);
    const engagedSessions = Number(kpiRow[4]?.value ?? 0);
    const avgEngagementTime = sessions > 0 ? engagementDuration / sessions : 0;

    // ── Parse chart data (keyed by the dimension value: date/month/hour) ──
    const chartMap: Record<
      string,
      { date: string; desktop: number; mobile: number }
    > = {};
    for (const row of dailyResponse[0].rows ?? []) {
      const key = row.dimensionValues?.[0]?.value ?? "";
      const device = row.dimensionValues?.[1]?.value ?? "";
      const value = Number(row.metricValues?.[0]?.value ?? 0);
      if (!chartMap[key]) chartMap[key] = { date: key, desktop: 0, mobile: 0 };
      if (device === "desktop") chartMap[key]!.desktop += value;
      if (device === "mobile") chartMap[key]!.mobile += value;
    }
    const dailyChartData = Object.values(chartMap);

    // ── Parse new vs returning ──
    let newUsers = 0,
      returningUsers = 0;
    for (const row of newVsReturningResponse[0].rows ?? []) {
      const type = row.dimensionValues?.[0]?.value ?? "";
      const count = Number(row.metricValues?.[0]?.value ?? 0);
      if (type === "new") newUsers = count;
      if (type === "returning") returningUsers = count;
    }
    const totalNvR = newUsers + returningUsers || 1;
    const newPct = Math.round((newUsers / totalNvR) * 100);
    const returningPct = 100 - newPct;

    // ── Parse traffic sources ──
    const trafficSources = (trafficSourcesResponse[0].rows ?? []).map(
      (row) => ({
        source: row.dimensionValues?.[0]?.value ?? "Unknown",
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      }),
    );

    // ── Parse funnel ──
    const funnelRow = funnelResponse[0].rows?.[0]?.metricValues ?? [];
    const funnel = {
      visited: Number(funnelRow[0]?.value ?? 0), // screenPageViews
      cart: Number(funnelRow[1]?.value ?? 0), // sessions
      checkout: Number(funnelRow[2]?.value ?? 0), // engagedSessions
      purchased: Number(funnelRow[3]?.value ?? 0), // conversions
    };

    // ── Parse radial data ──
    const radialData = (radialResponse[0].rows ?? []).map((row) => ({
      month: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      users: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    return res.status(200).json({
      period,
      chartGrouping: grouping, // tells the frontend how to label the chart axis
      kpi: {
        sessions,
        uniqueVisitors: totalUsers,
        bounceRate: Number((bounceRate * 100).toFixed(1)),
        avgEngagementTime: Math.round(avgEngagementTime),
        engagedSessions,
      },
      dailyChartData,
      newVsReturning: {
        new: newUsers,
        returning: returningUsers,
        newPct,
        returningPct,
      },
      trafficSources,
      funnel,
      radialData,
    });
  } catch (error) {
    console.error("getWebsiteAnalytics error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch website analytics" });
  }
};
