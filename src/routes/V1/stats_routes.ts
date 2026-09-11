import express from "express";
import { getOrderStats, getStats } from "../../controllers/stats_controller";
import { requirePermission } from "../../middleware/permission_middleware";
const router = express.Router();

// router.get("/chart", getChartData);
router.get("/:status", requirePermission("orders", "see"), getStats);
router.get("/orders", requirePermission("orders", "see"), getOrderStats);

export default router;
