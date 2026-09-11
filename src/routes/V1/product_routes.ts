import express from "express";
import {
  createProduct,
  fetchProduct,
  getProducts,
  updateProduct,
} from "../../controllers/product_controllers";
import {
  imageDelete,
  imageExport,
} from "../../controllers/cloudinary_controller";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/image",
  requirePermission("products", "edit"),
  upload.single("image"),
  imageExport,
);
router.delete("/image", audit("products.image.delete"), requirePermission("products", "edit"), imageDelete);
router.get("/",  requirePermission("products", "see"), getProducts);
router.post("/create", audit("products.create"), requirePermission("products", "edit"), createProduct);
router.patch(
  "/update/:id",
  audit("products.update"),
  requirePermission("products", "edit"),
  updateProduct,
);
router.get("/:id", requirePermission("products", "see"), fetchProduct);

export default router;
