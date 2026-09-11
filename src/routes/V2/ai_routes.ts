import express from "express";
import { getCustomerFeedback } from "../../controllers/feedback_analytics_controllers";
import { getOrdersInsights } from "../../controllers/V2/ai_controllers";

const router = express.Router();

router.get("/orders/insight", getOrdersInsights);
router.get("/customer/feedback", getCustomerFeedback);

export default router;
