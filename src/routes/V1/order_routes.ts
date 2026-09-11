import express from "express";
import {
  deleteOrder,
  getAllOrders,
  OrdersLockCheck,
  toggleOrderslock,
  updateOrderStatus,
} from "../../controllers/order_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";

const router = express.Router();

router.get(
  "/lock",
  audit("orders.lock"),
  requirePermission("orders", "edit"),
  toggleOrderslock,
);
router.get("/lock/status", requirePermission("orders", "see"), OrdersLockCheck);
// router.get("/:status", requirePermission("orders", "see"), getAllOrders);
router.get("/:status", getAllOrders);

router.patch(
  "/:id/status",
  audit("orders.updateStatus"),
  requirePermission("orders", "edit"),
  updateOrderStatus,
);
router.delete(
  "/:id",
  audit("orders.delete"),
  requirePermission("orders", "delete"),
  deleteOrder,
);

export default router;
