const express = require("express");

const { getDashboardController } = require("./dashboard.controller");

const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getDashboardController);

module.exports = router;
