import { Router } from "express";
import { getScans, getScanById } from "../controllers/scans.controller.js";
import { validateObjectId } from "../middleware/validationMiddleware.js";

const router = Router();

router.get("/", getScans);
router.get("/:id", validateObjectId("id"), getScanById);

export default router;
