import express from "express";
import { authentication } from "../middleware/index.js";

const router = express.Router();

router.get("/", authentication, async (req, res, next) => {
  const componentController = req.container.resolve("componentController");

  await componentController.listComponents(req, res, next);
});

export default router;
