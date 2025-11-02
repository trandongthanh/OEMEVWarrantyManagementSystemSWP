import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const notificationNamespace = io.of("/notifications");

  notificationNamespace.use(socketAuth);
  notificationNamespace.on("connection", (socket) => {
    const { userId, roleName, serviceCenterId, companyId } = socket.user;

    if (roleName === "parts_coordinator_company" && companyId) {
      socket.join(`parts_coordinator_company_${companyId}`);
    }

    if (roleName === "emv_staff" && companyId) {
      socket.join(`emv_staff_${companyId}`);
    }

    if (roleName === "parts_coordinator_service_center" && companyId) {
      socket.join(`parts_coordinator_service_center_${companyId}`);
    }

    if (roleName && serviceCenterId) {
      socket.join(`user_${userId}`);
    }

    if (roleName === "service_center_technician" && serviceCenterId) {
      const roomName = `service_center_technician_${serviceCenterId}`;
      socket.join(roomName);
    }

    if (roleName === "service_center_staff" && serviceCenterId) {
      const roomName = `service_center_staff_${serviceCenterId}`;
      socket.join(roomName);
    }

    if (roleName === "service_center_manager" && serviceCenterId) {
      const roomName = `service_center_manager_${serviceCenterId}`;
      socket.join(roomName);
    }

    socket.on("disconnect", () => {
      console.log("User disconnected: " + roleName + " - " + socket.id);
    });
  });

  return { io, notificationNamespace };
}
