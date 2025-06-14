const mongoose = require('mongoose');
const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickup: String,
  destination: String,
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' }
});
module.exports = mongoose.model('Ride', rideSchema);
