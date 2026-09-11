import { flavors } from "../../../db";
import { db } from "../../models/db_connection";

export const selectAllFlavors = async () => {
  return db.select().from(flavors);
};

export const insertFlavor = async (data: { label: string; image: string }) => {
  const [result] = await db.insert(flavors).values(data);
  return result.insertId;
};
