const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  providerName: { type: String, required: true },
  customerName: { type: String, required: true },
  service: { type: String, required: true },
  startsAt: { type: Date, required: true },
  problem: { type: String, required: true, maxlength: 2000 },
  location: { type: String, required: true, maxlength: 500 },
  notes: { type: String, default: '', maxlength: 1000 },
  price: { type: Number, default: null },
  priceUnit: { type: String, default: 'visit' },
  status: { type: String, enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'rejected'], default: 'pending' },
  // A single atomic unique key reserves a provider appointment across all customers.
  slotKey: { type: String },
  requestId: { type: String, required: true },
}, { timestamps: true });
schema.index({ slotKey: 1 }, { unique: true, sparse: true });
schema.index({ customer: 1, requestId: 1 }, { unique: true });
module.exports = mongoose.model('Booking', schema);
