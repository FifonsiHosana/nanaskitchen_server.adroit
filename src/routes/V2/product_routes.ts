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
import {
  getFlavors,
  postFlavor,
} from "../../controllers/V2/flavor_controllers";
import {
  getVariants,
  postVariant,
} from "../../controllers/V2/variant_controllers";
import { postCatalogProduct } from "../../controllers/V2/product_catalog_controllers";
import { postPriceTier } from "../../controllers/V2/price_tier_create_controllers";
import { getPricingGroups } from "../../controllers/V2/pricing_group_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/create",
  audit("products.create"),
  requirePermission("products", "edit"),
  createProduct,
);
router.get("/all-products", requirePermission("products", "see"), getProducts);
router.get("/flavors", requirePermission("products", "see"), fetchFlavors);
router.get(
  "/productByflavor/:flavorId",

  requirePermission("products", "see"),
  getProductByFlavor,
);
router.get(
  "/productByflavor/tiers/:flavorId",
  requirePermission("products", "see"),
  fetchFullPriceListByFlavorId,
);

// Catalog management — flavors, variants, products, price tiers
router.get(
  "/catalog/flavors",
  requirePermission("products", "see"),
  getFlavors,
);
router.post(
  "/catalog/flavors",
  audit("flavor.create"),
  requirePermission("products", "edit"),
  postFlavor,
);
router.get(
  "/catalog/variants",
  requirePermission("products", "see"),
  getVariants,
);
router.post(
  "/catalog/variants",
  audit("variant.create"),
  requirePermission("products", "edit"),
  postVariant,
);
router.get(
  "/catalog/pricing-groups",
  requirePermission("products", "see"),
  getPricingGroups,
);
router.post(
  "/catalog/products",
  audit("product.create"),
  requirePermission("products", "edit"),
  postCatalogProduct,
);
router.post(
  "/catalog/price-tiers",
  audit("priceTier.create"),
  requirePermission("products", "edit"),
  postPriceTier,
);

router.get("/:productId", requirePermission("products", "see"), fetchProduct);

router.patch(
  "/price-list/tiers",
  audit("priceTier.update"),
  requirePermission("products", "edit"),
  updatePriceTiers,
);
router.get(
  "/price-list/tiers/preview-apply",
  requirePermission("products", "see"),
  previewApplyTiers,
);
router.post(
  "/price-list/tiers/apply",
  audit("priceTier.apply"),
  requirePermission("products", "edit"),
  applyTiersToFlavors,
);

router.delete(
  "/fixPriceList",
  audit("products.fixPriceList"),
  requirePermission("products", "edit"),
  fixPriceList,
);

// router.patch("/seedVariants", seedVariantIds);
// router.post("/bulkSeed", bulkInsertProductsAndPricing);
// router.post("/settinngsSeed", bulkInsertCountryProductSettings);

export default router;
