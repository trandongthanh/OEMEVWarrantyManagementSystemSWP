import express from "express";
import caselineRouter from "./customer.router.js";

const router = express.Router();

router.use("/guarantee-cases/:caseId/case-lines");

export default router;
