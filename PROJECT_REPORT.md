# HireReady AI: Employability Intelligence Engine
**Final Project Report**

## Abstract
HireReady AI is an agentic employability intelligence platform designed to bridge the gap between academic learning and industry expectations. Utilizing a modern MERN (MongoDB, Express, React, Node) stack, integrated with Google's Gemini GenAI models via an Agent Coordinator pattern, the system acts as an AI Placement Officer. It evaluates a candidate's resume, coding proficiency, GitHub portfolio, and communication skills to generate a "Placement Readiness Score" and a hyper-personalized 7-day action sprint.

## 1. System Architecture
The application is built on a modular, decoupled architecture:
- **Frontend Layer**: Built using React and Vite, styled with Tailwind CSS in a custom "Quantum Obsidian" aesthetic, and animated using Framer Motion. 
- **API Layer (Node.js & Express)**: Acts as the orchestration layer, handling JWT authentication, request validation, and routing.
- **AI Agent Coordination Layer**: Replaces monolithic AI logic. An `AgentCoordinator` class delegates tasks to 5 specialized agents (ResumeAgent, CodingAgent, GitHubAgent, CommunicationAgent, RoadmapAgent).
- **Data Persistence (MongoDB)**: Stores user profiles, assessment scores, and dynamic roadmaps. A "Memory-DB" fallback is included for isolated environments.

## 2. Core Modules (The AI Agents)
- **Resume Review Agent**: Parses PDF resumes to extract structure, action verbs, and impact metrics. It scores ATS compatibility and rewrites weak bullet points using the XYZ format (Accomplished [X] as measured by [Y], by doing [Z]).
- **GitHub Project Evaluator Agent**: Scans a student's GitHub portfolio to assess commit discipline, architectural complexity, and documentation maturity.
- **Coding Profile Analyzer**: Syncs with LeetCode/HackerRank solving metrics to determine strengths and weaknesses in DSA concepts.
- **Communication Agent (Mock Recruiter)**: Uses the Web Speech API to capture spoken answers to behavioral/technical questions, passing the transcript to Gemini for filler-word analysis, structure rating (STAR method), and elite phrasing suggestions.
- **Roadmap Generation Agent**: Synthesizes the outputs of the four diagnostic agents into an actionable, prioritized 7-Day Sprint.

## 3. Instructor / Admin Dashboard
To provide oversight for college placement officers, a dedicated Admin Portal aggregates all student data. It displays a real-time leaderboard ranking candidates by their Overall Score and Target Company Fit, enabling early intervention for students who are falling behind.

## 4. Technology Stack
- **Frontend**: React, Vite, TailwindCSS, Recharts, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js, Mongoose.
- **AI Engine**: `@google/genai` (Gemini SDK).
- **Tooling**: Axios, PDF-Parse, JSON Web Tokens, bcrypt.js.

## 5. Conclusion & Future Scope
HireReady AI successfully automates the initial phase of placement readiness evaluation. By providing immediate, personalized, and actionable feedback, it drastically reduces the burden on human placement officers. 
**Future Enhancements**: 
- Direct API integration with LeetCode/Codeforces.
- Company-specific simulated coding environments.
- Automated email alerts for placement officers.
