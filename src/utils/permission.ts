import { eq } from "drizzle-orm";
import { RESOURCES, rolePermissions, roles } from "../../db";
import { db } from "../models/db_connection";

export type Resource = (typeof RESOURCES)[number];
export type Action = "see" | "edit" | "delete";

export function isKnownResource(value: string): value is Resource {
  return (RESOURCES as readonly string[]).includes(value);
}

export async function getPermissionsForRole(roleId: number | null) {
  if (roleId === null) return {};

  const rows = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  const map: Partial<Record<Resource, Record<Action, boolean>>> = {};
  for (const row of rows) {
    map[row.resource as Resource] = {
      see: row.canSee,
      edit: row.canEdit,
      delete: row.canDelete,
    };
  }
  return map;
}

export async function can(
  roleId: number | null,
  resource: Resource,
  action: Action,
) {
  const permissions = await getPermissionsForRole(roleId);
  return permissions[resource]?.[action] ?? false;
}

/** True when `roleId` belongs to the `admin` role. */
export async function isAdminRole(roleId: number | null): Promise<boolean> {
  if (roleId === null) return false;
  const rows = await db.select().from(roles).where(eq(roles.id, roleId));
  return rows[0]?.name === "admin";
}

/** Full `{ [roleId]: { [resource]: { see, edit, delete } } }` matrix. */
export async function getAllPermissions(): Promise<
  Record<number, Partial<Record<Resource, Record<Action, boolean>>>>
> {
  const rows = await db.select().from(rolePermissions);
  const matrix: Record<
    number,
    Partial<Record<Resource, Record<Action, boolean>>>
  > = {};
  for (const row of rows) {
    const roleEntry = (matrix[row.roleId] ??= {});
    roleEntry[row.resource as Resource] = {
      see: row.canSee,
      edit: row.canEdit,
      delete: row.canDelete,
    };
  }
  return matrix;
}

/**
 * Upsert `(roleId, resource)` rows. Callers must validate the payload and
 * confirm the role exists first.
 */
export async function setRolePermissions(
  roleId: number,
  matrix: Partial<Record<Resource, Record<Action, boolean>>>,
): Promise<void> {
  for (const [resource, flags] of Object.entries(matrix) as [
    Resource,
    Record<Action, boolean>,
  ][]) {
    await db
      .insert(rolePermissions)
      .values({
        roleId,
        resource,
        canSee: flags.see,
        canEdit: flags.edit,
        canDelete: flags.delete,
      })
      .onDuplicateKeyUpdate({
        set: {
          canSee: flags.see,
          canEdit: flags.edit,
          canDelete: flags.delete,
        },
      });
  }
}
