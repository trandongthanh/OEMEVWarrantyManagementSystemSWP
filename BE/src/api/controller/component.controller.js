class ComponentController {
  #componentService;

  constructor({ componentService }) {
    this.#componentService = componentService;
  }

  listComponents = async (req, res, next) => {
    const components = await this.#componentService.listComponents(req.query);

    res.status(200).json({
      status: "success",
      data: {
        components,
      },
    });
  };
}

export default ComponentController;
