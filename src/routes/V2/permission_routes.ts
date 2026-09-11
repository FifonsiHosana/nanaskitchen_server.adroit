import express from "express";
import { getAllPermissions, getPermissionsForRole } from "../../utils/permission";
import { setRolePermissions, isKnownResource } from "../../utils/permission";
import type { Action, Resource } from "../../utils/permission";
import { db } from "../../models/db_connection";
import { roles } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../middleware/admin_middleware";
import { audit } from "../../middleware/audit_middleware";
const router = express.Router();

router.get("/me", async (req, res) => {
  const permissions = await getPermissionsForRole(req.roleId ?? null);
  res.json(permissions);
});

router.get("/roles", async (req, res) => {
  const allRoles = await db.select().from(roles);
  res.json(allRoles);
});

// Full role × resource matrix for the permissions editor. Admin only.
router.get("/matrix", requireAdmin, async (_req, res) => {
  res.json(await getAllPermissions());
});

// Replace (upsert) one role's permissions. Admin only. Body:
// { "permissions": { "<resource>": { "see": bool, "edit": bool, "delete": bool } } }
router.put("/roles/:roleId", audit("permissions.update"), requireAdmin, async (req, res) => {
  const roleId = Number(req.params.roleId);
  if (!Number.isInteger(roleId)) {
    return res.status(400).json({ message: "Invalid role id" });
  }

  const existing = await db.select().from(roles).where(eq(roles.id, roleId));
  if (!existing[0]) {
    return res.status(404).json({ message: "Role not found" });
  }

  const input = (req.body as { permissions?: unknown } | undefined)?.permissions;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return res.status(400).json({ message: "Body must be { permissions: { ... } }" });
  }

  const matrix: Partial<Record<Resource, Record<Action, boolean>>> = {};
  for (const [resource, flags] of Object.entries(
    input as Record<string, unknown>,
  )) {
    if (!isKnownResource(resource)) {
      return res.status(400).json({ message: `Unknown resource: ${resource}` });
    }
    if (
      !flags ||
      typeof flags !== "object" ||
      typeof (flags as Record<string, unknown>).see !== "boolean" ||
      typeof (flags as Record<string, unknown>).edit !== "boolean" ||
      typeof (flags as Record<string, unknown>).delete !== "boolean"
    ) {
      return res
        .status(400)
        .json({ message: `Invalid flags for resource: ${resource}` });
    }
    const f = flags as Record<Action, boolean>;
    matrix[resource] = { see: f.see, edit: f.edit, delete: f.delete };
  }

  await setRolePermissions(roleId, matrix);
  res.json({ roleId, permissions: await getPermissionsForRole(roleId) });
});

export default router;
