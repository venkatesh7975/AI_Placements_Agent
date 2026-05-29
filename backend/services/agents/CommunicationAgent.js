const BaseAgent = require('./BaseAgent');

class CommunicationAgent extends BaseAgent {
  constructor() {
    super('Communication Agent & Mock HR Interviewer');
  }

  async analyzeInterviewAnswer(question, answer, role) {
    if (this.shouldUseMock()) {
      return this.generateMockInterviewAnalysis(question, answer, role);
    }

    try {
      const prompt = `
You are the Communication Agent & Mock HR Interviewer of HireReady AI.
You simulated a recruiter with role "${role}" and asked this question:
"${question}"

The student replied with this spoken/typed answer:
"${answer}"

Evaluate their response. Count filler words (e.g. "like", "um", "uh", "you know", "basically", "actually").
Check for structural clarity (such as following the STAR method - Situation, Task, Action, Result).
Produce a highly detailed, professional communication audit strictly in JSON format.

Your JSON response must match this schema EXACTLY:
{
  "score": number (0-100),
  "structureRating": "string - STAR method compliance evaluation",
  "fillerWords": {
    "like": number,
    "um": number,
    "uh": number,
    "you know": number,
    "basically": number
  },
  "feedback": ["string - constructive verbal growth comments"],
  "suggestedBetterAnswer": "string - how the candidate should have restructured and phrased this answer to impress a tier-1 recruiter"
}

Strict JSON response:`;

      return await this.generateJSONContent(prompt);
    } catch (error) {
      console.error('Gemini Interview analysis failed, falling back to Mock:', error);
      return this.generateMockInterviewAnalysis(question, answer, role);
    }
  }

  generateMockInterviewAnalysis(question, answer = '', role) {
    const cleanAns = answer.toLowerCase();
    
    const fillerCounts = {
      "like": (cleanAns.match(/\blike\b/g) || []).length,
      "um": (cleanAns.match(/\bum\b/g) || []).length,
      "uh": (cleanAns.match(/\buh\b/g) || []).length,
      "you know": (cleanAns.match(/\byou know\b/g) || []).length,
      "basically": (cleanAns.match(/\bbasically\b/g) || []).length
    };

    const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    
    let score = 75;
    if (wordCount < 10) {
      score = 45; 
    } else {
      score = Math.max(40, 90 - (totalFillers * 4));
      if (wordCount > 60) score = Math.min(95, score + 5);
    }

    let structureRating = "STAR method partially followed. Excellent Situation detail, but lacks quantified metrics or direct Results.";
    if (wordCount < 20) {
      structureRating = "Answer is too brief to formulate structural STAR components. Expand on your Situation and Action.";
    } else if (cleanAns.includes('result') || cleanAns.includes('percent') || cleanAns.includes('%') || cleanAns.includes('reduced')) {
      structureRating = "STAR method successfully utilized. Excellent alignment of technical Actions with quantifiable business Results.";
    }

    const feedback = [];
    if (totalFillers > 2) {
      feedback.push(`Detected ${totalFillers} filler words ("like", "um", etc.). Practice pausing briefly rather than speaking fillers to fill vocal voids.`);
    } else {
      feedback.push("Excellent vocal control! Very low filler word density detected, indicating high speech confidence.");
    }

    if (wordCount < 30) {
      feedback.push("Your response lacks detail. In technical mock interviews, expand on the exact libraries, patterns, and indices used.");
    } else {
      feedback.push("Good length and technical description. Ensure your pitch flow remains steady without rushed syntax.");
    }

    feedback.push("Inject more storytelling. When discussing a team conflict or complex debug, focus more on your specific contribution.");

    let suggested = "During my web internship, our team was launching an e-commerce catalog dashboard. However, query speeds dragged catalog loads to 6.2 seconds (Situation). My task was to audit indexing structures and optimize server load (Task). I migrated data calls from standard aggregates to pre-calculated view structures and implemented Redis cache pools (Action). This reduced catalogue search latencies by 65% and successfully scaled the pilot rollout to 4,000 active students (Result).";

    if (question.toLowerCase().includes('introduce') || question.toLowerCase().includes('yourself')) {
      suggested = "Hello, I am a passionate full-stack developer specializing in building scalable web architectures using JavaScript, React, and Node.js. In my recent academic sprints, I engineered an e-commerce inventory API reducing latency by 42% and successfully cataloged 350+ data structure solutions in competitive coding. I target bringing high-stamina problem solving and structured backend performance to a full-time engineering role at a fast-growing tech firm.";
    }

    return {
      score,
      structureRating,
      fillerWords: fillerCounts,
      feedback,
      suggestedBetterAnswer: suggested
    };
  }
}

module.exports = new CommunicationAgent();
