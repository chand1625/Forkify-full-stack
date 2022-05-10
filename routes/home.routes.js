const express = require("express");

const checkAuth = require("../middlewares/checkAuth.middleware");

const homeController = require("../controllers/home.controller");

const router = express.Router();

router.get("/", homeController.checkAuthorization, homeController.getHome);

router.get(
  "/dashboard",
  checkAuth.checkAdminAuthorization,
  homeController.getDashboard
);

module.exports = router;
