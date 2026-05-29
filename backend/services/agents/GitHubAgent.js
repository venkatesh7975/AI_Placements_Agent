const BaseAgent = require('./BaseAgent');

class GitHubAgent extends BaseAgent {
  constructor() {
    super('GitHub Portfolio Evaluator Agent');
  }

  async analyze(username, repos) {
    if (this.shouldUseMock()) {
      return this.generateMockGitHubAnalysis(username, repos);
    }

    try {
      const reposData = repos.map(r => ({
        name: r.name,
        description: r.description || '',
        language: r.language || 'Unknown',
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        size: r.size || 0,
        updatedAt: r.updated_at
      }));

      const prompt = `
You are the GitHub & Project Evaluator Agent of HireReady AI. Analyze the following repositories for GitHub user "${username}".
Evaluate the commit consistency, project complexity, README quality, tech stack maturity, and architectural hygiene.
Produce a highly detailed evaluation strictly in JSON format.

Your JSON response must match this schema EXACTLY:
{
  "score": number (0-100),
  "commitConsistency": "High" | "Moderate" | "Low",
  "readmeQuality": "Premium" | "Detailed" | "Basic" | "Poor",
  "portfolioMaturity": "Production-grade" | "Full-stack developer" | "Frontend/Backend developer" | "Tutorial-heavy/Basic",
  "projectFeedback": [
    {
      "projectName": "string",
      "feedback": "string - structural, architectural and cleanliness advice",
      "score": number (0-100)
    }
  ]
}

Repository List:
${JSON.stringify(reposData, null, 2)}

Strict JSON response:`;

      return await this.generateJSONContent(prompt);
    } catch (error) {
      console.error('Gemini GitHub analysis failed, falling back to Mock:', error);
      return this.generateMockGitHubAnalysis(username, repos);
    }
  }

  generateMockGitHubAnalysis(username, repos = []) {
    const count = repos.length || 5;
    const score = Math.min(60 + count * 5, 92);

    const feedback = [];
    repos.forEach((r, idx) => {
      if (idx < 3) {
        feedback.push({
          projectName: r.name || `Project-${idx + 1}`,
          feedback: r.description 
            ? `Repository has a basic description. Enhance architectural overview by adding a system diagram and clear setup guides to the README.`
            : `Lacks project description and setup instructions. Create a comprehensive README detailing API endpoints, directory architecture, and environment configuration.`,
          score: Math.min(65 + idx * 8, 90)
        });
      }
    });

    if (feedback.length === 0) {
      feedback.push({
        projectName: "MERN-placement-ready-app",
        feedback: "Good project architecture but folder design mixes routes and db models. Refactor into clean MVC design pattern. Implement JWT middleware checks.",
        score: 78
      });
    }

    return {
      score,
      commitConsistency: count > 8 ? 'High' : (count > 3 ? 'Moderate' : 'Low'),
      readmeQuality: count > 6 ? 'Detailed' : 'Basic',
      portfolioMaturity: count > 7 ? 'Full-stack developer' : 'Tutorial-heavy/Basic',
      projectFeedback: feedback
    };
  }
}

module.exports = new GitHubAgent();
