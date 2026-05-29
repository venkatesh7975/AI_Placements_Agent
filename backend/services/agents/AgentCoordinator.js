const resumeAgent = require('./ResumeAgent');
const gitHubAgent = require('./GitHubAgent');
const codingAgent = require('./CodingAgent');
const communicationAgent = require('./CommunicationAgent');
const roadmapAgent = require('./RoadmapAgent');

class AgentCoordinator {
  async analyzeResume(resumeText) {
    return await resumeAgent.analyze(resumeText);
  }

  async analyzeGitHub(username, repos) {
    return await gitHubAgent.analyze(username, repos);
  }

  async analyzeCoding(leetcodeUsername, solvedCountInput) {
    return await codingAgent.analyze(leetcodeUsername, solvedCountInput);
  }

  async analyzeInterviewAnswer(question, answer, role) {
    return await communicationAgent.analyzeInterviewAnswer(question, answer, role);
  }

  async generateRoadmap(scores, weaknesses, targetCompanies) {
    return await roadmapAgent.generateRoadmap(scores, weaknesses, targetCompanies);
  }
}

module.exports = new AgentCoordinator();
