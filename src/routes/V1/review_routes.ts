import express from "express";
import {
  getReviews,
  updateReviewsApprove,
  updateReviewsReject,
} from "../../controllers/review_controllers";
const router = express.Router();

router.get("/", getReviews);
router.patch("/:id/approve", updateReviewsApprove);
router.patch("/:id/reject", updateReviewsReject);

export default router;
