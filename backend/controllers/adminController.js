const User = require('../models/User');
const Assessment = require('../models/Assessment');

// @route   GET api/admin/students
// @desc    Get all students and their latest assessments
exports.getAllStudents = async (req, res) => {
  try {
    // Assuming req.user is populated by authMiddleware
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    const users = await User.find({ isAdmin: false }).select('-password');
    const assessments = await Assessment.find();

    const studentData = users.map(user => {
      const assessment = assessments.find(a => a.userId.toString() === user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        targetCompanies: user.targetCompanies,
        scores: assessment ? assessment.scores : { overall: 0, coding: 0, resume: 0, github: 0, communication: 0 },
        companyFit: assessment ? assessment.companyFit : null,
      };
    });

    // Sort by overall score descending
    studentData.sort((a, b) => b.scores.overall - a.scores.overall);

    res.json(studentData);
  } catch (err) {
    console.error('Error fetching students:', err.message);
    res.status(500).send('Server Error');
  }
};
