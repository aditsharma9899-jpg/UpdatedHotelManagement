const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, index: true },
    customerName: { type: String, default: "" },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },

    // keep original object (excel keys)
    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
