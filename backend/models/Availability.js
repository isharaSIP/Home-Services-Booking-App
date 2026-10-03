const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  dateKey: {
    type: String,
    required: true, // e.g. "2026-10-05"
  },
  start: {
    type: Number,
    required: true, // minutes from midnight, e.g. 540 for 9:00 AM
  },
  end: {
    type: Number,
    required: true, // minutes from midnight, e.g. 660 for 11:00 AM
  },
  type: {
    type: String,
    enum: ["available", "booked"],
    default: "available",
  },
  title: {
    type: String,
    default: "Open for bookings",
  },
  custom: {
    type: Boolean,
    default: true,
  },
});

const availabilitySchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workingDays: {
      0: { type: Boolean, default: false }, // Sun
      1: { type: Boolean, default: true },  // Mon
      2: { type: Boolean, default: true },  // Tue
      3: { type: Boolean, default: true },  // Wed
      4: { type: Boolean, default: true },  // Thu
      5: { type: Boolean, default: true },  // Fri
      6: { type: Boolean, default: true },  // Sat
    },
    offDates: [
      {
        type: String, // Array of date keys e.g. ["2026-10-05", "2026-10-10"]
      },
    ],
    slots: [slotSchema],
  },
  {
    timestamps: true,
  }
);

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
