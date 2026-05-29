const BaseAgent = require('./BaseAgent');

class CodingAgent extends BaseAgent {
  constructor() {
    super('Coding Profile Agent');
  }

  async analyze(leetcodeUsername, solvedCountInput) {
    if (this.shouldUseMock()) {
      return this.generateMockCodingAnalysis(leetcodeUsername, solvedCountInput);
    }

    try {
      const prompt = `
You are the Coding Profile Agent of HireReady AI. Analyze the student's DSA solving metrics.
Solved Count: ${JSON.stringify(solvedCountInput)}

Evaluate problem solving readiness, topic depth, and estimate algorithmic efficiency capabilities.
Produce a detailed evaluation strictly in JSON format.

Your JSON response must match this schema EXACTLY:
{
  "score": number (0-100),
  "topicHeatmap": {
    "Arrays & Hashing": "Strong" | "Moderate" | "Weak",
    "Two Pointers & Slid. Window": "Strong" | "Moderate" | "Weak",
    "Stack & Queues": "Strong" | "Moderate" | "Weak",
    "Trees & Graphs": "Strong" | "Moderate" | "Weak",
    "Dynamic Programming": "Strong" | "Moderate" | "Weak",
    "Recursion & Backtracking": "Strong" | "Moderate" | "Weak",
    "Greedy & Bit Manip": "Strong" | "Moderate" | "Weak"
  },
  "feedback": ["string - specific algorithmic growth suggestions"]
}

Strict JSON response:`;

      return await this.generateJSONContent(prompt);
    } catch (error) {
      console.error('Gemini Coding analysis failed, falling back to Mock:', error);
      return this.generateMockCodingAnalysis(leetcodeUsername, solvedCountInput);
    }
  }

  generateMockCodingAnalysis(leetcodeUsername, solved = {}) {
    const easy = Number(solved.easy) || 45;
    const medium = Number(solved.medium) || 20;
    const hard = Number(solved.hard) || 3;
    const total = easy + medium + hard;

    const score = Math.min(45 + Math.floor(total / 3), 96);

    const heatmap = {
      "Arrays & Hashing": total > 80 ? "Strong" : "Moderate",
      "Two Pointers & Slid. Window": total > 60 ? "Strong" : "Moderate",
      "Stack & Queues": total > 50 ? "Moderate" : "Weak",
      "Trees & Graphs": total > 100 ? "Strong" : (total > 30 ? "Moderate" : "Weak"),
      "Dynamic Programming": total > 120 ? "Strong" : "Weak",
      "Recursion & Backtracking": total > 40 ? "Moderate" : "Weak",
      "Greedy & Bit Manip": "Weak"
    };

    const feedback = [
      `Currently solved ${total} problems. Focus needs to shift heavily from Easy to Medium level problems to develop mock test stamina.`,
      "Tree traversal & DFS/BFS on Graphs are essential. Dedicate time to understanding recursion stacks.",
      "Dynamic Programming is a critical weakness; start with simple memoization techniques (1D DP) before attempting tabulated solutions."
    ];

    return {
      score,
      topicHeatmap: heatmap,
      feedback
    };
  }
}

module.exports = new CodingAgent();
