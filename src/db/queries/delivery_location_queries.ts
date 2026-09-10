import { and, eq, like, SQL, sql } from "drizzle-orm";
import { deliveryLocation } from "../../../db";
import { db } from "../../models/db_connection";

export type NewDeliveryLocation = typeof deliveryLocation.$inferInsert;
export type DeliveryLocationUpdate = Partial<Omit<NewDeliveryLocation, "id">>;

export const selectAllDeliveryLocations = async ({
  pageSize,
  page,
  conditions,
}: {
  pageSize: string;
  page: string;
  conditions: SQL<unknown>[];
}) => {
  return db
    .select()
    .from(deliveryLocation)
    .where(and(...conditions))
    .limit(Number(pageSize))
    .offset((Number(page) - 1) * Number(pageSize));
};

export const totalCount = (conditions: SQL<unknown>[]) => {
  return db
    .select({ count: sql<number>`count(*)` })
    .from(deliveryLocation)
    .where(conditions.length ? and(...conditions) : undefined);
};

export const insertDeliveryLocation = async (data: NewDeliveryLocation) => {
  const [result] = await db.insert(deliveryLocation).values(data);
  const rows = await db
    .select()
    .from(deliveryLocation)
    .where(eq(deliveryLocation.id, result.insertId));
  return rows[0];
};

export const updateDeliveryLocationById = async (
  id: number,
  data: DeliveryLocationUpdate,
) => {
  await db
    .update(deliveryLocation)
    .set(data)
    .where(eq(deliveryLocation.id, id));
  const rows = await db
    .select()
    .from(deliveryLocation)
    .where(eq(deliveryLocation.id, id));
  return rows[0];
};

export const deleteDeliveryLocationById = async (id: number) => {
  await db.delete(deliveryLocation).where(eq(deliveryLocation.id, id));
};

export const selectDeliveryLocationByName = async (location: string) => {
  const rows = await db
    .select()
    .from(deliveryLocation)
    .where(eq(deliveryLocation.location, location));
  return rows[0];
};
