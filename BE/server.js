import app from "./app.js";
import db from "./src/models/index.cjs";
import http from "http";
import { configDotenv } from "dotenv";
import { initializeSocket } from "./src/socket/socket.js";
import { setupContainer } from "./container.js";
configDotenv();

const PORT = process.env.PORT;
const server = http.createServer(app);

const { io, notificationNamespace, chatNamespace } = initializeSocket(server);

setupContainer({ io, notificationNamespace, chatNamespace });

db.sequelize
  .authenticate()
  // .sync()
  // .sync({ alter: true })
  // .sync({ force: true })
  .then(() => {
    console.log("Connect DB succesfull");
    server.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
  })
  .catch((err) => console.log(`Error is ${err}`));
