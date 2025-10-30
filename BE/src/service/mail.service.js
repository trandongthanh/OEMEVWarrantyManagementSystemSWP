import crypto from "crypto";
import dotenv from "dotenv";
import { BadRequestError } from "../error/index.js";
dotenv.config();

const OTP_EXPIRATION_SECONDS = 300;
const OTP_VERIFIED_SECONDS = 600;

class MailService {
  #redis;
  #transporter;
  #customerService;

  constructor({ redis, transporter, customerService }) {
    this.#redis = redis;
    this.#transporter = transporter;
    this.#customerService = customerService;
  }

  sendOTPEmail = async ({ email, vin }) => {
    if (typeof email !== "string" || email.trim() === "") {
      throw new BadRequestError("Email is required to send OTP");
    }

    const existingCustomer =
      await this.#customerService.findCustomerByPhoneOrEmail({
        email: email,
      });

    if (!existingCustomer) {
      throw new BadRequestError(
        `Cannot send OTP to email ${email} because it is not associated with any customer`
      );
    }

    const vehicles = existingCustomer.vehicles || [];

    const existingVehicle = vehicles.find((vehicle) => vehicle.vin === vin);

    if (!existingVehicle) {
      throw new BadRequestError(
        `Cannot send OTP to email ${email} because it is not associated with vehicle VIN ${vin}`
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpKey = `otp:${normalizedEmail}`;
    const verifiedKey = `otp:verified:${normalizedEmail}`;

    const otp = crypto.randomInt(100000, 999999).toString();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in ${
        OTP_EXPIRATION_SECONDS / 60
      } minutes.`,
    };

    await this.#transporter.sendMail(mailOptions);

    await Promise.all([
      this.#redis.del(verifiedKey),
      this.#redis.setex(otpKey, OTP_EXPIRATION_SECONDS, otp),
    ]);
  };

  verifyOTP = async ({ email, otp }) => {
    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      email.trim() === "" ||
      otp.trim() === ""
    ) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    const otpKey = `otp:${normalizedEmail}`;
    const verifiedKey = `otp:verified:${normalizedEmail}`;

    const storedOtp = await this.#redis.get(otpKey);

    if (!storedOtp || storedOtp !== normalizedOtp) {
      return false;
    }

    await Promise.all([
      this.#redis.del(otpKey),
      this.#redis.setex(verifiedKey, OTP_VERIFIED_SECONDS, "true"),
    ]);

    return true;
  };
}

export default MailService;
