const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: {
    coding: { type: Number, default: 0 },
    resume: { type: Number, default: 0 },
    github: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  resumeAnalysis: {
    atsScore: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    feedback: [{ type: String }],
    improvements: [{
      original: String,
      suggested: String,
      reason: String
    }],
    parsedText: { type: String, default: '' }
  },
  githubAnalysis: {
    score: { type: Number, default: 0 },
    commitConsistency: { type: String, default: 'Moderate' },
    readmeQuality: { type: String, default: 'Basic' },
    portfolioMaturity: { type: String, default: 'Tutorial level' },
    projectFeedback: [{
      projectName: String,
      feedback: String,
      score: Number
    }],
    rawMetrics: mongoose.Schema.Types.Mixed
  },
  codingAnalysis: {
    score: { type: Number, default: 0 },
    solvedCount: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    },
    topicHeatmap: mongoose.Schema.Types.Mixed, // e.g. { "DP": "Weak", "Trees": "Moderate" }
    feedback: [{ type: String }]
  },
  communicationAnalysis: {
    score: { type: Number, default: 0 },
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
    role: { type: String, default: '' },
    structureRating: { type: String, default: '' },
    fillerWords: mongoose.Schema.Types.Mixed,
    feedback: [{ type: String }],
    suggestedBetterAnswer: { type: String, default: '' }
  },
  companyFit: {
    productTier1: { score: Number, status: String }, // e.g. Amazon, Google (Needs 3 Months)
    productTier2: { score: Number, status: String }, // e.g. Startups, Mid-tier Product
    serviceTier3: { score: Number, status: String }  // e.g. TCS, Infosys (Ready)
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
