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
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/image", upload.single("image"), imageExport);
router.delete("/image", imageDelete);
router.get("/", getProducts);
router.post("/create", createProduct);
router.patch("/update/:id", updateProduct);
router.get("/:id", fetchProduct);

export default router;
