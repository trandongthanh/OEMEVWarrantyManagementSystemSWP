class TypeComponentController {
  #typeComponentService;
  constructor({ typeComponentService }) {
    this.#typeComponentService = typeComponentService;
  }

  getAllTypeComponents = async (req, res, next) => {
    const { page, limit, name, sku, category } = req.query;

    const result = await this.#typeComponentService.getAllTypeComponents({
      filters: { page, limit, name, sku, category },
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };
}

export default TypeComponentController;
