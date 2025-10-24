import dayjs from "dayjs";

class NotificationService {
  #notifications;

  constructor({ notifications }) {
    this.#notifications = notifications;
  }

  sendToRoom(roomName, eventName, data) {
    if (!roomName || typeof roomName !== "string") {
      return false;
    }

    if (!eventName || typeof eventName !== "string") {
      return false;
    }

    if (!data || typeof data !== "object") {
      return false;
    }

    console.log(
      `Sending notification to room: ${roomName}, event: ${eventName}, data: `,
      data
    );

    this.#notifications.to(roomName).emit(eventName, {
      ...data,
      sentAt: dayjs(),
      room: roomName,
    });

    return true;
  }
}

export default NotificationService;
