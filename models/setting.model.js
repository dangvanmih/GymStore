const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  clientLogo: { type: String, default: "/client/images/logo.webp" },
  copyright: { type: String, default: "Copyright © 2026 DEGREY VIETNAM. Powered by Haravan" },
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema, "settings");
