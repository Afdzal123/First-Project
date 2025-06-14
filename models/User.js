const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['passenger', 'driver', 'admin'], default: 'passenger' }
});
module.exports = mongoose.model('User', userSchema);
