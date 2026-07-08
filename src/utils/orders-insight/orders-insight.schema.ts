import { z } from "zod";

const booleanCoerce = z.preprocess(
  (val) => val === "true" || val === true,
  z.boolean().optional(),
);

const numberCoerce = (defaultVal: number) =>
  z.preprocess(
    (val) => (val !== undefined ? Number(val) : defaultVal),
    z.number().positive().optional(),
  );

export const ordersInsightsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  currency: z.enum(["GHS", "USD", "EUR", "all"]).optional().default("all"),

  includeItems: booleanCoerce,
  includeCustomer: booleanCoerce,
  includeAttribution: booleanCoerce,
  summaryOnly: booleanCoerce,

  cursor: z.string().optional(),
  limit: numberCoerce(100),
});

export type OrdersInsightsQuery = z.infer<typeof ordersInsightsQuerySchema>;
