import { eq } from "drizzle-orm";
import { variants } from "../../../db";
import { db } from "../../models/db_connection";

export const selectAllVariants = async () => {
  return db.select().from(variants);
};

export const insertVariant = async (data: {
  variantName: string;
  titleTag: string;
}) => {
  const [result] = await db.insert(variants).values(data);
  return result.insertId;
};

export const selectVariantById = async (id: number) => {
  const rows = await db.select().from(variants).where(eq(variants.id, id));
  return rows[0];
};
