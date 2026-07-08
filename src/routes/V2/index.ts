import { Router } from "express";
import productRoutes from "./product_routes";
import settingsRoutes from "./settings_routes";
import userRoutes from "./user_routes";
import shippingRoutes from "./shipping_routes";
import aiRoutes from "./ai_routes";

const router = Router();
router.use("/products", productRoutes);
router.use("/settings", settingsRoutes);
router.use("/user", userRoutes);
router.use("/shipping", shippingRoutes);
router.use("/ai", aiRoutes);

export default router;
