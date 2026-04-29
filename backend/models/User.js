const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  // Code the user entered at signup (the referrer's affiliateCode)
  referredBy: {
    type: String,
    default: null,
    index: true
  },

  // Legacy field kept for backwards-compat (same as referredBy)
  referralCode: {
    type: String,
    default: null
  },

  // This user's own unique shareable code
  affiliateCode: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },

  // Referral reward credits balance
  referralCredits: {
    type: Number,
    default: 0
  },

  // Lifetime total referral rewards earned
  referralRewardsEarned: {
    type: Number,
    default: 0
  },

  purchasedDeepReport: {
    type: Boolean,
    default: false
  },

  atlasPremium: {
    type: Boolean,
    default: false
  },

  purchaseDate: {
    type: Date,
    default: null,
  },

  // Timestamp of the last successfully generated PDF report.
  // Used to enforce the Atlas Navigator 1-per-30-days quota.
  lastPdfGeneratedAt: {
    type: Date,
    default: null,
  },

  // B2B organization fields (optional, null for free-tier users)
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },

  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member',
  },

  teamName: {
    type: String,
    default: null,
    trim: true,
  },

  // Practice membership (null if solo practitioner)
  practiceId: {
    type: String,
    default: null,
    index: true,
  },

  // Role within practice
  practiceRole: {
    type: String,
    enum: ['owner', 'admin', 'clinician', 'therapist', 'observer', null],
    default: null,
  },

  // Date joined practice
  practiceJoinedAt: { type: Date, default: null },

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {

  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
