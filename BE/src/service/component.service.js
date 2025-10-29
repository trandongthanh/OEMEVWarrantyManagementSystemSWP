class ComponentService {
  #typeComponentRepository;

  constructor({ typeComponentRepository }) {
    this.#typeComponentRepository = typeComponentRepository;
  }

  getAll = async () => {
    return await this.#typeComponentRepository.findAll();
  };

  updateStatus = async (componentId) => {
    // Implement if needed
  };
}

export default ComponentService;