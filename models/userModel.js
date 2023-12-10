const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please fill the Name field"],
    },
    email: {
      type: String,
      required: [true, "Please fill the email field"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    photo: {
      type: String,
      default:
        "https://res.cloudinary.com/dylz588hc/image/upload/v1692218127/Avatars/canva-avatar1.jpg",
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must not be less than 6 characters"],
      select: false,
    },
    bio: {
      type: String,
      default: "This is a default bio, edit it to yours",
      minLength: [20, "Bio must not be less than 20 Characters"],
      maxLength: [250, "Bio must not be greater than 250 Characters"],
    },
    phone: {
      type: String,
      default: "+234",
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  //run this if password was not modified
  if (!this.isModified("password")) {
    return next();
  }
  //run this if password was modified, hash password and save
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
