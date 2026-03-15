const mongoose = require('mongoose');

/**
 * CustomAffirmation Schema
 * Stores user-created personal affirmations.
 */
const CustomAffirmationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  resilience_type: {
    type: String,
    enum: [
      'Cognitive-Narrative',
      'Relational-Connective',
      'Agentic-Generative',
      'Emotional-Adaptive',
      'Spiritual-Reflective',
      'Somatic-Regulative',
    ],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  relatedPractices: {
    type: [String],
    default: [],
  },
});

CustomAffirmationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CustomAffirmation', CustomAffirmationSchema);
