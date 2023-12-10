const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { success, failure } = require("../utils/response");
const User = require("../models/userModel");

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return failure(res, 401, "Access denied. Please Login!");

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id);
    if (!user) {
      return failure(res, 404, "User not found!");
    }
    req.user = user;
    next();
  } catch (ex) {
    return failure(res.status(res, 401, ex.message));
  }
});

module.exports = auth;
