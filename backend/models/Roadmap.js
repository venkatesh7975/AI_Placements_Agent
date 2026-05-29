const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  summary: { type: String, default: '' },
  sprintPlan: [{
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      resources: [{ type: String }],
      status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
    }]
  }],
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
