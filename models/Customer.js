const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "", trim: true },
    mobile: { type: String, default: "", trim: true, index: true },
    address: { type: String, default: "" },
    totalBookings: { type: Number, default: 0 },
    documents: { type: Array, default: [] },

    // keep original excel-style object
    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
