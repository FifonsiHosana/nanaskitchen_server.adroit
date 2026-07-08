const express = require("express");
const router = express.Router();
import {
  getAllCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getAllCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "../../controllers/V2/settingsController";

// Currency routes
router.get("/currencies", getAllCurrencies);
router.post("/currencies", createCurrency);
router.put("/currencies/:id", updateCurrency);
router.delete("/currencies/:id", deleteCurrency);

// Country routes
router.get("/countries", getAllCountries);
router.post("/countries", createCountry);
router.put("/countries/:id", updateCountry);
router.delete("/countries/:id", deleteCountry);

export default router;
