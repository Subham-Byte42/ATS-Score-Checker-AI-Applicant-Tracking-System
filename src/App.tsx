import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ResumeUploadForm } from './components/ResumeUploadForm';
import { ResumeTable } from './components/ResumeTable';
import { AiInsightsCards } from './components/AiInsightsCards';
import { AuthModal } from './components/AuthModal';
import { AnalysisModal } from './components/AnalysisModal';
import { UserDashboardPage } from './components/UserDashboardPage';
import { initialResumes, statItems, recommendations } from './data/mockData';
import { ResumeRecord } from './types';
import { 
  Sparkles, 
  Upload, 
  TrendingUp, 
  ShieldCheck, 
  SearchCheck,
  CheckCircle2,
  FileText,
  UserPlus,
  LogIn,
  Brain,
  Target,
  KeyRound,
  Briefcase,
  BarChart3,
  FileCheck2,
  Download
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem('ats_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [resumes, setResumes] = useState<ResumeRecord[]>(() => {
    try {
      const storedUser = localStorage.getItem('ats_user_session');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.email) {
          const savedLocal = localStorage.getItem(`ats_user_resumes_${u.email}`);
          return savedLocal ? JSON.parse(savedLocal) : [];
        }
        return [];
      }
    } catch {
      // fallback
    }
    return initialResumes;
  });

  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>(() => {
    try {
      const stored = localStorage.getItem('ats_user_session');
      return stored ? 'dashboard' : 'home';
    } catch {
      return 'home';
    }
  });
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login',
  });
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);

  // Sync and load user resumes from localStorage & backend API
  const syncUserResumes = async (userEmail: string) => {
    let localRecords: ResumeRecord[] = [];
    try {
      const savedLocal = localStorage.getItem(`ats_user_resumes_${userEmail}`);
      if (savedLocal) {
        localRecords = JSON.parse(savedLocal);
      }
    } catch (err) {
      console.error('Error reading local resumes:', err);
    }

    try {
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Strictly filter for records belonging to this user
          const userRecords = json.data.filter((r: any) => r.userId === userEmail);
          const apiRecords: ResumeRecord[] = userRecords.map((r: any) => ({
            id: r._id || r.id,
            fileName: r.fileName || 'Resume.pdf',
            candidateName: r.candidateName || 'Candidate',
            targetRole: r.targetRole || 'Software Engineer',
            fileSize: r.fileSize || 200000,
            atsScore: r.atsScore || 0,
            status: r.status || 'Completed',
            matchScore: r.matchScore || r.atsScore || 0,
            uploadDate: r.uploadDate ? new Date(r.uploadDate).toLocaleDateString() : 'Recent',
            summary: r.summary || 'Resume analyzed successfully.',
            skills: {
              found: r.analysis?.skillsFound || r.skills?.found || [],
              missing: r.analysis?.missingSkills || r.skills?.missing || [],
            },
            strengths: r.analysis?.strengths || r.strengths || [],
            weaknesses: r.analysis?.weaknesses || r.weaknesses || [],
            missingKeywords: r.analysis?.missingSkills || r.missingKeywords || [],
            formattingIssues: r.formattingIssues || [],
            improvementSuggestions: r.analysis?.suggestions || r.suggestions || [],
            suggestions: r.analysis?.suggestions || r.suggestions || [],
            recommendedRoles: r.recommendedRoles || [],
            detailedSectionScores: r.detailedSectionScores || {
              contactInfo: 90,
              formatting: 85,
              keywordMatch: 80,
              actionVerbs: 85,
              experienceImpact: 88,
            },
          }));

          // Merge local and user API records
          const recordMap = new Map<string, ResumeRecord>();
          apiRecords.forEach((r) => recordMap.set(r.id, r));
          localRecords.forEach((r) => recordMap.set(r.id, r));

          const merged = Array.from(recordMap.values());
          setResumes(merged);
          localStorage.setItem(`ats_user_resumes_${userEmail}`, JSON.stringify(merged));
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Backend API fetch unavailable, using local cache:', apiErr);
    }

    setResumes(localRecords);
  };

  useEffect(() => {
    if (user?.email) {
      syncUserResumes(user.email);
    }
  }, [user?.email]);

  const handleNavigate = (sectionId: string) => {
    setCurrentPage('home');
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleOpenUpload = () => {
    if (user) {
      setCurrentPage('dashboard');
    } else {
      handleOpenAuth('login');
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleLoginSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
    localStorage.setItem('ats_user_session', JSON.stringify(userData));
    setCurrentPage('dashboard');
    syncUserResumes(userData.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ats_user_session');
    localStorage.removeItem('authToken');
    setCurrentPage('home');
  };

  const handleAnalyzeNewResume = (record: ResumeRecord) => {
    setResumes((prev) => {
      const updated = [record, ...prev];
      if (user?.email) {
        localStorage.setItem(`ats_user_resumes_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedResume(record);
  };

  const handleDeleteResume = (id: string) => {
    setResumes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      if (user?.email) {
        localStorage.setItem(`ats_user_resumes_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const liveStats = useMemo(() => {
    const count = resumes.length;
    if (count === 0) {
      return [
        {
          title: 'Resumes Analyzed',
          value: '0',
          change: '0',
          isPositive: true,
          description: 'no resumes uploaded yet',
          iconName: 'FileText'
        },
        {
          title: 'Avg. ATS Compatibility',
          value: '0%',
          change: '0%',
          isPositive: true,
          description: 'average candidate score',
          iconName: 'CheckCircle2'
        },
        {
          title: 'Job Match Rate',
          value: '0%',
          change: '0%',
          isPositive: true,
          description: 'average requirements match',
          iconName: 'Target'
        },
        {
          title: 'Critical Fixes Flagged',
          value: '0',
          change: '0',
          isPositive: true,
          description: 'formatting & missing skills',
          iconName: 'AlertTriangle'
        }
      ];
    }

    const avgAts = Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / count);
    const avgMatch = Math.round(resumes.reduce((sum, r) => sum + (r.matchScore || r.atsScore || 0), 0) / count);
    
    const totalFixes = resumes.reduce((sum, r) => {
      const missingCount = Array.isArray(r.missingSkills) ? r.missingSkills.length : 0;
      const formattingCount = Array.isArray(r.formattingIssues) ? r.formattingIssues.length : 0;
      return sum + missingCount + formattingCount;
    }, 0);

    return [
      {
        title: 'Resumes Analyzed',
        value: count.toLocaleString(),
        change: `+${count}`,
        isPositive: true,
        description: 'total candidate scans',
        iconName: 'FileText'
      },
      {
        title: 'Avg. ATS Compatibility',
        value: `${avgAts}%`,
        change: avgAts >= 80 ? 'Strong' : 'Improveable',
        isPositive: avgAts >= 70,
        description: 'average candidate score',
        iconName: 'CheckCircle2'
      },
      {
        title: 'Job Match Rate',
        value: `${avgMatch}%`,
        change: avgMatch >= 80 ? 'Aligned' : 'Gaps found',
        isPositive: avgMatch >= 70,
        description: 'average job requirements match',
        iconName: 'Target'
      },
      {
        title: 'Critical Fixes Flagged',
        value: totalFixes.toString(),
        change: totalFixes > 0 ? `${totalFixes} flagged` : 'Clean',
        isPositive: totalFixes === 0,
        description: 'formatting & missing keywords',
        iconName: 'AlertTriangle'
      }
    ];
  }, [resumes]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col selection:bg-blue-100 selection:text-[#1877f2]">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentPage={currentPage}
        onOpenAuth={handleOpenAuth}
        onOpenUpload={handleOpenUpload}
        onNavigate={handleNavigate}
        onSelectPage={(page) => setCurrentPage(page)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-10 min-w-0">
          
          {currentPage === 'dashboard' && user ? (
            /* Logged-in Candidate Dashboard Page */
            <UserDashboardPage
              user={user}
              resumes={resumes}
              onAnalyzeNewResume={handleAnalyzeNewResume}
              onSelectResume={setSelectedResume}
              onDeleteResume={handleDeleteResume}
              onLogout={handleLogout}
            />
          ) : (
            /* Public Landing Page */
            <>
              {/* Welcome Banner / Hero (#home) */}
              <section id="home" className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 text-center shadow-2xs space-y-6">
                <div className="max-w-3xl mx-auto space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                    Build a Resume That Gets Interview Calls.
                  </h1>

                  <p className="text-base sm:text-lg text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed">
                    Land Your Dream Job with AI-Powered Resume Analysis.
                  </p>

                  <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
                    <button
                      onClick={() => handleOpenAuth('signup')}
                      className="px-8 py-3.5 bg-[#1877f2] hover:bg-[#0866ff] text-white font-extrabold text-base rounded-md shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      <UserPlus className="w-5 h-5 text-white" />
                      <span>Get Started for Free</span>
                    </button>

                    <button
                      onClick={() => handleOpenAuth('login')}
                      className="px-8 py-3.5 bg-white text-[#0F172A] border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-extrabold text-base rounded-md active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      <LogIn className="w-5 h-5 text-[#64748B]" />
                      <span>Log In</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Features Section (#features) */}
              <section id="features" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-8 shadow-2xs">
                {/* Features Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="px-3.5 py-1 bg-blue-50 text-[#1877f2] font-bold text-xs rounded-full border border-blue-100 inline-block">
                    Comprehensive AI Suite
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    Everything You Need to Build a Winning Resume
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                    Our AI-powered tools help you optimize your resume, improve ATS compatibility, and increase your chances of landing interviews.
                  </p>
                </div>

                {/* 8 Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <Brain className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Smart Resume Analysis</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      AI-powered insights to improve your resume.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">ATS Score Checker</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Measure your resume's ATS compatibility.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Resume Score</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Receive an overall quality score.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">AI Suggestions</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Personalized recommendations for improvement.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Keyword Optimization</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Improve recruiter visibility with better keywords.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Job Match Analysis</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Compare your resume against job descriptions.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Analytics Dashboard</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Track improvements and resume performance.
                    </p>
                  </div>

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1877f2] flex items-center justify-center font-bold group-hover:bg-[#1877f2] group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">Cover Letter Generator</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      Create tailored cover letters instantly.
                    </p>
                  </div>
                </div>

                {/* Performance Metrics directly below features */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#1877f2]" />
                      ATS Performance Metrics
                    </h3>
                    <span className="text-xs text-[#64748B] font-medium">Real-time Benchmark</span>
                  </div>
                  <DashboardStats stats={liveStats} />
                </div>
              </section>

              {/* How It Works Section (#how-it-works) */}
              <section id="how-it-works" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-8 shadow-2xs">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="px-3.5 py-1 bg-blue-50 text-[#1877f2] font-bold text-xs rounded-full border border-blue-100 inline-block">
                    Simple 4-Step Process
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    How ATS Score Checker Works
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                    Transform your job applications in minutes with AI-driven precision and instant formatting feedback.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                  {/* Step 1 */}
                  <div className="p-5 sm:p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-4 relative hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-blue-500/20">
                      1
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[#1877f2]" />
                        Upload Resume
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                        Upload your PDF or DOCX resume securely.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-5 sm:p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-4 relative hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-blue-500/20">
                      2
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#1877f2]" />
                        AI Analyzes
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                        Our AI scans your resume for ATS compatibility, skills, and content quality.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-5 sm:p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-4 relative hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-blue-500/20">
                      3
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#1877f2]" />
                        Get Your Score
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                        Receive an ATS score along with strengths and areas for improvement.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-5 sm:p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-4 relative hover:border-[#1877f2] hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-blue-500/20">
                      4
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                        <Download className="w-5 h-5 text-[#1877f2]" />
                        Improve & Download
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                        Follow personalized suggestions and download your analysis report.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

        </main>
      </div>

      {/* Deep Background Footer with Copyright */}
      <footer className="mt-12 bg-[#0A0F1D] text-slate-300 border-t border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Logo and Tagline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
                <FileCheck2 className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  ATS <span className="text-[#1877f2]">Score Checker</span>
                </span>
                <p className="text-xs text-slate-400 font-medium">
                  AI-Powered Resume Analysis & Career Intelligence
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-400">
              <button onClick={() => handleNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                Home
              </button>
              <button onClick={() => handleNavigate('features')} className="hover:text-white transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => handleNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                How it Works
              </button>
              {user ? (
                <button onClick={() => setCurrentPage('dashboard')} className="hover:text-white transition-colors cursor-pointer">
                  Dashboard
                </button>
              ) : (
                <button onClick={() => handleOpenAuth('signup')} className="hover:text-white transition-colors cursor-pointer">
                  Get Started
                </button>
              )}
            </div>
          </div>

          {/* Bottom Copyright & System Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>System Status: <strong className="text-slate-200 font-semibold">Engine Operational</strong></span>
            </div>

            <p className="text-slate-400 text-center sm:text-right">
              © 2026 ATS Score Checker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={handleCloseAuth}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Detailed Resume Analysis Modal */}
      <AnalysisModal
        resume={selectedResume}
        onClose={() => setSelectedResume(null)}
      />

    </div>
  );
}
