import express from "express"
import { getOrderStats, getStats } from "../../controllers/stats_controller";
const router = express.Router();

router.get("/:status",getStats);
// router.get("/chart", getChartData);
router.get("/orders", getOrderStats);



export default router;