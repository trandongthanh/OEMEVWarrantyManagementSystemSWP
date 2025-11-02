import express from "express";
import caselineRouter from "./caseLine.router.js";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

router.use("/:caseId/case-lines", caselineRouter);

export default router;
