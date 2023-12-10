const mongoose = require("mongoose");
const validator = require("validator");

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please fill the user field"],
    },
    subject: {
      type: String,
      required: [true, "Please add a subject "],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Please add a message "],
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;
