import { NextFunction, Request, Response } from "express";
import { isAdminRole } from "../utils/permission";

/**
 * Allows only the `admin` role through. This is the real security boundary
 * for role-management endpoints — the frontend hides the tab, but this
 * middleware is what actually enforces it.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (await isAdminRole(req.roleId ?? null)) return next();
  return res.status(403).json({ message: "Forbidden: admin only" });
}
