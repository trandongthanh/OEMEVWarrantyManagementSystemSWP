class MailController {
  #mailService;

  constructor({ mailService }) {
    this.mailService = mailService;
  }
  sendMail = async ({ email }) => {
    await this.mailService.sendOTPEmail({ email });
  };

  verifyMail = async ({ email, otp }) => {
    const isValid = await this.mailService.verifyOTP({ email, otp });
    return isValid;
  };
}

export default MailController;
