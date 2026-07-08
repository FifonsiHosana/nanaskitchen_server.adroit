import express from "express";

import { imageExport } from "../../controllers/cloudinary_controller";
import {
  // bulkInsertCountryProductSettings,
  // bulkInsertProductsAndPricing,
  createProduct,
  fetchFlavors,
  fetchFullPriceListByFlavorId,
  fetchProduct,
  fixPriceList,
  getProductByFlavor,
  getProducts,
  updatePriceTiers,
} from "../../controllers/V2/product_controllers";
import { seedVariantIds } from "../../controllers/V2/seed_controllers_2";
import {
  applyTiersToFlavors,
  previewApplyTiers,
} from "../../controllers/V2/price_tiers_controllers";
import { getFlavors, postFlavor } from "../../controllers/V2/flavor_controllers";
import { getVariants, postVariant } from "../../controllers/V2/variant_controllers";
import { postCatalogProduct } from "../../controllers/V2/product_catalog_controllers";
import { postPriceTier } from "../../controllers/V2/price_tier_create_controllers";
import { getPricingGroups } from "../../controllers/V2/pricing_group_controllers";
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/create", createProduct);
router.get("/all-products", getProducts);
router.get("/flavors", fetchFlavors);
router.get("/productByflavor/:flavorId", getProductByFlavor);
router.get("/productByflavor/tiers/:flavorId", fetchFullPriceListByFlavorId);

// Catalog management — flavors, variants, products, price tiers
router.get("/catalog/flavors", getFlavors);
router.post("/catalog/flavors", postFlavor);
router.get("/catalog/variants", getVariants);
router.post("/catalog/variants", postVariant);
router.get("/catalog/pricing-groups", getPricingGroups);
router.post("/catalog/products", postCatalogProduct);
router.post("/catalog/price-tiers", postPriceTier);

router.get("/:productId", fetchProduct);

router.patch("/price-list/tiers", updatePriceTiers);
router.get("/price-list/tiers/preview-apply", previewApplyTiers);
router.post("/price-list/tiers/apply", applyTiersToFlavors);

router.delete("/fixPriceList", fixPriceList);

// router.patch("/seedVariants", seedVariantIds);
// router.post("/bulkSeed", bulkInsertProductsAndPricing);
// router.post("/settinngsSeed", bulkInsertCountryProductSettings);

export default router;

