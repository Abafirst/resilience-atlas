const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
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
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    affiliateCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: String,
        default: null
    },
    quizResults: [
        {
            completedAt: { type: Date, default: Date.now },
            scores: {
                emotional: Number,
                mental: Number,
                physical: Number,
                social: Number,
                spiritual: Number,
                financial: Number
            },
            overallScore: Number,
            dominantType: String
        }
    ],
    stripeCustomerId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.updatedAt = Date.now();
    next();
});

// Compare plain password with hashed
UserSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

// Return only safe, necessary fields in JSON output (excludes password and __v)
UserSchema.methods.toJSON = function () {
    return {
        _id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
        affiliateCode: this.affiliateCode,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        quizResults: this.quizResults,
        stripeCustomerId: this.stripeCustomerId
    };
};

module.exports = mongoose.model('User', UserSchema);
toJSON() {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        // Add other fields that should be returned here
    };
}
