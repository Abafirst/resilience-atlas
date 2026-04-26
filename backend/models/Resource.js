'use strict';

/**
 * Resource Model
 *
 * Represents a content library item: article, video, PDF workbook, quiz,
 * podcast episode, or expert profile.
 */

const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const TagSchema = new mongoose.Schema({ value: { type: String, trim: true } }, { _id: false });

const ResourceSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 200,
    },
    slug: {
      type:   String,
      unique: true,
      trim:   true,
      lowercase: true,
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: 1000,
    },

    // ── Content type ─────────────────────────────────────────────────────────
    type: {
      type:     String,
      required: true,
      enum:     ['article', 'video', 'pdf', 'quiz', 'podcast', 'expert'],
      index:    true,
    },

    // ── Categorization ───────────────────────────────────────────────────────
    category: {
      type:  String,
      enum:  ['nutrition', 'exercise', 'meditation', 'sleep', 'relationships', 'career', 'general', 'clinician', 'caregiver'],
      index: true,
      default: 'general',
    },
    tags: {
      type: [String],
      default: [],
    },

    // ── Resilience dimension alignment ───────────────────────────────────────
    dimensions: {
      type: [String],
      enum: [
        'Cognitive-Narrative',
        'Emotional-Somatic',
        'Relational-Social',
        'Agentic-Generative',
        'Somatic-Regulative',
        'Spiritual-Reflective',
      ],
      default: [],
    },

    // ── Difficulty / time ────────────────────────────────────────────────────
    difficulty: {
      type:    String,
      enum:    ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index:   true,
    },
    timeCommitment: {
      // Estimated minutes
      type:    Number,
      min:     0,
      default: 5,
    },

    // ── Media / source ───────────────────────────────────────────────────────
    url:           { type: String, trim: true },  // external article / embed URL
    videoProvider: { type: String, enum: ['youtube', 'vimeo', 'other', null], default: null },
    videoId:       { type: String, trim: true },   // YouTube / Vimeo ID for embedding
    pdfUrl:        { type: String, trim: true },   // downloadable PDF / workbook
    thumbnailUrl:  { type: String, trim: true },

    // ── Article body (rich text / markdown) ──────────────────────────────────
    content:    { type: String, default: '' },
    excerpt:    { type: String, trim: true, maxlength: 500 },

    // ── Expert profile fields ─────────────────────────────────────────────────
    expertName:       { type: String, trim: true },
    expertTitle:      { type: String, trim: true },
    expertBio:        { type: String, trim: true },
    expertContactUrl: { type: String, trim: true },

    // ── Publishing ────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['draft', 'published', 'archived'],
      default: 'draft',
      index:   true,
    },
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },

    // ── Authorship ────────────────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },
    authorName:  { type: String, trim: true },

    // ── Engagement aggregates (denormalized for read perf) ────────────────────
    viewCount:      { type: Number, default: 0 },
    bookmarkCount:  { type: Number, default: 0 },
    completionCount:{ type: Number, default: 0 },
    averageRating:  { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:    { type: Number, default: 0 },

    // ── Community ─────────────────────────────────────────────────────────────
    communitySubmitted: { type: Boolean, default: false },
    submittedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    // ── Evidence labeling ─────────────────────────────────────────────────────
    sourceType: {
      type:    String,
      enum:    ['Peer-reviewed', 'Gov/Academic', 'Expert-informed'],
      default: null,
      index:   true,
    },

    // ── SEO ───────────────────────────────────────────────────────────────────
    metaTitle:       { type: String, trim: true, maxlength: 100 },
    metaDescription: { type: String, trim: true, maxlength: 200 },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

ResourceSchema.index({ status: 1, publishedAt: -1 });
ResourceSchema.index({ category: 1, type: 1, difficulty: 1 });
ResourceSchema.index({ dimensions: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ title: 'text', description: 'text', content: 'text' });

// ── Slug auto-generation ─────────────────────────────────────────────────────

ResourceSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }
  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);
