import { Router } from "express";
import productRoutes from "./product_routes";
import settingsRoutes from "./settings_routes";
import userRoutes from "./user_routes";
import shippingRoutes from "./shipping_routes";
import aiRoutes from "./ai_routes";
import authMiddleware from "../../middleware/auth_middleware";
import permissionRoutes from "./permission_routes";
import auditRoutes from "./audit_routes";

const router = Router();

router.use("/products", authMiddleware, productRoutes);
router.use("/settings", authMiddleware, settingsRoutes);
router.use("/user", authMiddleware, userRoutes);
router.use("/shipping", authMiddleware, shippingRoutes);
router.use("/ai", aiRoutes);
router.use("/permissions", authMiddleware, permissionRoutes);
router.use("/audit-logs", authMiddleware, auditRoutes);

export default router;
