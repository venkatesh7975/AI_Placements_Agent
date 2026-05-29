const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const aiService = require('../services/agents/AgentCoordinator');

// @route   POST api/roadmap/generate
// @desc    Generate personalized 7-Day sprint roadmap
exports.generateRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const assessment = await Assessment.findOne({ userId: req.user.id });

    if (!assessment || assessment.scores.overall === 0) {
      return res.status(400).json({ msg: 'Please complete your profile assessments first before generating a roadmap.' });
    }

    // Identify weaknesses
    const weaknesses = [];
    if (assessment.scores.resume < 70) weaknesses.push('Resume optimization / ATS format');
    if (assessment.scores.github < 70) weaknesses.push('GitHub repository READMEs and project MVC architecture');
    if (assessment.scores.coding < 70) weaknesses.push('DSA solving volume and problem solving medium/hard stamina');

    // Inspect DSA heatmap for weak topics
    if (assessment.codingAnalysis?.topicHeatmap) {
      Object.entries(assessment.codingAnalysis.topicHeatmap).forEach(([topic, rating]) => {
        if (rating === 'Weak') {
          weaknesses.push(`DSA: ${topic}`);
        }
      });
    }

    if (weaknesses.length === 0) {
      weaknesses.push('Advanced dynamic programming and high-scalability backend system design concepts');
    }

    console.log(`Generating personalized 7-day roadmap. Weaknesses identified: ${weaknesses.join(', ')}`);
    const targetCompanies = user.targetCompanies || ['Product Startups'];

    const aiRoadmapResult = await aiService.generateRoadmap(
      assessment.scores,
      weaknesses,
      targetCompanies
    );

    // Remove any existing active roadmap
    await Roadmap.deleteMany({ userId: req.user.id });

    const roadmap = new Roadmap({
      userId: req.user.id,
      assessmentId: assessment.id,
      summary: aiRoadmapResult.summary || 'Prepare yourself for placements with this structured sprint.',
      sprintPlan: aiRoadmapResult.sprintPlan || []
    });

    await roadmap.save();
    res.json(roadmap);
  } catch (err) {
    console.error('Error generating roadmap:', err);
    res.status(500).send('Internal server error during roadmap generation');
  }
};

// @route   GET api/roadmap/current
// @desc    Retrieve active 7-Day roadmap
exports.getCurrentRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.id });
    if (!roadmap) {
      return res.status(404).json({ msg: 'No active roadmap found. Generate one now.' });
    }
    res.json(roadmap);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error retrieving active roadmap');
  }
};

// @route   PUT api/roadmap/task/:day/:taskIndex
// @desc    Toggle status of a roadmap item
exports.toggleTaskStatus = async (req, res) => {
  const dayNum = Number(req.params.day);
  const taskIndex = Number(req.params.taskIndex);

  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.id });
    if (!roadmap) {
      return res.status(404).json({ msg: 'Roadmap not found' });
    }

    const dayPlan = roadmap.sprintPlan.find(d => d.day === dayNum);
    if (!dayPlan || !dayPlan.tasks[taskIndex]) {
      return res.status(404).json({ msg: 'Sprint day or specific task index not found' });
    }

    // Toggle status
    const currentStatus = dayPlan.tasks[taskIndex].status;
    dayPlan.tasks[taskIndex].status = currentStatus === 'Completed' ? 'Pending' : 'Completed';

    await roadmap.save();
    res.json(roadmap);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error toggling roadmap task completion');
  }
};
