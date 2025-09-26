const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const authRouter = require("./src/routes/auth.router");
const roleRouter = require("./src/routes/role.router");
const vehicleCompanyRouter = require("./src/routes/vehicleCompany.router");
const vehicleRouter = require("./src/routes/vehicle.router");

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/role", roleRouter);
app.use("/api/v1/vehicleComany", vehicleCompanyRouter);
app.use("/api/v1/vehicle", vehicleRouter);

app.use((error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = app;
