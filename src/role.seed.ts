import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./models/db_connection";
import { rolePermissions, roles, RESOURCES } from "../db";

type RoleName = "admin" | "manager" | "support" | "viewer";

type PermissionSet = Record<
  (typeof RESOURCES)[number],
  { see: boolean; edit: boolean; delete: boolean }
>;

const full = (): PermissionSet["orders"] => ({
  see: true,
  edit: true,
  delete: true,
});
const readOnly = (): PermissionSet["orders"] => ({
  see: true,
  edit: false,
  delete: false,
});
const none = (): PermissionSet["orders"] => ({
  see: false,
  edit: false,
  delete: false,
});

const ROLE_DEFINITIONS: Record<RoleName, PermissionSet> = {
  admin: {
    orders: full(),
    analytics: full(),
    products: full(),
    feedback: full(),
    reviews: full(),
    shipping: full(),
  },
  manager: {
    orders: { see: true, edit: true, delete: false },
    analytics: readOnly(),
    products: { see: true, edit: true, delete: false },
    feedback: readOnly(),
    reviews: readOnly(),
    shipping: { see: true, edit: true, delete: false },
  },
  support: {
    orders: { see: true, edit: true, delete: false },
    analytics: none(),
    products: readOnly(),
    feedback: { see: true, edit: true, delete: false },
    reviews: { see: true, edit: true, delete: false },
    shipping: { see: true, edit: true, delete: false },
  },
  viewer: {
    orders: readOnly(),
    analytics: readOnly(),
    products: readOnly(),
    feedback: readOnly(),
    reviews: readOnly(),
    shipping: readOnly(),
  },
};

export async function seedRoles() {
  console.log("Seeding roles and role_permissions...");

  for (const roleName of Object.keys(ROLE_DEFINITIONS) as RoleName[]) {
    // Upsert the role itself (idempotent — safe to re-run this script)
    await db
      .insert(roles)
      .values({ name: roleName })
      .onDuplicateKeyUpdate({ set: { name: roleName } });

    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));

    if (!role) {
      throw new Error(`Failed to find role "${roleName}" after insert`);
    }

    const permissions = ROLE_DEFINITIONS[roleName];

    const rows = RESOURCES.map((resource: (typeof RESOURCES)[number]) => ({
      roleId: role.id,
      resource,
      canSee: permissions[resource].see,
      canEdit: permissions[resource].edit,
      canDelete: permissions[resource].delete,
    }));

    // Upsert each (roleId, resource) row — re-running the seed updates
    // permissions in place instead of erroring on the primary key.
    for (const row of rows) {
      await db
        .insert(rolePermissions)
        .values(row)
        .onDuplicateKeyUpdate({
          set: {
            canSee: row.canSee,
            canEdit: row.canEdit,
            canDelete: row.canDelete,
          },
        });
    }

    console.log(`  ✓ ${roleName} (${rows.length} resource permissions)`);
  }

  console.log("Done.");
}


