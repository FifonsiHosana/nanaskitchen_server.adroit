import { and, eq } from "drizzle-orm";
import { pricingTiers } from "../../../db";
import { db } from "../../models/db_connection";

export type NewPricingTier = typeof pricingTiers.$inferInsert;

export const insertPricingTiers = async (rows: NewPricingTier[]) => {
  if (rows.length === 0) return [];
  const [result] = await db.insert(pricingTiers).values(rows);
  return result.insertId;
};

export const findExistingTier = async (
  productId: number,
  pricingGroupId: number,
  currencyId: number,
) => {
  const rows = await db
    .select()
    .from(pricingTiers)
    .where(
      and(
        eq(pricingTiers.productId, productId),
        eq(pricingTiers.pricingGroupId, pricingGroupId),
        eq(pricingTiers.currencyId, currencyId),
      ),
    );
  return rows[0];
};
