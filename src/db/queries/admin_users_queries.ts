import { eq } from "drizzle-orm";
import { admin, roles } from "../../../db";
import { db } from "../../models/db_connection";
import bcrypt from "bcrypt";

export async function findAdminById(email: string) {
  const [existing] = await db
    .select()
    .from(admin)
    .where(eq(admin.email, email.trim()));

  return existing;
}

// export async function selectAllAdmins() {
//   const [admins] = await db.select().from(admin);
//   return admins;
// }

export async function insertAdmin(
  name: string,
  email: string,
  password: string,
  roleId: number,
) {
  const hashedPassword = await bcrypt.hash(password, 11);

  const now = new Date();
  const mysqlDate = now.toISOString().slice(0, 19).replace("T", " ");

  const adminToInsert: typeof admin.$inferInsert = {
    email: email.trim(),
    password: hashedPassword,
    name: name,
    roleId,
    createdAt: mysqlDate,
    updatedAt: mysqlDate,
  };

  const [result] = (await db
    .insert(admin)
    .values(adminToInsert)
    .$returningId()) as Array<{ id: number }>;

  if (!result) {
    return null;
  }

  const [newAdmin] = await db
    .select()
    .from(admin)
    .where(eq(admin.id, result.id));

  return newAdmin;
}

export async function updateAdmin(
  adminId: number,
  updates: Partial<{
    name: string;
    email: string;
    password: string;
    roleId: number;
  }>,
) {
  const now = new Date();
  const mysqlDate = now.toISOString().slice(0, 19).replace("T", " ");

  const dataToUpdate: Partial<typeof admin.$inferInsert> = {
    updatedAt: mysqlDate,
  };

  if (updates.name !== undefined) dataToUpdate.name = updates.name;
  if (updates.email !== undefined) dataToUpdate.email = updates.email.trim();
  if (updates.roleId !== undefined) dataToUpdate.roleId = updates.roleId;
  if (updates.password !== undefined) {
    dataToUpdate.password = await bcrypt.hash(updates.password, 11);
  }

  await db.update(admin).set(dataToUpdate).where(eq(admin.id, adminId));

  const [updatedAdmin] = await db
    .select()
    .from(admin)
    .where(eq(admin.id, adminId));

  return updatedAdmin;
}

export async function deleteAdmin(adminId: number) {
  const [existingAdmin] = await db
    .select()
    .from(admin)
    .where(eq(admin.id, adminId));

  if (!existingAdmin) {
    return null;
  }

  await db.delete(admin).where(eq(admin.id, adminId));

  return existingAdmin;
}

export async function selectAllAdmins() {
  const admins = await db
    .select({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      roleId: roles.id,
      roleName: roles.name,
      createdAt: admin.createdAt,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.roleId, roles.id));

  // console.log("Admins fetched from DB:", admins);

  return admins;
}

export async function findAdminByNumericId(id: number) {
  const [existing] = await db.select().from(admin).where(eq(admin.id, id));

  return existing;
}
