import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const OTP_EXPIRATION_SECONDS = 300;

class MailService {
  #redis;
  #tranporter;

  constructor({ redis, tranporter }) {
    this.#redis = redis;
    this.#tranporter = tranporter;
  }

  sendOTPEmail = async ({ email }) => {
    const otp = crypto.randomInt(100000, 999999).toString();

    const redisKey = `otp:${email}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in ${
        OTP_EXPIRATION_SECONDS / 60
      } minutes.`,
    };

    await this.#tranporter.sendMail(mailOptions);

    await this.#redis.setex(redisKey, OTP_EXPIRATION_SECONDS, otp);
  };

  verifyOTP = async ({ email, otp }) => {
    const storedOtp = await this.#redis.get(`otp:${email}`);

    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    await this.#redis.del(`otp:${email}`);
    return true;
  };
}

export default MailService;
