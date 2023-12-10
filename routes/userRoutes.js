const express = require("express");
const userRouter = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loggedIn,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.get("/profile", auth, getUser);
userRouter.get("/loggedin", loggedIn);
userRouter.patch("/update-user", auth, updateUser);
userRouter.patch("/change-password", auth, changePassword);
userRouter.post("/forgot-password", forgotPassword);
userRouter.put("/reset-password/:token", resetPassword);

module.exports = userRouter;
