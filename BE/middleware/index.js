import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../src/error/index.js";
import TokenService from "../src/service/token.service.js";

import db from "../models/index.cjs";

const { VehicleProcessingRecord, User, Record } = db;

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
    const serviceCenter = req.container.resolve("serviceCenterService");

    const company = await serviceCenter.findCompanyWithServiceCenterId({
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

export function hanldeError(err, req, res, next) {
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

  const allowRoles = ["service_center_staff"];
  if (!allowRoles.includes(roleName)) {
    throw new ForbiddenError("You do not have the role to assign tasks.");
  }

  const record = await await VehicleProcessingRecord.findByPk(id, {
    include: [
      {
        model: User,
        as: "createdByStaff",
        attributes: ["serviceCenterId"],
      },
    ],
  });

  const recordJSON = record.toJSON();

  if (!recordJSON) {
    throw new NotFoundError("Record not found.");
  }

  if (!recordJSON.createdByStaff?.serviceCenterId === managerServiceCenterId) {
    throw new ForbiddenError(
      "You can only assign tasks for records within your own service center"
    );
  }

  next();
}
