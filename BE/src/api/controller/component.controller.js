class ComponentController {
  #componentService;
  constructor({ componentService }) {
    this.#componentService = componentService;
  }

  getAll = async (req, res, next) => {
    try {
      const components = await this.#componentService.getAll();
      res.status(200).json({
        status: "success",
        data: {
          components,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const { componentId } = req.params;
      const component = await this.#componentService.updateStatus(componentId);
      res.status(200).json({
        status: "success",
        data: {
          component,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ComponentController;
