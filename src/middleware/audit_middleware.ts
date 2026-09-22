import type { Request, Response, NextFunction } from "express";
import { db } from "../models/db_connection";
import { auditLogs } from "../../db";

export function audit(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      // req.userId is only set behind authMiddleware. On public routes
      // (e.g. auth.login) it is undefined — Number(undefined) is NaN, and
      // `??` does NOT catch NaN, so guard with Number.isFinite instead.
      const rawId = Number(req.userId);
      const adminId = Number.isFinite(rawId) ? rawId : null;

      const entry: typeof auditLogs.$inferInsert = {
        adminId,
        action,
        resourceId: typeof req.params.id === "string" ? req.params.id : null,
        statusCode: res.statusCode,
        createdAt: now,
      };

      db.insert(auditLogs)
        .values(entry)
        .catch((err) => console.error("[AUDIT] failed to write:", err));
    });

    next();
  };
}
