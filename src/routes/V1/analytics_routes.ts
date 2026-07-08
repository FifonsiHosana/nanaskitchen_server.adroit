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

const router = Router();

// sales
router.get("/sales/revenue", getRevenueOverTime);
router.get("/sales/top-products", getTopProducts);
router.get("/customer/feedback", getCustomerFeedback);
router.get("/customer/feedback-answers", getFeedbackAnswersAnalytics);

// Feedback question management
router.get("/feedback-questions", listQuestions);
router.post("/feedback-questions", createQuestion);
router.patch("/feedback-questions/:id", updateQuestion);
router.delete("/feedback-questions/:id", deleteQuestion);

router.get("/sales/by-country", getSalesByCountry);
router.get("/sales/by-product", getRevenueByProduct);
router.get("/sales/order-status", getOrderStatusBreakdown);
router.get("/sales/avg-order-value", getAvgOrderValue);
router.get("/sales/revenue-by-country", getRevenueByCountryOverTime);
router.get("/sales/order-country", getOrdersByCountry);

// customers
router.get("/customers/segments", getCustomerSegments);
router.get("/customers/top", getTopCustomers);
router.get("/customers/satisfaction", getCustomerSatisfaction);
router.get("/customers/reviews", getRecentReviews);
router.get("/customers/repeat-rate", getRepeatPurchaseRate);
router.get("/customers/country-distribution", getCustomerCountryDistribution);
router.get("/customers/orders-distribution", getOrdersPerCustomerDistribution);

//website
router.get("/website", getWebsiteAnalytics);

export default router;
