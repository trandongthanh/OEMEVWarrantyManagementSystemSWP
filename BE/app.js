import express from "express";
import { scopePerRequest } from "awilix-express";
import container from "./container.js";
import cors from "cors";
import { handleError } from "./src/api/middleware/index.js";
import { specs, swaggerUi } from "./src/config/swagger.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(scopePerRequest(container));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

import authRouter from "./src/api/routes/auth.router.js";
import userRouter from "./src/api/routes/user.router.js";
import vehicleRouter from "./src/api/routes/vehicle.router.js";
import customerRouter from "./src/api/routes/customer.router.js";
import vehicleProcessingRecordRouter from "./src/api/routes/vehicleProcessingRecord.router.js";
import guaranteeCaseRouter from "./src/api/routes/guaranteeCase.router.js";
import chatRouter from "./src/api/routes/chat.router.js";
import caseLineRouter from "./src/api/routes/caseLine.router.js";
import componentReservationsRouter from "./src/api/routes/componentReservations.router.js";
import componentRouter from "./src/api/routes/component.router.js";
import warehouseRouter from "./src/api/routes/warehouse.router.js";
import stockTransferRequestRouter from "./src/api/routes/stockTransferRequest.router.js";
import workScheduleRouter from "./src/api/routes/workSchedule.router.js";
import mailRouter from "./src/api/routes/mail.router.js";

app.get("/", async (req, res) => {
  res.send("Hello world");
});

const url = "/api/v1";

app.use(`${url}/auth`, authRouter);
app.use(`${url}/vehicles`, vehicleRouter);
app.use(`${url}/customers`, customerRouter);
app.use(`${url}/processing-records`, vehicleProcessingRecordRouter);
app.use(`${url}/users`, userRouter);
app.use(`${url}/guarantee-cases`, guaranteeCaseRouter);
app.use(`${url}/chats`, chatRouter);
app.use(`${url}/case-lines`, caseLineRouter);
app.use(`${url}/reservations`, componentReservationsRouter);
app.use(`${url}/warehouses`, warehouseRouter);
app.use(`${url}/components`, componentRouter);
app.use(`${url}/mail`, mailRouter);

app.use(`${url}/stock-transfer-requests`, stockTransferRequestRouter);
app.use(`${url}/work-schedules`, workScheduleRouter);

app.use(handleError);

export default app;
