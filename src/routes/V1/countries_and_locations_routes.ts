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

const router = express.Router();

//Countries
router.get("/countries", getAllCountries);
router.post("/add-country", addCountry);
router.delete("/countries/:id", deleteCountry);

//Delivery locations
router.get("/delivery-locations", getAllDeliveryLocations);
router.post("/add-delivery-location", addDeliveryLocation);
router.put("/delivery-locations/:id", updateDeliveryLocation);
router.delete("/delivery-locations/:id", deleteDeliveryLocation);

export default router;
