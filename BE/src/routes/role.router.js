const express = require("express");
const RoleController = require("../controller/role.controller");

const router = express.Router();

router.post("/", RoleController.createRole);

module.exports = router;
