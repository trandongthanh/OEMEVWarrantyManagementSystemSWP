import express from "express";
import { createCaseLinesSchema } from "../../validators/caseLine.validator";
import { authentication, authorizationByRole } from "../middleware";

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  authentication,
  authorizationByRole(["service_center_technician"]),
  async (req, res, next) => {}
);

export default router;
