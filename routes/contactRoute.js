const express = require("express");
const contactRouter = express.Router();
const auth = require("../middlewares/authMiddleware");
const { contactUs } = require("../controllers/contactController");

contactRouter.post("/", auth, contactUs);

module.exports = contactRouter;
