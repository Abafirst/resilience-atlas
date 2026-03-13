const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  contact_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  team_size: { type: String, trim: true },
  message: { type: String, trim: true },
  stage: {
    type: String,
    enum: ['lead', 'demo_scheduled', 'pilot_running', 'customer'],
    default: 'lead',
  },
  notes: { type: String, trim: true },
  source: { type: String, default: 'team-page', trim: true },
}, { timestamps: true });

LeadSchema.index({ email: 1 });
LeadSchema.index({ stage: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', LeadSchema);
