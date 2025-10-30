import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
} from "../../validators/mail.validator.js";

const router = express.Router();

/**
 * @swagger
 * /mail/otp/send:
 *   post:
 *     summary: Gửi OTP xác thực email
 *     description: Gửi mã OTP 6 chữ số tới email người dùng. Mã có hiệu lực trong 5 phút.
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
 *                 example: "visitor@example.com"
 *     responses:
 *       200:
 *         description: OTP đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "OTP email sent successfully"
 *       400:
 *         description: Thiếu email hoặc email không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Email is required"
 */
router.post(
  "/otp/send",
  authentication,
  authorizationByRole(["service_center_staff", "service_center_technician"]),
  validate(sendOtpSchema),
  async (req, res, next) => {
    const mailController = req.container.resolve("mailController");
    await mailController.sendOtp(req, res, next);
  }
);

/**
 * @swagger
 * /mail/otp/verify:
 *   post:
 *     summary: Xác thực OTP cho email
 *     description: Kiểm tra mã OTP đã gửi. Khi thành công, hệ thống lưu cờ xác thực trong 10 phút để cho phép thao tác tiếp theo.
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
 *                 example: "visitor@example.com"
 *               otp:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *       400:
 *         description: Email hoặc OTP thiếu/sai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "OTP is invalid or has expired"
 */
router.post(
  "/otp/verify",
  authentication,
  authorizationByRole(["service_center_staff", "service_center_technician"]),
  validate(verifyOtpSchema),

  async (req, res, next) => {
    const mailController = req.container.resolve("mailController");

    await mailController.verifyOtp(req, res, next);
  }
);

export default router;
