'use strict';

/**
 * PractitionerDashboardSettings.js — Mongoose model for per-practitioner
 * dashboard configuration.
 *
 * Stores UI preferences such as the default date range filter, which charts
 * to show by default, and alert notification preferences.
 */

const mongoose = require('mongoose');

const VALID_DATE_RANGES = ['7_days', '30_days', '90_days', '6_months', '1_year', 'all_time'];

const practitionerDashboardSettingsSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner.
    practitionerId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    // Default date range applied when opening a client progress dashboard.
    defaultDateRange: {
      type:    String,
      enum:    VALID_DATE_RANGES,
      default: '90_days',
    },

    // Array of chart/widget identifiers the practitioner wants shown by default.
    // e.g. ['dimension_radar', 'session_frequency', 'activity_effectiveness']
    favoriteMetrics: {
      type:    [String],
      default: [],
    },

    // Structured notification preferences (flexible POJO).
    // e.g. { no_recent_session: true, declining_progress: true, goal_at_risk: false }
    alertPreferences: {
      type:    Object,
      default: () => ({
        no_recent_session:  true,
        declining_progress: true,
        goal_at_risk:       true,
      }),
    },
  },
  { timestamps: true }
);

// ── Export ────────────────────────────────────────────────────────────────────

const PractitionerDashboardSettings = mongoose.model(
  'PractitionerDashboardSettings',
  practitionerDashboardSettingsSchema
);

const exported = PractitionerDashboardSettings || {};
exported.VALID_DATE_RANGES = VALID_DATE_RANGES;

module.exports = exported;
