import express from "express";

const router = express.Router();

router.post("/", async (req, res, next) => {
  const authController = req.container.resolve("authController");

  await authController.register(req, res, next);
});

export default router;
