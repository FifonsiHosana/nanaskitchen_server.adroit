import { desc, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { admin, auditLogs } from "../../../db";
import { db } from "../../models/db_connection";

export const getAuditLogs = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = 50;

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceId: auditLogs.resourceId,
      statusCode: auditLogs.statusCode,
      createdAt: auditLogs.createdAt,
      adminName: admin.name,
      adminEmail: admin.email,
    })
    .from(auditLogs)
    .leftJoin(admin, eq(auditLogs.adminId, admin.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  res.json({ logs, page, pageSize });
};
