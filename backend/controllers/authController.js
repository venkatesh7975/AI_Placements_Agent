const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST api/auth/register
// @desc    Register a user
exports.register = async (req, res) => {
  const { name, email, password, college, targetCompanies, githubUsername, leetcodeUsername } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      college: college || '',
      targetCompanies: targetCompanies || [],
      githubUsername: githubUsername || '',
      leetcodeUsername: leetcodeUsername || ''
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during registration');
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            college: user.college,
            targetCompanies: user.targetCompanies,
            githubUsername: user.githubUsername,
            leetcodeUsername: user.leetcodeUsername
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during login');
  }
};

// @route   GET api/auth/user
// @desc    Get user profile
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error loading user info');
  }
};

// @route   PUT api/auth/user
// @desc    Update user profile parameters
exports.updateUser = async (req, res) => {
  const { college, targetCompanies, githubUsername, leetcodeUsername } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.college = college !== undefined ? college : user.college;
    user.targetCompanies = targetCompanies !== undefined ? targetCompanies : user.targetCompanies;
    user.githubUsername = githubUsername !== undefined ? githubUsername : user.githubUsername;
    user.leetcodeUsername = leetcodeUsername !== undefined ? leetcodeUsername : user.leetcodeUsername;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error updating profile handles');
  }
};
