import { Router } from "express";
import {
  deleteDeliveryLocationHandler,
  getDeliveryLocations,
  patchDeliveryLocation,
  postDeliveryLocation,
} from "../../controllers/V2/delivery_location_controllers";

const router = Router();

router.get("/delivery-locations", getDeliveryLocations);
router.post("/delivery-locations", postDeliveryLocation);
router.patch("/delivery-locations/:id", patchDeliveryLocation);
router.delete("/delivery-locations/:id", deleteDeliveryLocationHandler);

export default router;
