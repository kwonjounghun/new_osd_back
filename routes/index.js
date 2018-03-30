var express = require("express");
var router = express.Router();
var users = require("./users");
var design = require("./design");
var group = require("./group");
var designer = require("./designer");
var admins = require("./admins");

/* GET home page. */
router.use("/users", users);
router.use("/design", design);
router.use("/admins", admins);
router.use("/group", group);
router.use("/designer", designer);

module.exports = router;
