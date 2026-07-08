import express from "express"
import { adminLogin, refreshToken } from "../../controllers/auth_controllers";
const router = express.Router();

router.post("/login",adminLogin);
router.post("/refresh",refreshToken);

export default router;