import express from "express";
import caselineRouter from "./caseLine.router.js";
import { authentication } from "../middleware/index.js";

const router = express.Router();

// router.get("/:id", (req, res) => {
//     const
// });

// router.get("/", authentication);

router.use("/:caseId/case-lines", caselineRouter);

export default router;
