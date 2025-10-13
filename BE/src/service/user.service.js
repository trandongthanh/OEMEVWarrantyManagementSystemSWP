class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  getAllTechnicians = ({ status, serviceCenterId }) => {
    const technicians = this.userRepository.getAllTechnicians({
      status,
      serviceCenterId,
    });

    return technicians;
  };
}

export default UserService;
