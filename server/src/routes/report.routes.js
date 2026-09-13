import { Router } from "express";
import { getReport, getReportUrdu } from "../controllers/report.controller.js";

const router = Router();

router.get("/:id", getReport);
router.post("/:id/urdu", getReportUrdu);

export default router;
