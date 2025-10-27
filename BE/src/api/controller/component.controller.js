class ComponentController {
  #componentService;
  constructor({ componentService }) {
    this.#componentService = componentService;
  }

  updateStatus = async (req, res, next) => {
    const { componentId } = req.params;

    const component = this.#componentService.updateStatus(componentId);
  };
}

export default ComponentController;
