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

  referralCode: {
    type: String,
    default: null
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
    default: null
  },

  // B2B organization fields (null for free-tier / individual users)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },

  // Role within the organization
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member',
  },

  // Optional team assignment within the organization
  teamName: {
    type: String,
    default: null,
    trim: true,
  },

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

