import express from "express";
import {
  addCountry,
  addDeliveryLocation,
  deleteCountry,
  deleteDeliveryLocation,
  getAllCountries,
  getAllDeliveryLocations,
  updateDeliveryLocation,
} from "../../controllers/countries_and_locations_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";

const router = express.Router();

//Countries
router.get("/countries", requirePermission("shipping", "see"), getAllCountries);
router.post(
  "/add-country",
  audit("country.add"),
  requirePermission("shipping", "edit"),
  addCountry,
);
router.delete(
  "/countries/:id",
  audit("country.delete"),
  requirePermission("shipping", "delete"),
  deleteCountry,
);

//Delivery locations
router.get(
  "/delivery-locations",
  requirePermission("shipping", "see"),
  getAllDeliveryLocations,
);
router.post(
  "/add-delivery-location",
  audit("deliveryLocation.add"),

  requirePermission("shipping", "edit"),
  addDeliveryLocation,
);
router.put(
  "/delivery-locations/:id",
  audit("deliveryLocation.update"),
  requirePermission("shipping", "edit"),
  updateDeliveryLocation,
);
router.delete(
  "/delivery-locations/:id",
  audit("deliveryLocation.delete"),
  requirePermission("shipping", "delete"),
  deleteDeliveryLocation,
);

export default router;
