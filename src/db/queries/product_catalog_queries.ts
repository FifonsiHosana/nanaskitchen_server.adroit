import { eq } from "drizzle-orm";
import {
  countries,
  countryProductSettings,
  currency,
  pricingGroups,
  product,
} from "../../../db";
import { db } from "../../models/db_connection";

export type NewProductInput = Omit<
  typeof product.$inferInsert,
  "id" | "createdAt" | "updatedAt" | "sourceId"
>;

export const insertProduct = async (data: NewProductInput) => {
  const now = new Date().toISOString().slice(0, 23).replace("T", " ");
  const [result] = await db.insert(product).values({
    ...data,
    sourceId: crypto.randomUUID().split("-").slice(0, 2).join("-"),
    createdAt: now,
    updatedAt: now,
  } as typeof product.$inferInsert);
  return result.insertId;
};

export const selectProductById = async (id: number) => {
  const rows = await db.select().from(product).where(eq(product.id, id));
  return rows[0];
};

export const selectAllPricingGroups = async () => {
  return db.select().from(pricingGroups);
};

export const selectAllCurrencies = async () => {
  return db.select().from(currency);
};

export const selectAllCountries = async () => {
  return db.select().from(countries);
};

export const insertCountryProductSettings = async (
  rows: (typeof countryProductSettings.$inferInsert)[],
) => {
  if (rows.length === 0) return;
  await db.insert(countryProductSettings).values(rows);
};
