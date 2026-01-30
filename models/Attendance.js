const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, required: true, unique: true, index: true },
    staffId: { type: String, default: "" },
    staffName: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    status: { type: String, default: "Present" }, // Present/Absent/Leave etc.

    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
