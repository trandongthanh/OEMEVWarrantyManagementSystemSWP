import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../error/index.js";
import TokenService from "../../service/token.service.js";

import db from "../../models/index.cjs";

const { VehicleProcessingRecord, User, Record, Role } = db;

export function authentication(req, res, next) {
  const requestHeader = req.headers.authorization;

  if (!requestHeader) {
    throw new BadRequestError("Header is not contain information");
  }

  const token = requestHeader.split(" ")[1];

  if (!token) {
    throw new BadRequestError("You missing token in heaer");
  }

  const tokenService = new TokenService();

  const decode = tokenService.verify(token);

  if (!decode) {
    throw new BadRequestError("Token is invalid");
  }

  req.user = decode;

  next();
}

export function authorizationByRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleName)) {
      throw new ForbiddenError();
    }
    next();
  };
}

export async function attachCompanyContext(req, res, next) {
  const { serviceCenterId, companyId } = req.user;

  let vehicleCompanyId;
  if (companyId) {
    vehicleCompanyId = companyId;
  } else if (serviceCenterId) {
    const serviceCenterService = req.container.resolve("serviceCenterService");

    const company = await serviceCenterService.findCompanyByServiceCenterId({
      serviceCenterId: serviceCenterId,
    });

    vehicleCompanyId = company.vehicle_company_id;
  } else {
    throw new BadRequestError(
      "User is not associated with any company or service center"
    );
  }

  req.companyId = vehicleCompanyId;

  next();
}

export function handleError(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";
  const status = statusCode !== 500 ? "error" : "fail";

  res.status(statusCode).json({
    status: status,
    message: message,
  });
}

export async function canAssignTask(req, res, next) {
  const { roleName, serviceCenterId: managerServiceCenterId } = req.user;

  const { id } = req.params;

  const { technicianId } = req.body;

  const allowRoles = ["service_center_manager"];
  if (!allowRoles.includes(roleName)) {
    throw new ForbiddenError("You do not have the role to assign tasks.");
  }

  const record = await VehicleProcessingRecord.findByPk(id, {
    include: [
      {
        model: User,
        as: "createdByStaff",
        attributes: ["serviceCenterId"],
      },
    ],
  });

  if (!record) {
    throw new NotFoundError("Record not found.");
  }

  const recordJSON = record.toJSON();

  const technician = await User.findByPk(technicianId, {
    attributes: ["serviceCenterId"],

    include: [
      {
        model: Role,
        as: "role",
        attributes: ["roleName"],
      },
    ],
  });

  if (!technician) {
    throw new NotFoundError(`Technician with ID: ${technicianId} not found.`);
  }

  const technicianJSON = technician.toJSON();

  if (technicianJSON.role.roleName !== "service_center_technician") {
    throw new ForbiddenError(
      "techId you assign has role is not service_center_technician"
    );
  }

  if (!(recordJSON.createdByStaff.serviceCenterId === managerServiceCenterId)) {
    throw new ForbiddenError(
      "You can only assign tasks for records in your own service center."
    );
  }

  if (!(technicianJSON.serviceCenterId === managerServiceCenterId)) {
    throw new ForbiddenError(
      "You can only assign technicians from your own service center."
    );
  }

  next();
}

export const validate =
  (schema, property = "body") =>
  (req, res, next) => {
    const dataNeedToValidate = req[property];

    if (!dataNeedToValidate) {
      throw new BadRequestError(`Missing ${property} in request`);
    }

    const { error } = schema.validate(dataNeedToValidate);

    if (error) {
      const errorMessage = error.details[0].message;
      throw new BadRequestError(errorMessage);
    }

    next();
  };
