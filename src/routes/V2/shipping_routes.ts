import { Router } from "express";
import {
  deleteDeliveryLocationHandler,
  getDeliveryLocations,
  patchDeliveryLocation,
  postDeliveryLocation,
} from "../../controllers/V2/delivery_location_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";

const router = Router();

router.get(
  "/delivery-locations",
  requirePermission("shipping", "see"),
  getDeliveryLocations,
);
router.post(
  "/delivery-locations",
  audit("deliveryLocation.create"),
  requirePermission("shipping", "edit"),
  postDeliveryLocation,
);
router.patch(
  "/delivery-locations/:id",
  audit("deliveryLocation.update"),
  requirePermission("shipping", "edit"),
  patchDeliveryLocation,
);
router.delete(
  "/delivery-locations/:id",
  audit("deliveryLocation.delete"),
  requirePermission("shipping", "delete"),
  deleteDeliveryLocationHandler,
);

export default router;
