import { AnyColumn, SQL, sql } from "drizzle-orm";

export const VALID_PERIODS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "all_time",
] as const;

export type Period = (typeof VALID_PERIODS)[number];

export const getCustomPeriodCondition = (
  column: AnyColumn,
  from?: string,
  to?: string,
): SQL | undefined => {
  if (!from && !to) return;

  if (from && to) {
    return sql`${column} BETWEEN ${from} AND ${to}`;
  }

  if (from) {
    return sql`${column} >= ${from}`;
  }

  if (to) {
    return sql`${column} <= ${to}`;
  }
};

export const getPeriodCondition = (period: Period, column: AnyColumn): SQL => {
  const map: Record<Period, SQL> = {
    today: sql`DATE(${column}) = CURDATE()`,
    // ISO week comparison — immune to the Sunday=1 DAYOFWEEK() edge case entirely
    this_week: sql`YEARWEEK(${column}, 3) = YEARWEEK(CURDATE(), 3)`,
    this_month: sql`YEAR(${column}) = YEAR(NOW()) AND MONTH(${column}) = MONTH(NOW())`,
    last_month: sql`YEAR(${column}) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND MONTH(${column}) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))`,
    this_year: sql`YEAR(${column}) = YEAR(NOW())`,
    last_year: sql`YEAR(${column}) = YEAR(NOW()) - 1`,
    all_time: sql`1=1`,
  };

  const condition = map[period];
  if (!condition) {
    throw new Error(`Unknown period: "${period}"`);
  }
  return condition;
};

export const getGroupFormat = (period: Period): string => {
  const map: Record<Period, string> = {
    today: "%H:00",
    this_week: "%Y-%m-%d",
    this_month: "%Y-%m-%d",
    last_month: "%Y-%m-%d",
    this_year: "%Y-%m",
    last_year: "%Y-%m",
    all_time: "%Y",
  };
  return map[period];
};

export const getCustomGroupFormat = (from?: string, to?: string) => {
  if (!from || !to) return "%Y-%m-%d";

  const diff = new Date(to).getTime() - new Date(from).getTime();

  const days = diff / (1000 * 60 * 60 * 24);

  if (days <= 1) return "%H:00"; // hourly
  if (days <= 31) return "%Y-%m-%d"; // daily
  if (days <= 365) return "%Y-%m"; // monthly

  return "%Y"; // yearly
};

export const validatePeriod = (period: string): period is Period => {
  return (VALID_PERIODS as readonly string[]).includes(period);
};

export const isValidDate = (date: string) => {
  return !isNaN(new Date(date).getTime());
};

type QueryParams = {
  period?: string;
  from?: string;
  to?: string;
};

export const buildDateFilter = (
  params: QueryParams,
  column: AnyColumn,
): SQL | undefined => {
  const { period, from, to } = params;

  if (period === "custom") {
    if (from && !isValidDate(from)) throw new Error("Invalid from date");
    if (to && !isValidDate(to)) throw new Error("Invalid to date");

    return getCustomPeriodCondition(column, from, to);
  }

  if (period && validatePeriod(period)) {
    return getPeriodCondition(period, column);
  }

  throw new Error("Invalid period or date range{}");
};

export const formatDateReadable = (dateString: string) => {
  try {
    const dateObj = new Date(dateString);

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date format");
    }
    const normalDate = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return normalDate;
  } catch (error) {
    console.log(error);
    return dateString;
  }
};
