import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT,
});

redisClient.on("connect", () => console.log("Kết nối đến Redis thành công"));
redisClient.on("error", (err) => console.error("Lỗi kết nối Redis: ", err));

export default redisClient;
