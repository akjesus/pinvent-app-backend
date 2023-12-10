const asyncHandler = require("express-async-handler");
const { success, failure } = require("../utils/response");
const sendEmail = require("../utils/sendEmail");
const Contact = require("../models/contactModel");
const User = require("../models/userModel");

const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const isUser = await User.findById(req.user._id);
  if (!isUser) {
    return failure(res, 401, "Unauthorized User, Please register!");
  }
  if (!subject || !message) return failure(res, 400, "Please fill all fields");

  const send_to = process.env.EMAIL_USERNAME;
  const send_from = process.env.EMAIL_USERNAME;
  const reply_to = req.user.email;
  try {
    await Contact.create({ user: req.user._id, subject, message });
    await sendEmail(subject, message, send_to, send_from, reply_to);
    return success(res, 200, `Email Message [${subject}] sent successfully`);
  } catch (err) {
    console.log(err);
    return failure(res, 500, err.message, err);
  }
});

module.exports = { contactUs };
