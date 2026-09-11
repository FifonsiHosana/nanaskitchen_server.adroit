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
import { audit } from "../../middleware/audit_middleware";

// Currency routes
router.get("/currencies", getAllCurrencies);
router.post("/currencies", audit("currency.create"), createCurrency);
router.put("/currencies/:id", audit("currency.update"), updateCurrency);
router.delete("/currencies/:id", audit("currency.delete"), deleteCurrency);

// Country routes
router.get("/countries", getAllCountries);
router.post("/countries", audit("country.create"), createCountry);
router.put("/countries/:id", audit("country.update"), updateCountry);
router.delete("/countries/:id", audit("country.delete"), deleteCountry);

export default router;
