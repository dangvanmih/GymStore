const mongoose = require("mongoose");
const generate = require("../helpers/generate")
const accountSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    token: {
      type: String,
      default: generate.generateToken(20)
    },
    phone: String,
    role_id: String,
    avatar: String,
    status: String,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
  },
  {
    timestamps: true
  }

);
const Account = mongoose.model("Account", accountSchema, "accounts");

module.exports = Account;