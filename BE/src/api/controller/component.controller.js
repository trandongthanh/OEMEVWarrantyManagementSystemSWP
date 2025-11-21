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

  createComponent = async (req, res, next) => {
    const payload = req.body;

    const result = await this.#componentService.createComponent(payload);

    res.status(201).json({
      status: "success",
      data: result,
    });
  };
}

export default ComponentController;
