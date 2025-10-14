import app from "./app.js";
import db from "./src/models/index.cjs";
import http from "http";
import { configDotenv } from "dotenv";
// import { initializeScheduleGeneration } from "./src/scheduler/scheduleGenerator.js";
configDotenv();

const PORT = process.env.PORT;
const server = http.createServer(app);

db.sequelize
  .authenticate()
  // .sync()
  // .sync({ alter: true })
  // .sync({ force: true })
  .then(() => {
    console.log("Connect DB succesfull");
    server.listen(PORT, () => {
      // initializeScheduleGeneration();
      console.log(`Server is running on ${PORT}`);
    });
  })
  .catch((err) => console.log(`Error is ${err}`));
