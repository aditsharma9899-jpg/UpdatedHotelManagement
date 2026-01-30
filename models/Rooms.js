const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    floor: { type: String, default: "" },
    roomNumber: { type: String, required: true, unique: true },
    status: { type: String, default: "available" }, // available/occupied
    type: { type: String, default: "" },
    price: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
