import { Router } from "express";
import { getAuditLogs } from "../../controllers/V2/audit_controllers";

// import { requirePermission } from "../../middleware/permission_middleware";

const router = Router();

router.get(
  "/",
  // , requirePermission("audit", "see")
  getAuditLogs,
);

export default router;
