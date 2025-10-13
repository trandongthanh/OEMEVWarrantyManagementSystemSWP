class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  getTechnicians = async (req, res, next) => {
    const { serviceCenterId } = req.user;
    const { status } = req.query;
    const technicians = await this.userService.getAllTechnicians({
      status,
      serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: technicians,
    });
  };
}

export default UserController;
