import express from "express";
import {
  getReviews,
  updateReviewsApprove,
  updateReviewsReject,
} from "../../controllers/review_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";
const router = express.Router();

router.get("/", requirePermission("reviews", "see"), getReviews);
router.patch("/:id/approve",audit("reviews.approve"), requirePermission("reviews", "edit"), updateReviewsApprove);
router.patch("/:id/reject", audit("reviews.reject"), requirePermission("reviews", "edit"), updateReviewsReject);

export default router;
