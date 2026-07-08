import express from "express";
import {
  deleteOrder,
  getAllOrders,
  OrdersLockCheck,
  toggleOrderslock,
  updateOrderStatus,
} from "../../controllers/order_controllers";

const router = express.Router();

router.get("/lock", toggleOrderslock);
router.get("/lock/status", OrdersLockCheck);
router.get("/:status", getAllOrders);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
