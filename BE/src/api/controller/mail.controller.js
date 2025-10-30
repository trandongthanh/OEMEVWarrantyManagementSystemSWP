class MailController {
  #mailService;
  constructor(mailService) {
    this.#mailService = mailService;
  }

  sendOtp = async (req, res) => {
    const { email, vin } = req.body;

    if (!email || !vin) {
      return res.status(400).json({
        status: "error",
        message: "Email and VIN are required",
      });
    }

    await this.#mailService.sendOTPEmail({ email, vin });

    return res.status(200).json({
      status: "success",
      message: "OTP email sent successfully",
    });
  };

  verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Email and OTP are required",
      });
    }

    const isValid = await this.#mailService.verifyOTP({ email, otp });
    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "OTP is invalid or has expired",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
    });
  };
}

export default MailController;
