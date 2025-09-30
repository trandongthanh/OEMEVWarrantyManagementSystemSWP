import express from "express";
import cors from "cors";
import { scopePerRequest } from "awilix-express";
import container from "./container.js";
import { hanldeError } from "./middleware/index.js";
import { specs, swaggerUi } from "./config/swagger.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8080"],
    credentials: true,
  })
);

app.use(express.json());
app.use(scopePerRequest(container));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

import authRouter from "./src/routes/auth.router.js";
import vehicleRouter from "./src/routes/vehicle.router.js";
import customerRouter from "./src/routes/customer.router.js";

app.get("/", async (req, res) => {
  res.send("Hello world");
});

const url = "/api/v1";

app.use(`${url}/auth`, authRouter);
app.use(`${url}/vehicle`, vehicleRouter);
app.use(`${url}/customer`, customerRouter);

app.use(hanldeError);

export default app;
