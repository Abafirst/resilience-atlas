'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizQuestionSchema = new Schema({
  questionId:    { type: String, required: true },
  question:      { type: String, required: true },
  answerType:    { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
  options:       { type: [String], default: [] },
  correctAnswer: { type: String,   default: '' },
  explanation:   { type: String,   default: '' },
}, { _id: false });

const sectionSchema = new Schema({
  sectionId:    { type: String, required: true },
  sectionTitle: { type: String, required: true },
  contentType:  { type: String, enum: ['video', 'reading', 'quiz', 'reflection'], default: 'reading' },
  contentUrl:   { type: String, default: '' },
  duration:     { type: Number, default: 0 },  // minutes
  transcript:   { type: String, default: '' },
  content:      { type: String, default: '' },  // markdown for readings
  keyTakeaways: { type: [String], default: [] },
  resources: [{
    title: { type: String, default: '' },
    url:   { type: String, default: '' },
  }],
  quiz: {
    questions:    { type: [quizQuestionSchema], default: [] },
    passingScore: { type: Number, default: 80 },
  },
}, { _id: false });

const ttfModuleContentSchema = new Schema({
  moduleNumber:      { type: Number, required: true, unique: true, min: 1, max: 6 },
  moduleName:        { type: String, required: true },
  moduleDescription: { type: String, default: '' },
  color:             { type: String, default: '#4f46e5' },
  bg:                { type: String, default: '#eef2ff' },
  sections:          { type: [sectionSchema], default: [] },
  estimatedDuration: { type: Number, default: 0 },  // total minutes
  prerequisites:     { type: [Number], default: [] },
}, {
  timestamps: true,
  collection: 'ttfModuleContent',
});

module.exports = mongoose.model('TTFModuleContent', ttfModuleContentSchema);
