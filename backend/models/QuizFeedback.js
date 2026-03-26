'use strict';

const mongoose = require('mongoose');

/**
 * QuizFeedback — stores question flags and post-quiz feedback for admin review.
 *
 * Collects:
 *   - email: user's email (for grouping feedback)
 *   - flaggedQuestions: array of question IDs the user found confusing
 *   - feedbackText: freeform improvement suggestions
 *   - submittedAt: timestamp
 */
const quizFeedbackSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
            default: '',
        },
        // Original question IDs (1-based, as defined in quiz.js QUESTIONS array)
        flaggedQuestions: {
            type: [Number],
            default: [],
        },
        // Freeform text submitted via post-quiz feedback prompt
        feedbackText: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: '',
        },
    },
    { timestamps: true }
);

quizFeedbackSchema.index({ email: 1 });
quizFeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('QuizFeedback', quizFeedbackSchema);
