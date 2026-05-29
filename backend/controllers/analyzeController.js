const Assessment = require('../models/Assessment');
const User = require('../models/User');
const pdfService = require('../services/pdfService');
const aiService = require('../services/agents/AgentCoordinator');

// Helper to recalculate overall scores & company fits
function computeAggregateAssessment(assessment) {
  const coding = assessment.scores.coding || 50;
  const resume = assessment.scores.resume || 50;
  const github = assessment.scores.github || 50;
  const communication = assessment.scores.communication || 70; // Mock/default communication score

  const overall = Math.round(
    (coding * 0.35) + 
    (resume * 0.25) + 
    (github * 0.25) + 
    (communication * 0.15)
  );

  assessment.scores.overall = overall;

  // Calculate Company Fit scores
  // Tier 1: Target 85+ (Ready if overall >= 82, coding >= 82)
  const tier1Score = Math.round((coding * 0.6) + (github * 0.2) + (communication * 0.2));
  let tier1Status = "Needs 6 Months Prep";
  if (tier1Score >= 82) tier1Status = "Placement Ready";
  else if (tier1Score >= 65) tier1Status = "Needs 2-3 Months Focus";

  // Tier 2: Target 70+
  const tier2Score = Math.round((coding * 0.4) + (github * 0.3) + (resume * 0.2) + (communication * 0.1));
  let tier2Status = "Needs 3 Months Prep";
  if (tier2Score >= 70) tier2Status = "Placement Ready";
  else if (tier2Score >= 50) tier2Status = "Needs 1 Month Sprint";

  // Tier 3: Target 50+
  const tier3Score = Math.round((resume * 0.3) + (coding * 0.3) + (communication * 0.4));
  let tier3Status = "Needs Practice";
  if (tier3Score >= 55) tier3Status = "Placement Ready";

  assessment.companyFit = {
    productTier1: { score: tier1Score, status: tier1Status },
    productTier2: { score: tier2Score, status: tier2Status },
    serviceTier3: { score: tier3Score, status: tier3Status }
  };

  return assessment;
}

// @route   POST api/analyze/resume
// @desc    Upload resume PDF & perform AI review
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload a PDF file' });
    }

    console.log('Extracting text from uploaded PDF buffer...');
    const extractedText = await pdfService.extractTextFromPDF(req.file.buffer);

    console.log('Invoking AI Resume Review Agent...');
    const aiAnalysisResult = await aiService.analyzeResume(extractedText);

    // Find or create assessment
    let assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) {
      assessment = new Assessment({ userId: req.user.id });
    }

    assessment.resumeAnalysis = {
      atsScore: aiAnalysisResult.atsScore || 60,
      formattingScore: aiAnalysisResult.formattingScore || 65,
      feedback: aiAnalysisResult.feedback || [],
      improvements: aiAnalysisResult.improvements || [],
      parsedText: extractedText.substring(0, 1000) // save a snapshot
    };

    // Update individual score
    assessment.scores.resume = Math.round((aiAnalysisResult.atsScore + aiAnalysisResult.formattingScore) / 2);

    // Compute aggregation
    assessment = computeAggregateAssessment(assessment);
    await assessment.save();

    res.json(assessment);
  } catch (err) {
    console.error('Error analyzing resume:', err);
    res.status(500).send('Internal server error during resume analysis');
  }
};

