import { Router } from "express";
import { analyzeUrl, analyzeMessage, analyzeScreenshot, analyzeCombined } from "../controllers/analyze.controller.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";
import { validate, validateUrl, validateUrlArray } from "../middleware/validationMiddleware.js";

const router = Router();

router.post("/url", validateUrl("url"), analyzeUrl);
router.post("/message", validate(["text"]), analyzeMessage);
router.post("/screenshot", uploadMiddleware, analyzeScreenshot);
router.post("/combined", validate(["text"]), validateUrlArray("urls"), analyzeCombined);

export default router;
