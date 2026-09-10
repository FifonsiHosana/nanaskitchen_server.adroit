import type { Request, Response, NextFunction } from "express";
import { Action, can, Resource } from "../utils/permission";

export function requirePermission(resource: Resource, action: Action) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // assumes your auth middleware already set req.user = { id, roleId }
    const roleId = req.roleId ?? null;

    if (!(await can(roleId, resource, action))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
