import type { Request, Response, NextFunction } from "express";
import { db } from "../models/db_connection";
import { auditLogs } from "../../db";

export function audit(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      const entry: typeof auditLogs.$inferInsert = {
        adminId: Number(req.userId) ?? null,
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
