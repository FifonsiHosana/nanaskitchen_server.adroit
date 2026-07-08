import { Router } from "express";
import authRoutes from "./auth_routes";
import productRoutes from "./product_routes";
import orderRoutes from "./order_routes";
import reviewRoutes from "./review_routes";
import statsRoutes from "./stats_routes";
import analyticsRoutes from "./analytics_routes";
import authMiddleware from "../../middleware/auth_middleware";
// import userRoleRoutes from "./user_role_routes";
import deliveryRoutes from "../V1/countries_and_locations_routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", authMiddleware, productRoutes);
router.use("/orders", authMiddleware, orderRoutes);
router.use("/reviews", authMiddleware, reviewRoutes);
router.use("/stats", authMiddleware, statsRoutes);
router.use("/analytics", authMiddleware, analyticsRoutes);
// router.use("/user-roles", authMiddleware, userRoleRoutes);
router.use("/shipping", authMiddleware, deliveryRoutes);

export default router;
