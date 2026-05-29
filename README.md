# HireReady AI: The AI Employability Intelligence Engine 🚀

> **“How ready is this student for placements, and what exactly should they improve next?”**

HireReady AI is a premium, state-of-the-art **Employability Intelligence & Placement Evaluation Engine** built to solve real-world campus recruitment readiness problems. It aggregates a student's digital footprint (Resume PDF, GitHub repositories, and LeetCode solved statistics) using cooperative AI agents to provide multi-dimensional scoring and a **7-Day Hyper-Personalized Action Roadmap**.

---

## Key Features 🌟

### 1. Resume Review Agent (ATS Auditor)
- Scans uploaded PDF resumes using local parsers.
- Audits ATS keywords, layout structure, and typography.
- Uses **Google's XYZ Formula** (`Accomplished [X] as measured by [Y], by doing [Z]`) to rewrite weak bullet points into high-impact accomplishment metrics.

### 2. Coding Profile Agent (DSA Strength)
- Scrapes and processes public LeetCode stats (with an elegant UI manual input fallback).
- Evaluates algorithmic thinking speed, DSA problem-solving stamina, and complexity optimization.
- Renders an interactive **DSA Topic Heatmap** displaying strengths/weaknesses (DP, Trees, Two Pointers, Hashing).

### 3. GitHub Project Agent (Portfolio Auditor)
- Scans public GitHub repositories for repository hygiene, README completeness, and commit activity.
- Identifies "tutorial-heavy" projects and proposes "production-level" adjustments.
- Evaluates folder organizational hygiene and code architecture (e.g. MVC patterns, index utilization).

### 4. Placement Readiness Scoring Engine
- Implements a transparent weighted scoring aggregate:
  $$\text{Score} = (35\% \times \text{Coding}) + (25\% \times \text{Resume}) + (25\% \times \text{GitHub}) + (15\% \times \text{Communication})$$
- **Company Fit Matchmaker**: Predicts candidate matching status for Tier 1 Product (Google/Amazon), Tier 2 Tech/Product (Startups), and Tier 3 Service companies (TCS/Infosys).

### 5. AI Intervention & Action Engine (Roadmap Prescriber)
- Automatically compiles weaknesses into a **7-Day Custom Timeline**.
- Populates daily, checkbox-interactive preparation exercises (e.g., target DSA topics, speech tasks, readme edits).
- **Interactive Checkbox Syncing**: Checking tasks off updates assessment scores and databases in real-time.

---

## 🛠️ Premium Tech Stack

### Frontend
- **React.js + Vite + TypeScript**
- **Tailwind CSS** (Custom *Quantum Obsidian* deep-dark glassmorphism palette)
- **Framer Motion** (for fluid animations, micro-interactions, and visual transitions)
- **Recharts** (for elegant data analytics & radar metrics maps)
- **Axios** (for API syncing)

### Backend
- **Node.js + Express.js** (Robust MVC architecture)
- **MongoDB + Mongoose** (With automated offline memory-db safety fallback)
- **Google Gemini API** (using the modern `@google/genai` SDK for exceptionally large context window codebase reviews)
- **pdf-parse** (for secure local PDF text extraction)

---

## 🏗️ Folder Structure

```text
├── backend/
│   ├── config/
│   ├── controllers/      # MVC controllers (Auth, Analysis, Roadmap)
│   ├── middleware/       # JWT Authentication protector
│   ├── models/           # Mongoose Database schemas (User, Assessment, Roadmap)
│   ├── routes/           # Rest API endpoints
│   ├── services/
│   │   ├── agents/       # Specific AI Agents (Resume, GitHub, Coding, Communication)
│   │   └── pdfService.js # Resume parsing service
│   ├── .env              # Environment configurations
│   └── server.js         # Entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx       # Single elegant visual client shell
│   │   ├── index.css     # Global glassmorphism & scrolling variables
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json          # Root Monorepo concurrent script manager
└── README.md
```

---

## 🚀 Setting Up the Application

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)
- **MongoDB** (Optional, falls back to a resilient in-memory DB if offline)

### Installation

1. Clone or download the repository into your workspace.
2. In the root directory, run:
   ```bash
   npm run install-all
   ```
   This will install all root, backend, and frontend packages simultaneously.

### Running Locally

To run both backend and frontend development servers concurrently:
```bash
npm run dev
```

- **Frontend client** launches on: [http://localhost:3000](http://localhost:3000)
- **Backend API** launches on: [http://localhost:5000](http://localhost:5000)

---

## 🤖 Configuring Gemini AI

To unlock live AI scanning rather than mock fallbacks:
1. Open `backend/.env`
2. Enter your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   USE_MOCK_AI=false
   ```
3. Restart the servers.

---

## 🛡️ Elite Engineering Resilience: "No Mongoose Crashing"
In case a developer tries to present a demo of this app without MongoDB installed locally, **HireReady AI** incorporates a proprietary **Memory-DB Monkey Patch**. 

If database connections fail or timeout:
1. The server will bypass crashing.
2. It initializes local array collections.
3. Overrides standard Mongoose models (`User`, `Assessment`, `Roadmap`) with state-saving array methods.
4. Operates seamlessly in memory, preserving all register/login, upload parsing, and roadmap checkboxes in real-time!
