const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { success, failure } = require("../utils/response");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" });
};
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //VALIDATE REQUEST DATA
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all fields");
  }
  //VERIFY PASSWORD LENGTH
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password length must be up to 6 characters");
  }

  //CHECK IF USER EXISTS
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(409);
    throw new Error(`Email: [${email}] already in use`);
  }

  //CREATE USER
  const createdUser = await User.create({
    name,
    email,
    password,
  });
  if (createdUser) {
    const token = generateToken(createdUser._id);
    createdUser.password = undefined;
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sameSite: "none",
      secure: true,
    });
    return success(res, 201, "User Registered Successfully!", {
      user: createdUser,
      token,
    });
  } else {
    return failure(res, 500, "User not Created!");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return failure(res, 400, "Invalid Data Passed!");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return failure(res, 400, "This account does not exist. Please signup!");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return failure(res, 400, "Incorrect Email or Password");
  }
  const token = generateToken(user._id);
  user.password = undefined;
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    sameSite: "none",
    secure: true,
  });
  return success(res, 200, "Logged In successfully!", {
    user,
    token,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return success(res, 200, "Logged Out Successfully");
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return failure(res, 404, "No such user found");
  }
  return res.status(200).json(user);
});
const loggedIn = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (!verified) {
    return res.json(false);
  }
  return res.json(true);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, photo, bio, phone } = req.body;

  if (!user) {
    return failure(res, 404, "Invalid user, please log in!");
  }
  user.name = name || user.name;
  user.bio = bio || user.bio;
  user.photo = photo || user.photo;
  user.phone = phone || user.phone;
  const updateUser = await user.save();
  return res.status(202).json(updateUser);
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return failure(res, 400, "Please fill all fields");
  }
  if (newPassword !== confirmNewPassword) {
    return failure(res, 400, "Passwords do not match");
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return failure(res, 404, "Invalid User, Please Login");
  }
  const isMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isMatched) {
    return failure(res, 403, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  return success(res, 202, "Password changed successfully!", true);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return failure(res, 400, "Email field cannot be empty");
  }
  const user = await User.findOne({ email });
  if (!user) {
    return failure(res, 404, "Invalid email sent");
  }

  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  const expiresIn = Date.now() + 30 * 60 * 1000; // 30 minutes
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresIn;
  await user.save();
  const url = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `
  <h2> Hello ${user.name}</h2>
  <p>You requested for a password reset</p> 

  <p> Please use the url below to reset your password</p>
  <a href="${url}"clicktracking=off>Click here to Reset Password</a>

  <p> If the link above doesn't work kindly click the url below 
  or copy and paste the link into your browser</p>  
  <a href = "${url}">${url}<a>
  <p> Link is valid for 30 minutes </p>
  <p>Regards</p>
  <p>PINVENT-App Team</p>
  `;
  const subject = "Reset Password Link";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USERNAME;
  try {
    await sendEmail(subject, message, send_to, send_from);
    return success(res, 200, "Password reset email sent");
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return failure(res, 400, "No token provided");
  }

  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    return failure(res, 400, "Please provide both passwords");
  }
  if (password !== confirmPassword) {
    return failure(res, 400, "Passwords do not match");
  }
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return failure(res, 400, "Invalid or Expired Token");
  }
  // Update the users password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const message = `
  <h2> Hello ${user.name}</h2>
  <p>You successfully changed your password </p> 

  <p> If you did not authorised this, then do nothing</p>
  <p> Else kindly login and change your password</p>


  <p>Regards</p>
  <p>PINVENT-App Team</p>
  `;
  const subject = "Password Reset Successfully";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USERNAME;
  try {
    await sendEmail(subject, message, send_to, send_from);
    return success(res, 200, "Password updated successfully!");
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error(error);
  }
});
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loggedIn,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