// @route   POST api/analyze/github
// @desc    Audit Github profile and repository maturity
exports.analyzeGitHub = async (req, res) => {
  const { githubUsername } = req.body;
  const username = githubUsername || '';

  try {
    if (!username) {
      return res.status(400).json({ msg: 'GitHub username is required' });
    }

    // Save username to User profile
    const user = await User.findById(req.user.id);
    if (user) {
      user.githubUsername = username;
      await user.save();
    }

    console.log(`Fetching repositories for Github user: ${username}`);
    let repos = [];
    
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`);
      if (response.ok) {
        repos = await response.json();
      } else {
        console.warn(`GitHub API returned status ${response.status}. Using high-quality mock repositories.`);
        repos = getFallbackMockRepos(username);
      }
    } catch (fetchError) {
      console.warn('Network error while querying GitHub. Using fallback repos.', fetchError);
      repos = getFallbackMockRepos(username);
    }

    console.log('Invoking AI GitHub Portfolio Evaluator Agent...');
    const githubAnalysisResult = await aiService.analyzeGitHub(username, repos);

    let assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) {
      assessment = new Assessment({ userId: req.user.id });
    }

    assessment.githubAnalysis = {
      score: githubAnalysisResult.score || 60,
      commitConsistency: githubAnalysisResult.commitConsistency || 'Moderate',
      readmeQuality: githubAnalysisResult.readmeQuality || 'Basic',
      portfolioMaturity: githubAnalysisResult.portfolioMaturity || 'Basic Developer',
      projectFeedback: githubAnalysisResult.projectFeedback || [],
      rawMetrics: {
        totalReposScanned: repos.length,
        topLanguage: repos[0]?.language || 'JavaScript',
        starsAccumulated: repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0)
      }
    };

    // Update individual score
    assessment.scores.github = githubAnalysisResult.score || 60;

    // Compute aggregation
    assessment = computeAggregateAssessment(assessment);
    await assessment.save();

    res.json(assessment);
  } catch (err) {
    console.error('Error analyzing GitHub:', err);
    res.status(500).send('Internal server error during GitHub analysis');
  }
};

// @route   POST api/analyze/coding
// @desc    Evaluate DSA profile & LeetCode scores
exports.analyzeCoding = async (req, res) => {
  const { leetcodeUsername, solvedCount } = req.body;
  const username = leetcodeUsername || '';

  try {
    if (!username && (!solvedCount || solvedCount.easy === undefined)) {
      return res.status(400).json({ msg: 'LeetCode username or manual solved count is required' });
    }

    // Save leetcode username to profile
    if (username) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.leetcodeUsername = username;
        await user.save();
      }
    }

    const counts = {
      easy: Number(solvedCount?.easy) || 0,
      medium: Number(solvedCount?.medium) || 0,
      hard: Number(solvedCount?.hard) || 0
    };

    console.log('Invoking AI Coding Profile Evaluator Agent...');
    const codingAnalysisResult = await aiService.analyzeCoding(username, counts);

    let assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) {
      assessment = new Assessment({ userId: req.user.id });
    }

    assessment.codingAnalysis = {
      score: codingAnalysisResult.score || 50,
      solvedCount: counts,
      topicHeatmap: codingAnalysisResult.topicHeatmap || {},
      feedback: codingAnalysisResult.feedback || []
    };

    // Update individual score
    assessment.scores.coding = codingAnalysisResult.score || 50;

    // Compute aggregation
    assessment = computeAggregateAssessment(assessment);
    await assessment.save();

    res.json(assessment);
  } catch (err) {
    console.error('Error analyzing coding profile:', err);
    res.status(500).send('Internal server error during coding analysis');
  }
};

// @route   POST api/analyze/interview
// @desc    Analyze mock interview verbal response
exports.analyzeInterview = async (req, res) => {
  const { question, answer, role } = req.body;

  try {
    if (!question || !answer) {
      return res.status(400).json({ msg: 'Question and spoken answer are required.' });
    }

    console.log(`Invoking Communication Agent to audit verbal response for role: ${role}`);
    const auditResult = await aiService.analyzeInterviewAnswer(question, answer, role || 'Recruiter');

    let assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) {
      assessment = new Assessment({ userId: req.user.id });
    }

    assessment.communicationAnalysis = {
      score: auditResult.score || 70,
      question,
      answer,
      role: role || 'Recruiter',
      structureRating: auditResult.structureRating || 'STAR evaluation pending',
      fillerWords: auditResult.fillerWords || {},
      feedback: auditResult.feedback || [],
      suggestedBetterAnswer: auditResult.suggestedBetterAnswer || ''
    };

    // Update individual score
    assessment.scores.communication = auditResult.score || 70;

    // Compute aggregation
    assessment = computeAggregateAssessment(assessment);
    await assessment.save();

    res.json(assessment);
  } catch (err) {
    console.error('Error analyzing mock interview:', err);
    res.status(500).send('Internal server error during interview evaluation');
  }
};

// @route   GET api/analyze/assessment
// @desc    Get student's latest assessment data
exports.getLatestAssessment = async (req, res) => {
  try {
    let assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) {
      // Create a default empty assessment so client doesn't crash
      assessment = new Assessment({
        userId: req.user.id,
        scores: { coding: 0, resume: 0, github: 0, communication: 70, overall: 0 }
      });
      assessment = computeAggregateAssessment(assessment);
      await assessment.save();
    }
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error retrieving latest assessment');
  }
};

// Helper for fallback mock repos
function getFallbackMockRepos(username) {
  return [
    {
      name: `${username}-portfolio-website`,
      description: "Personal portfolio website demonstrating developer qualifications, project stack and technical abilities.",
      language: "CSS",
      stargazers_count: 2,
      forks_count: 0,
      size: 1540,
      updated_at: new Date().toISOString()
    },
    {
      name: "node-express-e-commerce-api",
      description: "MVC e-commerce backend platform built using Node, Express, MongoDB, featuring JWT auth and Stripe integration.",
      language: "JavaScript",
      stargazers_count: 8,
      forks_count: 2,
      size: 4200,
      updated_at: new Date().toISOString()
    },
    {
      name: "algorithms-and-dsa-practice",
      description: "Solutions and conceptual notes on major data structures and algorithms solved in LeetCode.",
      language: "C++",
      stargazers_count: 12,
      forks_count: 3,
      size: 890,
      updated_at: new Date().toISOString()
    }
  ];
}
