const BaseAgent = require('./BaseAgent');

class ResumeAgent extends BaseAgent {
  constructor() {
    super('Resume Review Agent');
  }

  async analyze(resumeText) {
    if (this.shouldUseMock()) {
      return this.generateMockResumeAnalysis(resumeText);
    }

    try {
      const prompt = `
You are the Resume Review Agent of HireReady AI. Analyze the following student resume text and evaluate its ATS compatibility, formatting quality, and bullet point effectiveness.
Produce a highly detailed, actionable audit strictly in JSON format.

Your JSON response must match this schema EXACTLY:
{
  "atsScore": number (0-100),
  "formattingScore": number (0-100),
  "feedback": ["string"],
  "improvements": [
    {
      "original": "string - original bullet point found in resume",
      "suggested": "string - rewritten high-impact bullet using Google's XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]' with realistic metrics",
      "reason": "string - explanation of what was lacking and why the new version stands out"
    }
  ]
}

Resume Text:
${resumeText}

Strict JSON response:`;

      return await this.generateJSONContent(prompt);
    } catch (error) {
      console.error('Gemini Resume analysis failed, falling back to Mock:', error);
      return this.generateMockResumeAnalysis(resumeText);
    }
  }

  generateMockResumeAnalysis(text = '') {
    const ats = text.toLowerCase().includes('responsibilit') ? 58 : 74;
    const formatting = text.toLowerCase().includes('education') ? 80 : 65;

    const improvements = [];
    if (text.toLowerCase().includes('react') || text.trim() === '') {
      improvements.push({
        original: "Worked on React and Node stack for an e-commerce website.",
        suggested: "Engineered a scalable full-stack e-commerce platform using MERN Stack, implementing Redis caching to reduce catalog load times by 42% and processing 1,000+ test checkouts.",
        reason: "Added quantified performance metrics and high-impact action verbs instead of passive phrasing."
      });
    }
    if (text.toLowerCase().includes('dsa') || text.trim() === '') {
      improvements.push({
        original: "Solved many coding questions on LeetCode and other websites.",
        suggested: "Mastered data structures and algorithms, solving 350+ LeetCode problems with a consistent focus on optimizing dynamic programming and graph structures from O(N^2) to O(N log N).",
        reason: "Specified exact quantity and technical details on how problem optimization was approached."
      });
    }
    if (improvements.length === 0) {
      improvements.push({
        original: "Responsible for updating and maintaining the college website backend.",
        suggested: "Optimized university student-database backend query indexes in Node/Express, slashing student search latency by 65% for 4,000+ active users.",
        reason: "Google XYZ layout: quantified student search speed improvement and detailed the backend optimization mechanism."
      });
    }

    return {
      atsScore: ats,
      formattingScore: formatting,
      feedback: [
        "ATS scanning detected standard headers but lacks concrete achievement metrics.",
        "Consider using the Google XYZ format for bullet points to show quantified value.",
        "Add a dedicated Skills section grouped by category (Frontend, Backend, Databases, Core DSA) to help keyword crawlers."
      ],
      improvements
    };
  }
}

module.exports = new ResumeAgent();
