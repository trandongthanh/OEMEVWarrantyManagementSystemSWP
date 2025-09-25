const app = require("./app");
const http = require("http");
const db = require("./models/index");
require("dotenv").config();

const server = http.createServer(app);

const PORT = process.env.PORT;

db.sequelize
  .authenticate()
  // .sync({ alter: true })
  // .sync({ force: true })
  .then(() => {
    console.log("Connect database successful");
    server.listen(PORT, () => {
      console.log(`Server is listening on ${PORT}`);
    });
  })
  .catch((err) => console.log(`Error is: ${err}`));
