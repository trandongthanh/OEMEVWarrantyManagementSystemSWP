import { Op } from "sequelize";

class TypeComponentService {
  #typeComponentRepository;

  constructor({ typeComponentRepository }) {
    this.#typeComponentRepository = typeComponentRepository;
  }

  getAllTypeComponents = async ({ filters = {} }) => {
    const { page, limit, name, sku, category } = filters;

    const where = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (sku) {
      where.sku = { [Op.like]: `%${sku}%` };
    }

    if (category) {
      where.category = category;
    }

    const limitParsed = parseInt(limit, 10) || 20;
    const pageParsed = parseInt(page, 10) || 1;
    const offset = (pageParsed - 1) * limitParsed;

    const { count, rows } = await this.#typeComponentRepository.findAndCountAll(
      {
        where,
        limit: limitParsed,
        offset,
      }
    );

    const totalPages = Math.ceil(count / limitParsed);

    return {
      items: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageParsed,
        itemsPerPage: limitParsed,
      },
    };
  };
}

export default TypeComponentService;
