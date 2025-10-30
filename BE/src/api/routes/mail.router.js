import express from "express";
import container from "../../../container.js";

const mailRouter = express.Router();

/**
 * @swagger
 * /api/v1/mail/send:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
mailRouter.post("/send", async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required"
      });
    }

    const mailController = container.resolve("mailController");
    await mailController.sendMail({ email });

    res.status(200).json({
      status: "success",
      message: "OTP sent to email successfully"
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/verify:
 *   post:
 *     summary: Verify OTP code
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
mailRouter.post("/verify", async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Email and OTP are required"
      });
    }

    const mailController = container.resolve("mailController");
    const isValid = await mailController.verifyMail({ email, otp });

    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP",
        isValid: false
      });
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      isValid: true
    });
  } catch (error) {
    next(error);
  }
});

export default mailRouter;
