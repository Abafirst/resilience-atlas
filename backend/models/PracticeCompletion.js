const mongoose = require('mongoose');

/**
 * PracticeCompletion Schema
 * Tracks when a user completes a micro-practice, along with optional
 * reflection responses and the frameworks engaged.
 */
const PracticeCompletionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  practiceId: {
    type: String,
    required: true,
    trim: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  reflectionResponse: {
    type: String,
    default: '',
    maxlength: 2000,
    trim: true
  },
  difficulty_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  framework_principles_engaged: {
    type: [String],
    default: []
  }
});

// Index for efficient querying by userId and date
PracticeCompletionSchema.index({ userId: 1, completedAt: -1 });
PracticeCompletionSchema.index({ practiceId: 1, completedAt: -1 });

module.exports = mongoose.model('PracticeCompletion', PracticeCompletionSchema);
