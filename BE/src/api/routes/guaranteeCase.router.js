import express from "express";
import caselineRouter from "./caseLine.router.js";

const router = express.Router();

// router.get("/:id", (req, res) => {
//     const
// });

router.use("/:caseId/case-lines", caselineRouter);

export default router;
