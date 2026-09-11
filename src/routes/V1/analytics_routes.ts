import { Router } from "express";
import {
  getRevenueOverTime,
  getSalesByCountry,
  getTopProducts,
  getRevenueByProduct,
  getOrderStatusBreakdown,
  getAvgOrderValue,
  getRevenueByCountryOverTime,
  getOrdersByCountry,
  getTopDeliveryLocations,
} from "../../controllers/sales_analytics_controllers";
import {
  getCustomerSegments,
  getTopCustomers,
  getCustomerSatisfaction,
  getRecentReviews,
  getRepeatPurchaseRate,
  getCustomerCountryDistribution,
  getOrdersPerCustomerDistribution,
} from "../../controllers/customer_analytics_controllers";
import { getWebsiteAnalytics } from "../../controllers/website_analytics_controllers";
import { getCustomerFeedback } from "../../controllers/feedback_analytics_controllers";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getFeedbackAnswersAnalytics,
} from "../../controllers/feedback_questions_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";

const router = Router();

// sales
router.get(
  "/sales/revenue",
  requirePermission("analytics", "see"),
  getRevenueOverTime,
);
router.get(
  "/sales/top-products",
  requirePermission("analytics", "see"),
  getTopProducts,
);

router.get(
  "/sales/delivery-locations",
  requirePermission("analytics", "see"),
  getTopDeliveryLocations,
);

router.get(
  "/customer/feedback",
  requirePermission("analytics", "see"),
  getCustomerFeedback,
);
router.get(
  "/customer/feedback-answers",
  requirePermission("analytics", "see"),
  getFeedbackAnswersAnalytics,
);

// Feedback question management
router.get(
  "/feedback-questions",
  requirePermission("feedback", "see"),
  listQuestions,
);
router.post(
  "/feedback-questions",
  audit("feedback.create"),
  requirePermission("feedback", "edit"),
  createQuestion,
);
router.patch(
  "/feedback-questions/:id",
  audit("feedback.update"),
  requirePermission("feedback", "edit"),
  updateQuestion,
);
router.delete(
  "/feedback-questions/:id",
  audit("feedback.delete"),
  requirePermission("feedback", "delete"),
  deleteQuestion,
);

router.get(
  "/sales/by-country",
  requirePermission("analytics", "see"),
  getSalesByCountry,
);
router.get(
  "/sales/by-product",
  requirePermission("analytics", "see"),
  getRevenueByProduct,
);
router.get(
  "/sales/order-status",
  requirePermission("analytics", "see"),
  getOrderStatusBreakdown,
);
router.get(
  "/sales/avg-order-value",
  requirePermission("analytics", "see"),
  getAvgOrderValue,
);
router.get(
  "/sales/revenue-by-country",
  requirePermission("analytics", "see"),
  getRevenueByCountryOverTime,
);
router.get(
  "/sales/order-country",
  requirePermission("analytics", "see"),
  getOrdersByCountry,
);

// customers
router.get(
  "/customers/segments",
  requirePermission("analytics", "see"),
  getCustomerSegments,
);
router.get(
  "/customers/top",
  requirePermission("analytics", "see"),
  getTopCustomers,
);
router.get(
  "/customers/satisfaction",
  requirePermission("analytics", "see"),
  getCustomerSatisfaction,
);
router.get(
  "/customers/reviews",
  requirePermission("analytics", "see"),
  getRecentReviews,
);
router.get(
  "/customers/repeat-rate",
  requirePermission("analytics", "see"),
  getRepeatPurchaseRate,
);
router.get(
  "/customers/country-distribution",
  requirePermission("analytics", "see"),
  getCustomerCountryDistribution,
);
router.get(
  "/customers/orders-distribution",
  requirePermission("analytics", "see"),
  getOrdersPerCustomerDistribution,
);

//website
router.get(
  "/website",
  requirePermission("analytics", "see"),
  getWebsiteAnalytics,
);

export default router;
