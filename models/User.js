const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  portfolio: [
    {
      symbol: String,
      quantity: Number,
      avgPrice: Number,
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
