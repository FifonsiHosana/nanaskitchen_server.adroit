import express from "express";
import { getOrderStats, getStats } from "../../controllers/stats_controller";
import { requirePermission } from "../../middleware/permission_middleware";
const router = express.Router();

router.get("/:status", requirePermission("analytics", "see"), getStats);
// router.get("/chart", getChartData);
router.get("/orders", requirePermission("analytics", "see"), getOrderStats);

export default router;
