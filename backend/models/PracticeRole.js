'use strict';
const mongoose = require('mongoose');
const practiceRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, enum: ['admin', 'clinician', 'therapist', 'observer'] },
  description: { type: String, default: '' },
  permissions: { type: Object, default: {} },
}, { timestamps: true });
module.exports = mongoose.model('PracticeRole', practiceRoleSchema);
