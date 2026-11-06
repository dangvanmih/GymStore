const mongoose = require("mongoose");
const generate = require("../helpers/generate")
const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    tokenUser: {
      type: String,
      default: generate.generateToken(20)
    },
    phone: String,
    avatar: String,
    favoriteIds: { type: [String], default: [] },
    status: {
      type: String,
      default: "active"
    },
    deleted: {
      type: Boolean,
      default: false
    },
    otp: String,
    otpExpires: Date,
    otpResendAt: Date,
    deletedAt: Date
  },

  {
    timestamps: true
  }
);
const User = mongoose.model("User", userSchema, "users");

module.exports = User;
