import { Router } from "express";
import { getReport, getReportUrdu } from "../controllers/report.controller.js";
import { validateObjectId } from "../middleware/validationMiddleware.js";

const router = Router();

router.get("/:id", validateObjectId("id"), getReport);
router.post("/:id/urdu", validateObjectId("id"), getReportUrdu);

export default router;
