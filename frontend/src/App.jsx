import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, Award, AwardIcon, CheckCircle2, AlertTriangle, FileText, 
  Github, Code2, Calendar, Target, Briefcase, Sparkles, LogOut, 
  User, Building2, UploadCloud, ChevronRight, Check, X, ShieldAlert,
  ArrowRight, Search, RefreshCw, Star, GitFork, BookOpen, Layers,
  Mic, MicOff, Volume2
} from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState('dashboard'); // dashboard, resume, coding, github, roadmap
  const [authMode, setAuthMode] = useState('login'); // login, register
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [targetCompanies, setTargetCompanies] = useState('');
  const [githubField, setGithubField] = useState('');
  const [leetcodeField, setLeetcodeField] = useState('');

  // Assessment & Roadmap State
  const [assessment, setAssessment] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Temporary Form inputs
  const [easyCount, setEasyCount] = useState(45);
  const [mediumCount, setMediumCount] = useState(18);
  const [hardCount, setHardCount] = useState(2);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);
  const [activeSprintDay, setActiveSprintDay] = useState(1);

  // Mock Interview States
  const [interviewRole, setInterviewRole] = useState('TCS HR Recruiter');
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [recording, setRecording] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);

  const recognitionRef = useRef(null);

  const startRecording = () => {
    setError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech API is not supported in this browser. Please type your response instead.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setRecording(true);
        setInterviewAnswer('');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setInterviewAnswer(prev => prev + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setError('Voice recognition encountered an error. Please try again.');
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setError('Failed to initialize microphone integration.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
  };

  const handleStartInterview = () => {
    setInterviewAnswer('');
    setInterviewResult(null);
    setError('');
    
    if (interviewRole === 'Amazon Technical Lead') {
      setInterviewQuestion("Design a highly scalable rate-limiter for an e-commerce API. What data structures, caching policies, and middleware patterns would you select, and how would you optimize O(N) overhead?");
    } else if (interviewRole === 'TCS HR Recruiter') {
      setInterviewQuestion("Tell me about a time you had to solve a complex database bug under a tight timeline. Walk me through your Situation, Task, Action, and the final quantified Result.");
    } else {
      setInterviewQuestion("Introduce yourself, and discuss the architectural maturity and code quality decisions you made on your MERN stack project portfolio.");
    }
  };

  const handleSubmitInterview = async () => {
    if (!interviewAnswer.trim()) {
      setError('Please provide an answer first by speaking or typing.');
      return;
    }
    setError('');
    setActionLoading(true);
    setSuccess('');

    try {
      const res = await axios.post(`${API_BASE}/analyze/interview`, {
        question: interviewQuestion,
        answer: interviewAnswer,
        role: interviewRole
      });
      setAssessment(res.data);
      setInterviewResult(res.data.communicationAnalysis);
      setSuccess('Spoken answer evaluated successfully by the Communication Agent!');
      fetchUserProfile();
      triggerRoadmapGenerationQuietly();
    } catch (err) {
      setError('Interview analysis failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Sync token axios configuration
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setAssessment(null);
      setRoadmap(null);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/auth/user`);
      setUser(res.data);
      // Fetch their assessment
      fetchAssessment();
      // Fetch their roadmap
      fetchRoadmap();
    } catch (err) {
      console.error('Error fetching profile', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessment = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analyze/assessment`);
      setAssessment(res.data);
      if (res.data.codingAnalysis?.solvedCount) {
        setEasyCount(res.data.codingAnalysis.solvedCount.easy || 0);
        setMediumCount(res.data.codingAnalysis.solvedCount.medium || 0);
        setHardCount(res.data.codingAnalysis.solvedCount.hard || 0);
      }
    } catch (err) {
      console.error('Error fetching assessment', err);
    }
  };

  const fetchRoadmap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/roadmap/current`);
      setRoadmap(res.data);
    } catch (err) {
      // It is okay if no roadmap exists initially
      setRoadmap(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      setSuccess('Logged in successfully!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const companyList = targetCompanies.split(',').map(c => c.trim()).filter(Boolean);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        name,
        email,
        password,
        college,
        targetCompanies: companyList,
        githubUsername: githubField,
        leetcodeUsername: leetcodeField
      });
      setToken(res.data.token);
      setUser(res.data.user);
      setSuccess('Account created successfully!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error registering account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setView('dashboard');
    setAuthMode('login');
    setEmail('');
    setPassword('');
    setName('');
    setCollege('');
    setTargetCompanies('');
    setGithubField('');
    setLeetcodeField('');
  };

  // Resume Upload Handler
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!selectedResumeFile) {
      setError('Please select a PDF file to upload.');
      return;
    }
    setError('');
    setActionLoading(true);
    setSuccess('');

    const formData = new FormData();
    formData.append('resume', selectedResumeFile);

    try {
      const res = await axios.post(`${API_BASE}/analyze/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAssessment(res.data);
      setSuccess('Resume analyzed successfully by the Resume Review Agent!');
      // Prompt roadmap update
      triggerRoadmapGenerationQuietly();
    } catch (err) {
      setError('Failed to analyze resume. Please ensure it is a valid PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  // GitHub Scanning Handler
  const handleGitHubScan = async () => {
    if (!user?.githubUsername && !githubField) {
      setError('Please provide a GitHub username first.');
      return;
    }
    setError('');
    setActionLoading(true);
    setSuccess('');

    const username = githubField || user.githubUsername;

    try {
      const res = await axios.post(`${API_BASE}/analyze/github`, { githubUsername: username });
      setAssessment(res.data);
      setSuccess('GitHub portfolio scanned and audited by Project Agent!');
      // Sync user profile
      fetchUserProfile();
      triggerRoadmapGenerationQuietly();
    } catch (err) {
      setError('GitHub sync failed. Please check the username or try again later.');
    } finally {
      setActionLoading(false);
    }
  };

  // Coding Sync Handler
  const handleCodingSync = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setActionLoading(true);
    setSuccess('');

    const username = leetcodeField || user?.leetcodeUsername;
    const countPayload = {
      easy: Number(easyCount),
      medium: Number(mediumCount),
      hard: Number(hardCount)
    };

    try {
      const res = await axios.post(`${API_BASE}/analyze/coding`, {
        leetcodeUsername: username,
        solvedCount: countPayload
      });
      setAssessment(res.data);
      setSuccess('DSA solving profile updated by Coding Agent!');
      fetchUserProfile();
      triggerRoadmapGenerationQuietly();
    } catch (err) {
      setError('Failed to update coding metrics.');
    } finally {
      setActionLoading(false);
    }
  };

  // Roadmap Sprint Generation
  const handleGenerateRoadmap = async () => {
    setError('');
    setActionLoading(true);
    setSuccess('');
    try {
      const res = await axios.post(`${API_BASE}/roadmap/generate`);
      setRoadmap(res.data);
      setSuccess('Hyper-Personalized 7-Day Sprint generated successfully!');
      setView('roadmap');
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not generate roadmap. Scan your profile first!');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerRoadmapGenerationQuietly = async () => {
    try {
      const res = await axios.post(`${API_BASE}/roadmap/generate`);
      setRoadmap(res.data);
    } catch (err) {
      console.warn('Roadmap auto-regen skipped', err);
    }
  };

  // Toggle Roadmap Task completion checkbox
  const handleToggleTask = async (day, taskIndex) => {
    try {
      const res = await axios.put(`${API_BASE}/roadmap/task/${day}/${taskIndex}`);
      setRoadmap(res.data);
    } catch (err) {
      setError('Failed to update task checkoff.');
    }
  };

  // Quick navigation setup
  const navigateTo = (newView) => {
    setView(newView);
    setError('');
    setSuccess('');
  };

  // Render Login / Registration UI
  if (!user) {
    return (
      <div className="min-h-screen grid-mesh bg-obsidian-950 flex flex-col justify-center items-center px-4 relative py-12">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-indigo opacity-10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple opacity-10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mb-8 text-center max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-indigo/10 border border-cyber-indigo/20 text-cyber-indigo text-xs font-semibold mb-3">
            <Sparkles size={12} /> AI-Powered Employability Evaluator
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-cyber-purple tracking-tight leading-none mb-2 font-display">
            HIREADY AI
          </h1>
          <p className="text-obsidian-500 font-medium">
            The Agentic Employability Intelligence Platform for Placements
          </p>
        </div>

        <div className="w-full max-w-lg glass-panel-heavy rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-indigo via-cyber-purple to-cyber-cyan"></div>
          
          <div className="flex border-b border-white/5 mb-6">
            <button 
              className={`flex-1 pb-3 text-sm font-semibold tracking-wider transition-all duration-300 ${authMode === 'login' ? 'text-cyber-indigo border-b-2 border-cyber-indigo' : 'text-obsidian-500'}`}
              onClick={() => { setAuthMode('login'); setError(''); }}
            >
              STUDENT SIGN IN
            </button>
            <button 
              className={`flex-1 pb-3 text-sm font-semibold tracking-wider transition-all duration-300 ${authMode === 'register' ? 'text-cyber-indigo border-b-2 border-cyber-indigo' : 'text-obsidian-500'}`}
              onClick={() => { setAuthMode('register'); setError(''); }}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="Enter your student email" 
                  className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter your security password" 
                  className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-indigo to-cyber-purple hover:brightness-110 active:scale-95 transition-all text-sm font-bold tracking-wider shadow-lg shadow-cyber-indigo/20 flex justify-center items-center gap-2"
              >
                {loading ? 'AUTHENTICATING...' : 'SIGN IN SECURELY'} <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your name" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Student Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@college.edu" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Security password" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">University / College</label>
                  <input 
                    type="text" 
                    placeholder="E.g. IIT, BITS" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Target Companies (Comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="E.g. Amazon, Google, Microsoft, TCS" 
                  className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">GitHub Username</label>
                  <input 
                    type="text" 
                    placeholder="E.g. venkatesh-prasad" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={githubField}
                    onChange={(e) => setGithubField(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">LeetCode Username</label>
                  <input 
                    type="text" 
                    placeholder="E.g. v_prasad" 
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm outline-none"
                    value={leetcodeField}
                    onChange={(e) => setLeetcodeField(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-indigo to-cyber-purple hover:brightness-110 active:scale-95 transition-all text-sm font-bold tracking-wider shadow-lg shadow-cyber-indigo/20 flex justify-center items-center gap-2"
              >
                {loading ? 'CREATING STUDENT ACCOUNT...' : 'REGISTER & INITIALIZE PLATFORM'} <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Loaded Profile and Assessment parameters
  const scoreData = assessment?.scores || { coding: 0, resume: 0, github: 0, communication: 70, overall: 0 };
  const targetCompanyList = user?.targetCompanies || [];

  // Radar chart source data
  const radarChartData = [
    { subject: 'DSA & Coding', score: scoreData.coding || 30 },
    { subject: 'Resume Quality', score: scoreData.resume || 30 },
    { subject: 'GitHub Projects', score: scoreData.github || 30 },
    { subject: 'Communication', score: scoreData.communication || 70 }
  ];

  return (
    <div className="min-h-screen bg-obsidian-950 text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-cyber-indigo">
      {/* Decorative neon backdrops */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-cyber-indigo opacity-5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyber-purple opacity-5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Premium Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 py-4 px-6 md:px-8 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-indigo to-cyber-purple flex justify-center items-center font-black text-xl tracking-tight text-white shadow-lg shadow-cyber-indigo/30">
            🚀
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              HIREADY AI
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-widest text-obsidian-500">
              Employability Intelligence Engine
            </span>
          </div>
        </div>

        {/* Global user badge */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 justify-end">
              <User size={12} className="text-cyber-indigo" /> {user.name}
            </span>
            <span className="text-[10px] text-obsidian-500 font-semibold">{user.college || 'Engineering College'}</span>
          </div>

          <button 
            onClick={handleLogout} 
            className="p-2 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-obsidian-500 hover:text-red-400 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Log Out"
          >
            <LogOut size={13} /> <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] relative">
        
        {/* Navigation Sidebar */}
        <nav className="p-6 border-r border-white/5 flex flex-col gap-1.5 bg-obsidian-950/80">
          <span className="text-[10px] font-bold text-obsidian-500 tracking-widest uppercase mb-3 pl-3">Evaluation Modules</span>
          
          <button 
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'dashboard' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Target size={16} className={view === 'dashboard' ? 'text-cyber-indigo' : ''} />
            <span>Overview Dashboard</span>
          </button>

          <button 
            onClick={() => navigateTo('resume')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'resume' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <FileText size={16} className={view === 'resume' ? 'text-cyber-indigo' : ''} />
            <span>Resume Optimizer</span>
            {scoreData.resume > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald font-bold">
                {scoreData.resume}
              </span>
            )}
          </button>

          <button 
            onClick={() => navigateTo('coding')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'coding' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Code2 size={16} className={view === 'coding' ? 'text-cyber-indigo' : ''} />
            <span>Coding Analyzer</span>
            {scoreData.coding > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyber-indigo/20 border border-cyber-indigo/35 text-white font-bold">
                {scoreData.coding}
              </span>
            )}
          </button>

          <button 
            onClick={() => navigateTo('github')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'github' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Github size={16} className={view === 'github' ? 'text-cyber-indigo' : ''} />
            <span>GitHub Portfolio Audit</span>
            {scoreData.github > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyber-purple/20 border border-cyber-purple/35 text-white font-bold">
                {scoreData.github}
              </span>
            )}
          </button>

          <button 
            onClick={() => { navigateTo('interview'); setInterviewQuestion(''); setInterviewResult(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'interview' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Mic size={16} className={view === 'interview' ? 'text-cyber-indigo' : ''} />
            <span>AI Recruiter Simulation</span>
            {scoreData.communication > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald font-bold">
                {scoreData.communication}
              </span>
            )}
          </button>

          <span className="text-[10px] font-bold text-obsidian-500 tracking-widest uppercase mt-6 mb-3 pl-3">Interventions</span>

          {user?.isAdmin && (
            <button 
              onClick={() => navigateTo('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'admin' ? 'bg-cyber-purple/15 text-white border border-cyber-purple/25 shadow-lg shadow-cyber-purple/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
              <ShieldAlert size={16} className={view === 'admin' ? 'text-cyber-purple' : ''} />
              <span>Admin Portal</span>
            </button>
          )}

          <button 
            onClick={() => navigateTo('roadmap')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold tracking-wide transition-all ${view === 'roadmap' ? 'bg-cyber-indigo/15 text-white border border-cyber-indigo/25 shadow-lg shadow-cyber-indigo/5' : 'text-obsidian-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Calendar size={16} className={view === 'roadmap' ? 'text-cyber-indigo' : ''} />
            <span>7-Day Action Sprint</span>
            {roadmap && (
              <span className="ml-auto w-2 h-2 rounded-full bg-cyber-pink shadow-glow shadow-cyber-pink/50"></span>
            )}
          </button>

          {/* Quick Stats sidebar widget */}
          <div className="mt-auto p-4 rounded-xl glass-panel relative overflow-hidden border border-white/5 bg-obsidian-900/50">
            <div className="absolute top-0 right-0 w-12 h-12 bg-cyber-indigo opacity-10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-1.5 mb-1">
              <Award size={13} className="text-cyber-purple" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Global Status</span>
            </div>
            <h4 className="text-xl font-black text-white leading-tight">
              {scoreData.overall}/100
            </h4>
            <p className="text-[10px] font-medium text-obsidian-500 mt-1">
              {scoreData.overall >= 80 ? '⭐ Tier 1 Strong Candidate' : (scoreData.overall >= 60 ? '⚡ Solid Mid Tier' : '⚠️ Building foundations')}
            </p>
          </div>
        </nav>

        {/* View Layout Container */}
        <main className="p-6 md:p-8 flex flex-col gap-6 bg-obsidian-950/40">
          
          {/* Diagnostic Global Logs */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-start gap-2.5 shadow-lg animate-fadeIn">
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-sm">Operation Failed</h5>
                <p className="text-xs opacity-90 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto hover:opacity-85 text-obsidian-500"><X size={15} /></button>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/25 text-cyber-emerald text-sm flex items-start gap-2.5 shadow-lg animate-fadeIn">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-sm">Agent Synced</h5>
                <p className="text-xs opacity-90 mt-0.5">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="ml-auto hover:opacity-85 text-obsidian-500"><X size={15} /></button>
            </div>
          )}

          {/* VIEW: OVERVIEW DASHBOARD */}
          {view === 'dashboard' && (
            <div className="space-y-6">
              {/* Profile Card Banner */}
              <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyber-purple opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold bg-cyber-indigo/10 border border-cyber-indigo/30 text-cyber-indigo px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Student Dashboard
                    </span>
                    <span className="text-[10px] font-medium text-obsidian-500">
                      Last update: Just now
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Welcome back, {user.name}!
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 max-w-xl font-medium">
                    Analyze your coding counts, repository configurations, and ATS compatibility to trigger a customized 7-day placement preparation sprint.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <Building2 size={12} className="text-cyber-purple" />
                      <span>{user.college || 'Engineering Student'}</span>
                    </div>
                    {targetCompanyList.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                        <Target size={12} className="text-cyber-pink" />
                        <span>Target: {targetCompanyList.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {scoreData.overall === 0 ? (
                    <button 
                      onClick={() => navigateTo('resume')}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyber-indigo to-cyber-purple text-xs font-bold tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-indigo/15 w-full sm:w-auto"
                    >
                      <Sparkles size={14} /> KICKSTART FIRST ASSESSMENT
                    </button>
                  ) : (
                    <button 
                      onClick={handleGenerateRoadmap}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyber-indigo to-cyber-purple text-xs font-bold tracking-wider hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-indigo/15 w-full sm:w-auto"
                    >
                      <Calendar size={14} /> {actionLoading ? 'GENERATING ROADMAP...' : 'REGENERATE 7-DAY SPRINT'}
                    </button>
                  )}
                </div>
              </div>

              {/* Major Analysis widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Resume Widget */}
                <div className="p-5 rounded-2xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between h-44 hover:border-white/10 transition-all group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-indigo opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
                  <div className="flex justify-between items-start">
                    <span className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <FileText size={18} />
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{scoreData.resume || '0'}%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Resume Optimization</h4>
                    <p className="text-[10px] text-obsidian-500 font-semibold mt-0.5">
                      {scoreData.resume > 0 ? 'Resume evaluation completed' : 'Lacks ATS scoring audit'}
                    </p>
                  </div>
                  <button onClick={() => navigateTo('resume')} className="text-xs text-cyber-indigo font-bold flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform self-start">
                    {scoreData.resume > 0 ? 'Review bullet fixes' : 'Upload Resume PDF'} <ChevronRight size={13} />
                  </button>
                </div>

                {/* 2. Coding Widget */}
                <div className="p-5 rounded-2xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between h-44 hover:border-white/10 transition-all group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-purple opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
                  <div className="flex justify-between items-start">
                    <span className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <Code2 size={18} />
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{scoreData.coding || '0'}%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">DSA & Platform Strength</h4>
                    <p className="text-[10px] text-obsidian-500 font-semibold mt-0.5">
                      {scoreData.coding > 0 ? `${easyCount + mediumCount + hardCount} solved problems tracked` : 'Sync LeetCode solved status'}
                    </p>
                  </div>
                  <button onClick={() => navigateTo('coding')} className="text-xs text-cyber-indigo font-bold flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform self-start">
                    {scoreData.coding > 0 ? 'Examine topic strength' : 'Sync Coding handles'} <ChevronRight size={13} />
                  </button>
                </div>

                {/* 3. GitHub Projects Widget */}
                <div className="p-5 rounded-2xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between h-44 hover:border-white/10 transition-all group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-cyan opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
                  <div className="flex justify-between items-start">
                    <span className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <Github size={18} />
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{scoreData.github || '0'}%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">GitHub Repository Architecture</h4>
                    <p className="text-[10px] text-obsidian-500 font-semibold mt-0.5">
                      {scoreData.github > 0 ? `${assessment.githubAnalysis?.rawMetrics?.totalReposScanned || 3} repositories scanned` : 'Check codebase cleanliness'}
                    </p>
                  </div>
                  <button onClick={() => navigateTo('github')} className="text-xs text-cyber-indigo font-bold flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform self-start">
                    {scoreData.github > 0 ? 'View architecture reviews' : 'Audit GitHub profile'} <ChevronRight size={13} />
                  </button>
                </div>

                {/* 4. Communication mock score Widget */}
                <div className="p-5 rounded-2xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between h-44 hover:border-white/10 transition-all group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-emerald opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
                  <div className="flex justify-between items-start">
                    <span className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <Building2 size={18} />
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{scoreData.communication || '70'}%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Mock Speaking & Fluency</h4>
                    <p className="text-[10px] text-obsidian-500 font-semibold mt-0.5">
                      Fluency check: Structured answers
                    </p>
                  </div>
                  <div className="text-[10px] text-cyber-emerald font-bold flex items-center gap-1 mt-3">
                    <Check size={11} /> Fluency: High Confidence
                  </div>
                </div>

              </div>

              {/* Aggregate Analysis Charts & Company fitness Section */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                
                {/* 1. Employability Metrics Radar Map */}
                <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-xl relative flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-wide">Employability Metrics Map</h3>
                    <p className="text-xs text-obsidian-500 font-medium">Multi-dimensional rating comparison across placement requirements</p>
                  </div>

                  <div className="h-64 md:h-72 mt-4 flex items-center justify-center w-full">
                    {scoreData.overall === 0 ? (
                      <div className="text-center p-8 max-w-sm">
                        <ShieldAlert size={35} className="mx-auto text-obsidian-500 mb-2" />
                        <p className="text-xs text-obsidian-500 font-medium">No assessment data generated yet. Once you complete your evaluations, a detailed radar map will display here.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                          <PolarGrid stroke="#1f212d" />
                          <PolarAngleAxis dataKey="subject" stroke="#a3a3c2" fontSize={11} fontWeight={600} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#2b2e3c" tickFormatter={(v) => `${v}%`} />
                          <Radar name="Student" dataKey="score" stroke="#5e43f3" fill="#5e43f3" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. Company Fit Matchmaker */}
                <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-xl flex flex-col gap-5 justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-wide">Company Fit Matchmaker</h3>
                    <p className="text-xs text-obsidian-500 font-medium">AI rating of suitability based on aggregate scores</p>
                  </div>

                  <div className="space-y-4 flex-1 mt-2">
                    
                    {/* Tier 1 Product */}
                    <div className="space-y-1.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Building2 size={13} className="text-cyber-purple" /> Tier 1 Product (E.g. Google, Amazon)
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${scoreData.overall >= 80 ? 'bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald' : 'bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple'}`}>
                          {assessment?.companyFit?.productTier1?.status || 'Needs Prep'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded bg-obsidian-900 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyber-indigo to-cyber-purple transition-all duration-1000" 
                            style={{ width: `${assessment?.companyFit?.productTier1?.score || 35}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-slate-200">{assessment?.companyFit?.productTier1?.score || 35}%</span>
                      </div>
                    </div>

                    {/* Tier 2 Product */}
                    <div className="space-y-1.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Building2 size={13} className="text-cyber-cyan" /> Tier 2 Product (E.g. Mid-sized startups)
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${scoreData.overall >= 65 ? 'bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald' : 'bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple'}`}>
                          {assessment?.companyFit?.productTier2?.status || 'Needs Prep'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded bg-obsidian-900 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-indigo transition-all duration-1000" 
                            style={{ width: `${assessment?.companyFit?.productTier2?.score || 45}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-slate-200">{assessment?.companyFit?.productTier2?.score || 45}%</span>
                      </div>
                    </div>

                    {/* Tier 3 Service */}
                    <div className="space-y-1.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Building2 size={13} className="text-cyber-emerald" /> Tier 3 Service (E.g. TCS, Infosys)
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald">
                          {assessment?.companyFit?.serviceTier3?.status || 'Ready'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded bg-obsidian-900 overflow-hidden">
                          <div 
                            className="h-full bg-cyber-emerald transition-all duration-1000" 
                            style={{ width: `${assessment?.companyFit?.serviceTier3?.score || 60}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-slate-200">{assessment?.companyFit?.serviceTier3?.score || 60}%</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Action plan summary if active roadmap exists */}
              {roadmap ? (
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyber-indigo/10 to-cyber-purple/5 border border-cyber-indigo/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-indigo opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Calendar size={13} className="text-cyber-pink" />
                      <span className="text-[10px] font-bold text-cyber-pink uppercase tracking-widest">Active Action Sprint</span>
                    </div>
                    <h4 className="text-base font-black text-white">Your Personalized 7-Day Sprint is Active!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium line-clamp-2">
                      {roadmap.summary}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigateTo('roadmap')} 
                    className="px-5 py-2.5 rounded-lg bg-cyber-indigo text-xs font-bold tracking-wider hover:brightness-110 active:scale-95 transition-all text-white flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-lg shadow-cyber-indigo/10"
                  >
                    GO TO MY ROADMAP <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                scoreData.overall > 0 && (
                  <div className="p-5 rounded-2xl glass-panel border border-dashed border-white/10 text-center flex flex-col items-center py-8">
                    <Sparkles size={30} className="text-cyber-purple animate-pulse mb-3" />
                    <h4 className="text-base font-bold text-white">Unlock Your AI Intervention Roadmap</h4>
                    <p className="text-xs text-obsidian-500 mt-1 max-w-md font-semibold">
                      Your scores are loaded. Let's prescribe your 7-day action sprint to revamp your weak areas and target placements!
                    </p>
                    <button 
                      onClick={handleGenerateRoadmap}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyber-indigo to-cyber-purple text-xs font-bold tracking-wider mt-4 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyber-indigo/15"
                    >
                      {actionLoading ? 'COMPILING SPRINT PLAN...' : 'GENERATE SPRINT PLAN'}
                    </button>
                  </div>
                )
              )}

            </div>
          )}

          {/* VIEW: RESUME OPTIMIZER */}
          {view === 'resume' && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <FileText size={22} className="text-cyber-indigo" /> Resume Optimizer
                  </h1>
                  <p className="text-xs text-obsidian-500 font-medium">Audits ATS compatibility and provides Google-inspired bullet rewrites</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                
                {/* PDF Uploader Panel */}
                <div className="space-y-5">
                  <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Upload Student Resume</h3>
                    
                    <form onSubmit={handleResumeUpload} className="space-y-4">
                      <div className="border border-dashed border-white/10 rounded-xl p-5 text-center bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden group">
                        <input 
                          type="file" 
                          accept="application/pdf"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => setSelectedResumeFile(e.target.files[0])}
                        />
                        <UploadCloud size={30} className="text-obsidian-500 group-hover:text-cyber-indigo transition-colors mb-2.5" />
                        <span className="text-xs font-bold text-slate-200">
                          {selectedResumeFile ? selectedResumeFile.name : 'Select Resume PDF File'}
                        </span>
                        <span className="text-[9px] text-obsidian-500 font-semibold mt-1">PDF file up to 10MB</span>
                      </div>

                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="w-full py-2.5 rounded-xl bg-cyber-indigo hover:brightness-110 active:scale-95 transition-all text-xs font-bold tracking-wider flex justify-center items-center gap-2 text-white shadow-lg shadow-cyber-indigo/10"
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> RUNNING RESUME AUDIT...
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} /> SCAN & GENERATE CRITIQUE
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {scoreData.resume > 0 && (
                    <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">ATS Scored Metrics</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                          <span className="text-[10px] font-bold text-obsidian-500 uppercase tracking-wider block">ATS Compatibility</span>
                          <span className="text-2xl font-black text-cyber-indigo tracking-tight block mt-1">
                            {assessment.resumeAnalysis?.atsScore || 60}%
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                          <span className="text-[10px] font-bold text-obsidian-500 uppercase tracking-wider block">Formatting Quality</span>
                          <span className="text-2xl font-black text-cyber-purple tracking-tight block mt-1">
                            {assessment.resumeAnalysis?.formattingScore || 60}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Audit Feedback Panel */}
                <div className="space-y-6">
                  {scoreData.resume === 0 ? (
                    <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center py-12">
                      <FileText size={35} className="text-obsidian-500 mb-3" />
                      <h4 className="text-base font-bold text-white">No Resume Scanned Yet</h4>
                      <p className="text-xs text-obsidian-500 mt-1 max-w-sm font-semibold">
                        Upload your PDF resume to have the Resume Review Agent audit your structural formatting, compute an ATS score, and optimize your project bullets.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Critiques List */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-3.5">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-cyber-pink" /> Review Agent Critiques
                        </h3>
                        <ul className="space-y-2.5">
                          {assessment.resumeAnalysis?.feedback?.map((fb, idx) => (
                            <li key={idx} className="text-xs text-slate-300 font-semibold flex items-start gap-2.5 p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyber-pink shrink-0 mt-1.5"></span>
                              <span>{fb}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Google XYZ Upgrades */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-cyber-emerald" /> Google XYZ Bullet Upgrades
                        </h3>
                        
                        <div className="space-y-4">
                          {assessment.resumeAnalysis?.improvements?.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                              
                              <div>
                                <span className="text-[9px] font-bold bg-white/5 border border-white/5 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Original Phrasing
                                </span>
                                <p className="text-xs text-slate-400 mt-1 font-medium italic">"{item.original}"</p>
                              </div>

                              <div className="border-t border-white/5 pt-3">
                                <span className="text-[9px] font-bold bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 self-start inline-flex">
                                  <Check size={10} /> Optimized Placement Formulation
                                </span>
                                <p className="text-xs font-bold text-white mt-1.5">"{item.suggested}"</p>
                              </div>

                              {item.reason && (
                                <p className="text-[10px] text-obsidian-500 font-semibold mt-1">
                                  <span className="text-cyber-indigo">Rationale:</span> {item.reason}
                                </p>
                              )}

                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: CODING ANALYZER */}
          {view === 'coding' && (
            <div className="space-y-6">
              
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Code2 size={22} className="text-cyber-indigo" /> Coding Platform Analyzer
                </h1>
                <p className="text-xs text-obsidian-500 font-medium">Audits your algorithmic proficiency and topic depth across DSA categories</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                
                {/* DSA solved counters Form */}
                <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-5">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Sync Coding Stats</h3>
                  
                  <form onSubmit={handleCodingSync} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">LeetCode Username</label>
                      <input 
                        type="text" 
                        placeholder="E.g. v_prasad" 
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs outline-none"
                        value={leetcodeField}
                        onChange={(e) => setLeetcodeField(e.target.value)}
                      />
                    </div>

                    <div className="border-t border-white/5 pt-3.5 space-y-3.5">
                      <span className="text-[10px] font-bold text-obsidian-500 uppercase tracking-widest block">Manual Solved Counts</span>
                      
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-cyber-emerald uppercase mb-1">Easy</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded-lg glass-input text-white text-xs outline-none text-center"
                            value={easyCount}
                            onChange={(e) => setEasyCount(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-cyber-cyan uppercase mb-1">Medium</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded-lg glass-input text-white text-xs outline-none text-center"
                            value={mediumCount}
                            onChange={(e) => setMediumCount(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-cyber-pink uppercase mb-1">Hard</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded-lg glass-input text-white text-xs outline-none text-center"
                            value={hardCount}
                            onChange={(e) => setHardCount(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-cyber-indigo hover:brightness-110 active:scale-95 transition-all text-xs font-bold tracking-wider flex justify-center items-center gap-2 text-white shadow-lg shadow-cyber-indigo/10"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> EVALUATING PROFILE...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} /> SYNC & COMPILE SCORES
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Heatmap & topic listings Panel */}
                <div className="space-y-6">
                  {scoreData.coding === 0 ? (
                    <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center py-12">
                      <Code2 size={35} className="text-obsidian-500 mb-3" />
                      <h4 className="text-base font-bold text-white">Profile Evaluation Pending</h4>
                      <p className="text-xs text-obsidian-500 mt-1 max-w-sm font-semibold">
                        Provide your LeetCode username or manually input your solved statistics above to trigger the Coding Agent evaluation and topic depth heatmap.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Topic Heatmap Matrix */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">DSA Topic Strength Heatmap</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {assessment.codingAnalysis?.topicHeatmap && Object.entries(assessment.codingAnalysis.topicHeatmap).map(([topic, status], idx) => {
                            let badgeStyle = "bg-cyber-purple/10 border-cyber-purple/20 text-cyber-purple";
                            if (status === 'Strong') badgeStyle = "bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald";
                            else if (status === 'Weak') badgeStyle = "bg-cyber-pink/10 border-cyber-pink/20 text-cyber-pink";

                            return (
                              <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                                <span className="text-xs font-bold text-slate-200">{topic}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                                  {status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Coding Agent critique list */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-3.5">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-cyber-indigo" /> Algorithmic Improvement Proposals
                        </h3>
                        <ul className="space-y-2.5">
                          {assessment.codingAnalysis?.feedback?.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 font-semibold flex items-start gap-2.5 p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyber-indigo shrink-0 mt-1.5"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: GITHUB PROJECTS PORTFOLIO */}
          {view === 'github' && (
            <div className="space-y-6">
              
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Github size={22} className="text-cyber-indigo" /> GitHub Portfolio Auditing
                </h1>
                <p className="text-xs text-obsidian-500 font-medium">Scans repository structure, README configurations, and assesses commit consistency</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                
                {/* Username Sync Block */}
                <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-5">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Sync GitHub Profile</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">GitHub Username</label>
                      <input 
                        type="text" 
                        placeholder="E.g. venkatesh-prasad" 
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs outline-none"
                        value={githubField}
                        onChange={(e) => setGithubField(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleGitHubScan}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-cyber-indigo hover:brightness-110 active:scale-95 transition-all text-xs font-bold tracking-wider flex justify-center items-center gap-2 text-white shadow-lg shadow-cyber-indigo/10"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> SCANNING REPOSITORIES...
                        </>
                      ) : (
                        <>
                          <Search size={12} /> SCAN & AUDIT REPOSITORIES
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Audit Output list */}
                <div className="space-y-6">
                  {scoreData.github === 0 ? (
                    <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center py-12">
                      <Github size={35} className="text-obsidian-500 mb-3" />
                      <h4 className="text-base font-bold text-white">GitHub Audit Pending</h4>
                      <p className="text-xs text-obsidian-500 mt-1 max-w-sm font-semibold">
                        Input your GitHub profile handle above to trigger the Project Evaluator Agent to crawl your public repositories and rate your readme quality.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Metric scores */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Portfolio Maturity Ratings</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                            <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Readme Quality</span>
                            <span className="text-base font-black text-cyber-indigo block mt-1">
                              {assessment.githubAnalysis?.readmeQuality || 'Basic'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                            <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Commit Activity</span>
                            <span className="text-base font-black text-cyber-purple block mt-1">
                              {assessment.githubAnalysis?.commitConsistency || 'Moderate'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                            <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Project Maturity</span>
                            <span className="text-base font-black text-cyber-emerald block mt-1">
                              {assessment.githubAnalysis?.portfolioMaturity || 'Basic Developer'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Repos list */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={14} className="text-cyber-indigo" /> Scanned Repositories Feedback
                        </h3>

                        <div className="space-y-4">
                          {assessment.githubAnalysis?.projectFeedback?.map((repo, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2 hover:bg-white/[0.02] transition-all">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <Layers size={13} className="text-cyber-purple" /> {repo.projectName}
                                </span>
                                <span className="text-[10px] font-black text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                                  Score: {repo.score || 70}/100
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                                {repo.feedback}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: ROADMAP PERSONAL SPRINT */}
          {view === 'roadmap' && (
            <div className="space-y-6">
              
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Calendar size={22} className="text-cyber-indigo" /> 7-Day Hyper-Personalized Action Sprint
                </h1>
                <p className="text-xs text-obsidian-500 font-medium">Your customized day-by-day preparation timeline designed by our AI Intervention Agent</p>
              </div>

              {!roadmap ? (
                <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center py-12">
                  <Calendar size={35} className="text-obsidian-500 mb-3" />
                  <h4 className="text-base font-bold text-white">No Roadmap Generated</h4>
                  <p className="text-xs text-obsidian-500 mt-1 max-w-sm font-semibold">
                    Complete your profile analysis (resume/github/leetcode solved status) and trigger the 7-day personalized sprint generator on your Dashboard.
                  </p>
                  <button 
                    onClick={() => navigateTo('dashboard')} 
                    className="px-5 py-2 rounded-lg bg-cyber-indigo text-xs font-bold tracking-wider mt-4 hover:brightness-110 transition-all text-white"
                  >
                    GO TO DASHBOARD
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
                  
                  {/* Days tab timeline */}
                  <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                    {roadmap.sprintPlan?.map((plan) => (
                      <button 
                        key={plan.day}
                        onClick={() => setActiveSprintDay(plan.day)}
                        className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs tracking-wider transition-all flex items-center gap-2 shrink-0 lg:shrink-1 ${activeSprintDay === plan.day ? 'bg-cyber-indigo/15 border-cyber-indigo/25 text-white shadow-lg' : 'bg-white/[0.01] border-white/5 text-obsidian-500 hover:text-white hover:bg-white/[0.02]'}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${activeSprintDay === plan.day ? 'bg-cyber-indigo' : 'bg-transparent border border-obsidian-500'}`}></span>
                        <span>DAY {plan.day}</span>
                      </button>
                    ))}
                  </div>

                  {/* Daily Tasks and focus content */}
                  <div className="space-y-6">
                    
                    {/* Strategy summary box */}
                    <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-[10px] font-bold text-cyber-purple uppercase tracking-wider">Sprint Focus Description</span>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
                        {roadmap.summary}
                      </p>
                    </div>

                    {/* Active Day detailed tasks */}
                    {roadmap.sprintPlan?.filter(p => p.day === activeSprintDay).map((dayPlan) => (
                      <div key={dayPlan.day} className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                          <span className="text-xs font-black text-white bg-cyber-indigo/20 border border-cyber-indigo/30 px-2 py-0.5 rounded">
                            DAY {dayPlan.day} KEY THEME
                          </span>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            {dayPlan.focus}
                          </h3>
                        </div>

                        <div className="space-y-3.5">
                          {dayPlan.tasks?.map((task, idx) => (
                            <div 
                              key={idx} 
                              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${task.status === 'Completed' ? 'border-cyber-emerald/15 bg-cyber-emerald/[0.01] opacity-75' : 'border-white/5 bg-white/[0.01]'}`}
                            >
                              
                              {/* Interative Checkbox button */}
                              <button 
                                onClick={() => handleToggleTask(dayPlan.day, idx)}
                                className={`w-5.5 h-5.5 rounded border flex justify-center items-center shrink-0 transition-all ${task.status === 'Completed' ? 'bg-cyber-emerald border-cyber-emerald text-white shadow-md' : 'border-white/20 hover:border-cyber-indigo cursor-pointer'}`}
                              >
                                {task.status === 'Completed' && <Check size={12} strokeWidth={3} />}
                              </button>

                              <div className="flex-1 space-y-1.5">
                                <h4 className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                  {task.title}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                  {task.description}
                                </p>

                                {task.resources?.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
                                    <span className="text-[9px] font-bold text-obsidian-500 uppercase tracking-widest block">Reference Resources:</span>
                                    {task.resources.map((url, rIdx) => (
                                      <a 
                                        key={rIdx} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-cyber-indigo hover:text-cyber-purple transition-all p-1.5 rounded bg-cyber-indigo/10 border border-cyber-indigo/15"
                                      >
                                        <BookOpen size={10} /> STUDY LINK <ChevronRight size={8} />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </div>
          )}

          {/* VIEW: AI INTERVIEW SIMULATOR */}
          {view === 'interview' && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Mic size={22} className="text-cyber-indigo" /> AI Recruiter Simulation
                  </h1>
                  <p className="text-xs text-obsidian-500 font-medium">Test your communication skills and STAR alignment in real-time recruiter mock interviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                
                {/* Select Recruiter Panel */}
                <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-5">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Configure Simulation</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-obsidian-500 uppercase tracking-wider mb-1">Recruiter Simulation Role</label>
                      <select 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none cursor-pointer focus:border-cyber-indigo"
                        value={interviewRole}
                        onChange={(e) => setInterviewRole(e.target.value)}
                      >
                        <option value="TCS HR Recruiter">TCS HR Recruiter (Behavioral)</option>
                        <option value="Amazon Technical Lead">Amazon Technical Lead (System / DSA)</option>
                        <option value="Startup Founder">Startup Founder (Fast-paced Technical)</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleStartInterview}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyber-indigo to-cyber-purple hover:brightness-110 active:scale-95 transition-all text-xs font-bold tracking-wider flex justify-center items-center gap-2 text-white shadow-lg"
                    >
                      <Sparkles size={12} /> INITIALIZE RECRUITER
                    </button>
                  </div>

                  {scoreData.communication > 0 && (
                    <div className="border-t border-white/5 pt-4 text-center">
                      <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Last Communication Score</span>
                      <span className="text-3xl font-black text-cyber-emerald mt-1 block">
                        {scoreData.communication}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Session Panel */}
                <div className="space-y-6">
                  {!interviewQuestion ? (
                    <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center py-12">
                      <Briefcase size={35} className="text-obsidian-500 mb-3" />
                      <h4 className="text-base font-bold text-white">Simulation Offline</h4>
                      <p className="text-xs text-obsidian-500 mt-1 max-w-sm font-semibold">
                        Configure your simulated recruiter role on the left and click "Initialize Recruiter" to receive your real-time placement question.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Recruiter Question Bubble */}
                      <div className="p-5 rounded-2xl bg-cyber-indigo/10 border border-cyber-indigo/25 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyber-indigo opacity-10 rounded-full blur-xl pointer-events-none"></div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <User size={13} className="text-cyber-indigo" />
                          <span className="text-[10px] font-bold text-cyber-indigo uppercase tracking-widest">{interviewRole}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-relaxed">
                          "{interviewQuestion}"
                        </h4>
                      </div>

                      {/* Microphone Recording / Text Area */}
                      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Your Spoken/Typed Answer</h3>
                          {recording && (
                            <span className="text-[10px] text-cyber-pink font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                              <Volume2 size={12} className="animate-bounce" /> LISTENING...
                            </span>
                          )}
                        </div>

                        <textarea 
                          className="w-full h-36 px-4 py-3 rounded-xl glass-input text-white text-xs outline-none resize-none leading-relaxed"
                          placeholder="Speak by tapping the microphone below, or type your response directly here..."
                          value={interviewAnswer}
                          onChange={(e) => setInterviewAnswer(e.target.value)}
                        ></textarea>

                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                          <div className="flex gap-2">
                            {!recording ? (
                              <button 
                                onClick={startRecording}
                                className="px-4 py-2.5 rounded-lg bg-cyber-pink hover:brightness-110 active:scale-95 text-xs font-bold tracking-wider text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyber-pink/15"
                              >
                                <Mic size={13} /> TAP TO RECORD VOICE
                              </button>
                            ) : (
                              <button 
                                onClick={stopRecording}
                                className="px-4 py-2.5 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 text-xs font-bold tracking-wider text-white transition-all flex items-center gap-1.5"
                              >
                                <MicOff size={13} /> STOP RECORDING
                              </button>
                            )}
                          </div>

                          <button 
                            onClick={handleSubmitInterview}
                            disabled={actionLoading}
                            className="px-6 py-2.5 rounded-lg bg-cyber-indigo hover:brightness-110 active:scale-95 text-xs font-bold tracking-wider text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyber-indigo/15 w-full sm:w-auto justify-center"
                          >
                            {actionLoading ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" /> ASSESSING RESPONSE...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} /> SUBMIT FOR AI EVALUATION
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Interview Analysis Results */}
                      {interviewResult && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Aggregate metrics */}
                          <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-4">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                              <Award size={14} className="text-cyber-purple" /> Recruiter Verdict
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Speech Score</span>
                                <span className="text-2xl font-black text-cyber-indigo mt-1 block">
                                  {interviewResult.score}/100
                                </span>
                              </div>
                              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                <span className="text-[10px] font-bold text-obsidian-500 uppercase block">Structure Compliance</span>
                                <span className="text-xs font-bold text-white mt-1.5 block leading-relaxed">
                                  {interviewResult.structureRating}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Filler Words */}
                          <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-3.5">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-cyber-pink" /> Filler Words Audit
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                              {interviewResult.fillerWords && Object.entries(interviewResult.fillerWords).map(([word, cnt], idx) => (
                                <div key={idx} className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.01] flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-300">"{word}"</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${cnt > 0 ? 'bg-cyber-pink/15 border border-cyber-pink/25 text-cyber-pink animate-pulse' : 'bg-white/5 text-obsidian-500'}`}>
                                    {cnt}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Verbal Critiques */}
                          <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-3.5">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Communication Agent Critiques</h3>
                            <ul className="space-y-2.5">
                              {interviewResult.feedback?.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-300 font-semibold flex items-start gap-2.5 p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-indigo shrink-0 mt-1.5"></span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Suggested answer */}
                          <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-lg space-y-3.5">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={14} className="text-cyber-emerald" /> Recommended Elite Phrasing (STAR XYZ)
                            </h3>
                            <div className="p-4 rounded-xl border border-cyber-emerald/10 bg-cyber-emerald/[0.01] text-xs font-medium text-slate-200 leading-relaxed italic">
                              "{interviewResult.suggestedBetterAnswer}"
                            </div>
                          </div>

                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

          {view === 'admin' && user?.isAdmin && (
            <AdminDashboard />
          )}

        </main>

      </div>

      {/* Modern footer */}
      <footer className="mt-auto py-6 px-8 border-t border-white/5 text-center text-[10px] font-bold text-obsidian-500 uppercase tracking-widest glass-panel">
        © {new Date().getFullYear()} HireReady AI • Developed with absolute pride for placements
      </footer>
    </div>
  );
}
