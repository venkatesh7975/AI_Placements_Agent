const BaseAgent = require('./BaseAgent');

class RoadmapAgent extends BaseAgent {
  constructor() {
    super('AI Intervention & Action Engine');
  }

  async generateRoadmap(scores, weaknesses, targetCompanies) {
    if (this.shouldUseMock()) {
      return this.generateMockRoadmap(scores, weaknesses, targetCompanies);
    }

    try {
      const prompt = `
You are the AI Intervention & Action Engine of HireReady AI.
A student is targeting these companies: ${JSON.stringify(targetCompanies)}
Their placement scores are: ${JSON.stringify(scores)}
Their identified weak areas are: ${JSON.stringify(weaknesses)}

Generate a highly specific, hyper-personalized 7-Day Sprint Roadmap that targets their specific weaknesses (e.g. if weak in DP, prescribe detailed DP tasks; if resume is low score, prescribe resume rewrite tasks).
Produce a highly comprehensive roadmap strictly in JSON format.

Your JSON response must match this schema EXACTLY:
{
  "summary": "string - overall feedback and strategy for target companies",
  "sprintPlan": [
    {
      "day": number (1 to 7),
      "focus": "string - daily key focus topic",
      "tasks": [
        {
          "title": "string",
          "description": "string - exact steps and exercises they need to do today",
          "resources": ["string - URL or reference materials to learn from"]
        }
      ]
    }
  ]
}

Strict JSON response:`;

      return await this.generateJSONContent(prompt);
    } catch (error) {
      console.error('Gemini Roadmap generation failed, falling back to Mock:', error);
      return this.generateMockRoadmap(scores, weaknesses, targetCompanies);
    }
  }

  generateMockRoadmap(scores = {}, weaknesses = [], targetCompanies = []) {
    const companies = targetCompanies.length > 0 ? targetCompanies.join(', ') : 'Product Companies';
    return {
      summary: `Your profiles indicate steady foundation skills, but clear gaps remain to clear the coding and resume screens at ${companies}. Over the next 7 days, we will focus heavily on bolstering your resume's action verbs, mastering weak DSA areas (specifically Dynamic Programming and Graph traversals), and polishing GitHub project readmes.`,
      sprintPlan: [
        {
          day: 1,
          focus: "Resume Revamp & High-Impact Bullets",
          tasks: [
            {
              title: "Rebuild Project Bullet Points",
              description: "Apply the Google XYZ formula to at least 3 project descriptions on your resume. Insert metrics: decrease in load speed (%), volume of users handled, or decrease in boilerplate code.",
              resources: ["https://www.kickresume.com/en/help-center/google-xyz-formula-resume/"]
            },
            {
              title: "Compile Skills Section",
              description: "Group your developer skills systematically under: Core Languages, Frontend Web, Backend Systems, Database Management, and Developer Tools.",
              resources: []
            }
          ]
        },
        {
          day: 2,
          focus: "Mastering Stack & Queue Foundations",
          tasks: [
            {
              title: "Solve 'Valid Parentheses' & 'Min Stack'",
              description: "Implement these classic LeetCode stack problems. Focus on achieving optimal O(N) time complexity and explaining the call stack operation.",
              resources: ["https://leetcode.com/problems/valid-parentheses/", "https://leetcode.com/problems/min-stack/"]
            }
          ]
        },
        {
          day: 3,
          focus: "Project Portfolio Architecture Auditing",
          tasks: [
            {
              title: "Build Production-Grade READMEs",
              description: "Go to your top 2 GitHub repositories. Redesign the README.md to include: system flowchart, modern visual badge elements, direct environment installation steps, and API endpoint tables.",
              resources: ["https://github.com/othneildrew/Best-README-Template"]
            }
          ]
        },
        {
          day: 4,
          focus: "Deep Dive into Tree Traversals",
          tasks: [
            {
              title: "Master BFS and DFS on Binary Trees",
              description: "Solve 'Binary Tree Level Order Traversal' (BFS) and 'Maximum Depth of Binary Tree' (DFS). Practice writing both recursive and iterative implementations.",
              resources: ["https://leetcode.com/problems/binary-tree-level-order-traversal/", "https://leetcode.com/problems/maximum-depth-of-binary-tree/"]
            }
          ]
        },
        {
          day: 5,
          focus: "Dynamic Programming Foundations",
          tasks: [
            {
              title: "Memoization (Top-Down) Strategy",
              description: "Solve 'Climbing Stairs' and 'House Robber' using a recursive memoization array. Draw the recursion tree to identify overlapping subproblems.",
              resources: ["https://leetcode.com/problems/climbing-stairs/", "https://leetcode.com/problems/house-robber/"]
            }
          ]
        },
        {
          day: 6,
          focus: "Mock Company Interview Simulation",
          tasks: [
            {
              title: "Behavioral Storytelling with STAR method",
              description: "Record yourself answering: 'Tell me about a time you solved a complex technical bug.' Focus on Situation, Task, Action, and Quantitative Result. Avoid filler words ('um', 'like').",
              resources: ["https://www.levels.fyi/blog/star-method-behavioral-interviews.html"]
            }
          ]
        },
        {
          day: 7,
          focus: "Complete Audit & Mock Assessment",
          tasks: [
            {
              title: "Simulated Aptitude & Coding Test",
              description: "Attempt a 60-minute time-bound mock test combining 3 array/string DSA questions and 5 quantitative reasoning questions.",
              resources: []
            }
          ]
        }
      ]
    };
  }
}

module.exports = new RoadmapAgent();
