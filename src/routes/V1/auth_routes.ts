import express from "express"
import { adminLogin, refreshToken } from "../../controllers/auth_controllers";
import { audit } from "../../middleware/audit_middleware";
const router = express.Router();

router.post("/login", audit("auth.login"), adminLogin);
router.post("/refresh", audit("auth.refresh"), refreshToken);

export default router;