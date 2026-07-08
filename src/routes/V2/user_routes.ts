import express from "express";
import { createAdmin } from "../../controllers/V2/user_controllers";

const router = express.Router();

router.post("/admin", createAdmin);

export default router;
