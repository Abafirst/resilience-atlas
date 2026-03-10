const mongoose = require('mongoose');

const ResilienceResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  overall: Number,
  dominantType: String,
  scores: {
    type: Map,
    of: {
      raw: Number,
      max: Number,
      percentage: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ResilienceResult', ResilienceResultSchema);
