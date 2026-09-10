import express from "express";
import {
  createAdmin,
  getAdmins,
} from "../../controllers/V2/admin_users_controllers";
import { requirePermission } from "../../middleware/permission_middleware";
import { audit } from "../../middleware/audit_middleware";

const router = express.Router();

// router.post(
//   "/admin",
//   audit("admin.create"),
// //   requirePermission("users", "edit"),
//   createAdmin,
// );
router.post(
  "/admin",
  audit("admin.create"),
  //   requirePermission("users", "edit"),
  createAdmin,
);
router.get(
  "/admin",
  // audit("admin.read"),
  //   requirePermission("users", "see"),
  getAdmins,
);

export default router;
