import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signOut } from './lib/firebase';
import { 
  DATABASE_FOLDERS, 
  saveToDatabaseFolder, 
  fetchFromDatabaseFolder, 
  deleteFromDatabaseFolder 
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { AtsLogo } from './components/AtsLogo';
import { DashboardStats } from './components/DashboardStats';
import { AuthModal } from './components/AuthModal';
import { AnalysisModal } from './components/AnalysisModal';
import { UserDashboardPage } from './components/UserDashboardPage';
import { LandingPage, UserRole } from './components/LandingPage';
import { HeroAtsIllustration } from './components/HeroAtsIllustration';
import { ResumeUploadForm } from './components/ResumeUploadForm';
import { BrandedLoadingScreen } from './components/BrandedLoadingScreen';
import { initialResumes } from './data/mockData';
import { ResumeRecord } from './types';
import { 
  Sparkles, 
  Upload, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  LogIn, 
  Brain, 
  Target, 
  KeyRound, 
  Briefcase, 
  BarChart3, 
  FileCheck2, 
  Download, 
  Star, 
  Check, 
  ArrowRight,
  Zap,
  Users,
  CheckCircle2,
  Layers,
  Undo2
} from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('ats_user_role');
      return (stored === 'recruiter' || stored === 'personal') ? stored : 'personal';
    } catch {
      return 'personal';
    }
  });

  const [user, setUser] = useState<{ name: string; email: string; role?: UserRole; companyName?: string } | null>(() => {
    try {
      const currentRole = (localStorage.getItem('ats_user_role') === 'recruiter') ? 'recruiter' : 'personal';
      const roleSpecific = localStorage.getItem(`ats_user_session_${currentRole}`);
      if (roleSpecific) {
        return JSON.parse(roleSpecific);
      }
      const generic = localStorage.getItem('ats_user_session');
      if (generic) {
        const u = JSON.parse(generic);
        if (u.role === currentRole || (!u.role && currentRole === 'personal')) {
          return { ...u, role: currentRole };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const personalUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('ats_user_session_personal');
      if (stored) return JSON.parse(stored);
      if (user?.role === 'personal') return user;
    } catch {
      return null;
    }
    return null;
  }, [user, userRole]);

  const recruiterUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('ats_user_session_recruiter');
      if (stored) return JSON.parse(stored);
      if (user?.role === 'recruiter') return user;
    } catch {
      return null;
    }
    return null;
  }, [user, userRole]);

  const [resumes, setResumes] = useState<ResumeRecord[]>(() => {
    try {
      const currentRole = (localStorage.getItem('ats_user_role') === 'recruiter') ? 'recruiter' : 'personal';
      const roleSpecific = localStorage.getItem(`ats_user_session_${currentRole}`);
      const activeU = roleSpecific ? JSON.parse(roleSpecific) : null;
      if (activeU?.email) {
        const savedLocal = localStorage.getItem(`ats_user_resumes_${currentRole}_${activeU.email}`);
        return savedLocal ? JSON.parse(savedLocal) : [];
      }
    } catch {
      // fallback
    }
    return initialResumes;
  });

  const [currentPage, setCurrentPage] = useState<'landing' | 'home' | 'dashboard'>('landing');

  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login',
  });
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [isInitialBooting, setIsInitialBooting] = useState(true);
  const [transitionLoadingMsg, setTransitionLoadingMsg] = useState<string | null>(null);

  // Determine active Firestore folder based on portal role
  const activeDbFolder = userRole === 'recruiter' 
    ? DATABASE_FOLDERS.RECRUITERS_PORTAL 
    : DATABASE_FOLDERS.PERSONAL_PORTAL;

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('ats_user_role', role);

    // Retrieve session specific to this target role:
    let sessionForRole: { name: string; email: string; role?: UserRole; companyName?: string } | null = null;
    try {
      const stored = localStorage.getItem(`ats_user_session_${role}`);
      if (stored) {
        sessionForRole = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading role session:', e);
    }

    setUser(sessionForRole);
    if (sessionForRole?.email) {
      syncUserResumes(sessionForRole.email, role);
    } else {
      setResumes([]);
    }

    setTransitionLoadingMsg(`Opening ${role === 'recruiter' ? 'Recruiter & HR Portal' : 'Personal Tracking Workspace'}...`);
    setTimeout(() => {
      setCurrentPage(sessionForRole ? 'dashboard' : 'home');
      setTransitionLoadingMsg(null);
    }, 450);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialBooting(false);
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  // Sync and load user records from designated Firestore Database Folder & localStorage
  const syncUserResumes = async (userEmail: string, currentRole: UserRole = userRole) => {
    const targetFolder = currentRole === 'recruiter' 
      ? DATABASE_FOLDERS.RECRUITERS_PORTAL 
      : DATABASE_FOLDERS.PERSONAL_PORTAL;

    let localRecords: ResumeRecord[] = [];
    try {
      const savedLocal = localStorage.getItem(`ats_user_resumes_${currentRole}_${userEmail}`);
      if (savedLocal) {
        localRecords = JSON.parse(savedLocal);
      }
    } catch (err) {
      console.error('Error reading local cache:', err);
    }

    try {
      // 1. Fetch from Firestore Database Folder (personal_portal or recruiters_portal)
      const firestoreRecords = await fetchFromDatabaseFolder(targetFolder, userEmail);

      // 2. Fetch from backend API as secondary source
      let apiRecords: ResumeRecord[] = [];
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const userRecords = json.data.filter((r: any) => r.userId === userEmail);
          apiRecords = userRecords.map((r: any) => ({
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
        }
      }

      // Merge Firestore database folder, API, and local records
      const recordMap = new Map<string, ResumeRecord>();
      apiRecords.forEach((r) => recordMap.set(r.id, r));
      localRecords.forEach((r) => recordMap.set(r.id, r));
      firestoreRecords.forEach((r) => recordMap.set(r.id, r));

      const merged = Array.from(recordMap.values());
      setResumes(merged);
      localStorage.setItem(`ats_user_resumes_${currentRole}_${userEmail}`, JSON.stringify(merged));
      return;
    } catch (apiErr) {
      console.warn('Database fetch fallback to local cache:', apiErr);
    }

    setResumes(localRecords);
  };

  useEffect(() => {
    if (user?.email) {
      syncUserResumes(user.email, userRole);
    }
  }, [user?.email, userRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        try {
          const roleStored = localStorage.getItem(`ats_user_session_${userRole}`);
          if (roleStored) {
            const parsed = JSON.parse(roleStored);
            if (parsed.email === firebaseUser.email) {
              setUser(parsed);
              syncUserResumes(firebaseUser.email, userRole);
              return;
            }
          }
        } catch (e) {
          console.warn('Firebase role check failed:', e);
        }

        const u = {
          name: firebaseUser.displayName || (firebaseUser.email.includes('alex') ? 'Alex Morgan' : firebaseUser.email.split('@')[0]),
          email: firebaseUser.email,
          role: userRole,
        };
        setUser(u);
        localStorage.setItem(`ats_user_session_${userRole}`, JSON.stringify(u));
        localStorage.setItem('ats_user_session', JSON.stringify(u));
        syncUserResumes(firebaseUser.email, userRole);
      }
    });
    return () => unsubscribe();
  }, [userRole]);

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
      if (userRole === 'recruiter') {
        handleOpenAuth('signup');
        return;
      }
      if (currentPage !== 'home') {
        setCurrentPage('home');
      }
      setTimeout(() => {
        const el = document.getElementById('upload') || document.getElementById('scanner');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleLoginSuccess = (userData: { name: string; email: string; role?: UserRole; companyName?: string }) => {
    const effectiveRole: UserRole = userData.role === 'recruiter' ? 'recruiter' : 'personal';
    const fullUser = { ...userData, role: effectiveRole };

    setTransitionLoadingMsg(`Preparing ${effectiveRole === 'recruiter' ? 'Recruiter & HR Workspace' : 'Personal ATS Dashboard'}...`);
    setUser(fullUser);
    setUserRole(effectiveRole);
    localStorage.setItem('ats_user_role', effectiveRole);
    localStorage.setItem(`ats_user_session_${effectiveRole}`, JSON.stringify(fullUser));
    localStorage.setItem('ats_user_session', JSON.stringify(fullUser));
    syncUserResumes(userData.email, effectiveRole);
    setTimeout(() => {
      setCurrentPage('dashboard');
      setTransitionLoadingMsg(null);
    }, 650);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    localStorage.removeItem(`ats_user_session_${userRole}`);
    localStorage.removeItem('ats_user_session');
    localStorage.removeItem('authToken');
    setUser(null);
    setCurrentPage('home');
  };

  const handleAnalyzeNewResume = async (record: ResumeRecord) => {
    setResumes((prev) => {
      const updated = [record, ...prev];
      if (user?.email) {
        localStorage.setItem(`ats_user_resumes_${userRole}_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedResume(record);

    // Persist asynchronously to the active Firestore Database Folder (personal_portal or recruiters_portal)
    if (user?.email) {
      try {
        await saveToDatabaseFolder(activeDbFolder, user.email, record);
      } catch (err) {
        console.warn('Firestore database save notice:', err);
      }
    }
  };

  const handleAnalyzeBatch = async (records: ResumeRecord[]) => {
    setResumes((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newRecords = records.filter((r) => !existingIds.has(r.id));
      const updated = [...newRecords, ...prev];
      if (user?.email) {
        localStorage.setItem(`ats_user_resumes_${userRole}_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Persist batch asynchronously to active Firestore Database Folder
    if (user?.email) {
      for (const rec of records) {
        try {
          await saveToDatabaseFolder(activeDbFolder, user.email, rec);
        } catch (err) {
          console.warn('Firestore database batch save notice:', err);
        }
      }
    }
  };

  const handleDeleteResume = async (id: string) => {
    setResumes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      if (user?.email) {
        localStorage.setItem(`ats_user_resumes_${userRole}_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Delete asynchronously from active Firestore Database Folder
    try {
      await deleteFromDatabaseFolder(activeDbFolder, id);
    } catch (err) {
      console.warn('Firestore database delete notice:', err);
    }
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

  if (isInitialBooting) {
    return (
      <BrandedLoadingScreen 
        fullScreen={true} 
        message="Loading ATS Score Checker..." 
        subMessage="Preparing AI analysis engine & career tools"
      />
    );
  }

  if (transitionLoadingMsg) {
    return (
      <BrandedLoadingScreen 
        fullScreen={true} 
        message={transitionLoadingMsg} 
        subMessage="Synchronizing candidate profile & scan history"
      />
    );
  }

  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onSelectRole={handleSelectRole}
          onOpenAuth={handleOpenAuth}
          currentRole={userRole}
          personalUser={personalUser}
          recruiterUser={recruiterUser}
        />
        <AuthModal
          isOpen={authModalState.isOpen}
          initialMode={authModalState.mode}
          targetRole={userRole}
          onRoleChange={(r) => setUserRole(r)}
          onClose={handleCloseAuth}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1F2937] font-sans flex flex-col selection:bg-[#4F7CFF]/15 selection:text-[#4F7CFF]">
      
      {/* Floating Glass Navbar */}
      <Navbar
        user={user}
        currentPage={currentPage}
        userRole={userRole}
        personalUser={personalUser}
        recruiterUser={recruiterUser}
        resumes={resumes}
        onSelectResume={setSelectedResume}
        onOpenAuth={handleOpenAuth}
        onOpenUpload={handleOpenUpload}
        onNavigate={handleNavigate}
        onSelectPage={(page) => setCurrentPage(page)}
        onSelectLanding={() => setCurrentPage('landing')}
        onSwitchRole={handleSelectRole}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex w-full px-3 sm:px-6 lg:px-8 pt-4">
        {/* Main Content Area */}
        <main className="flex-1 space-y-16 sm:space-y-24 min-w-0 pb-16">
          
          {currentPage === 'dashboard' && user ? (
            /* Logged-in Candidate Dashboard Page */
            <UserDashboardPage
              user={user}
              resumes={resumes}
              userRole={userRole}
              onBack={() => setCurrentPage('landing')}
              onSwitchRole={() => setCurrentPage('landing')}
              onAnalyzeNewResume={handleAnalyzeNewResume}
              onAnalyzeBatch={handleAnalyzeBatch}
              onSelectResume={setSelectedResume}
              onDeleteResume={handleDeleteResume}
              onLogout={handleLogout}
            />
          ) : (
            /* Public Landing Page */
            <>
              {/* Hero Section (#home) */}
              <motion.section 
                id="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="pt-6 sm:pt-12 relative overflow-hidden"
              >
                {/* Background Soft Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4F7CFF]/8 rounded-full blur-3xl pointer-events-none -z-10"></div>
                <div className="absolute top-20 right-10 w-80 h-80 bg-[#FF6B6B]/6 rounded-full blur-3xl pointer-events-none -z-10"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  
                  {/* Hero Left Column */}
                  <div className="lg:col-span-6 space-y-6 text-left">
                    
                    {/* Previous Navigation Button to return to Portal Selection */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPage('landing')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98 group"
                        title="Return to previous page / portal selection"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
                        <span>Previous Page</span>
                      </button>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {userRole === 'recruiter' ? 'Recruiter Portal' : 'Personal Candidate Portal'}
                      </span>
                    </motion.div>

                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 text-[#4F7CFF] text-xs font-black shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#4F7CFF]" />
                      <span>
                        {userRole === 'recruiter'
                          ? 'Recruiter & HR AI Engine • High Precision Screening'
                          : 'Gemini AI Engine • 98.4% ATS Precision'}
                      </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1F2937] leading-[1.12]"
                    >
                      {userRole === 'recruiter' ? (
                        <>
                          Screen & Rank Candidates with{' '}
                          <span className="text-[#4F7CFF] underline decoration-[#4F7CFF]/30 underline-offset-4">
                            AI Precision.
                          </span>
                        </>
                      ) : (
                        <>
                          Build a Resume That Gets{' '}
                          <span className="text-[#4F7CFF] underline decoration-[#4F7CFF]/30 underline-offset-4">
                            Interview Calls.
                          </span>
                        </>
                      )}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="text-base sm:text-lg text-[#6B7280] font-medium leading-relaxed max-w-xl"
                    >
                      {userRole === 'recruiter'
                        ? 'Evaluate applicant pools in seconds, benchmark resumes directly against target job descriptions, uncover qualification gaps, and streamline candidate shortlists.'
                        : 'Land your dream job with AI-powered resume analysis, instant ATS compatibility scores, keyword match optimization, and precision formatting feedback.'}
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="pt-2 flex items-center gap-4 flex-wrap"
                    >
                      <button
                        onClick={() => handleOpenAuth('signup')}
                        className="px-8 py-3.5 bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF] hover:opacity-95 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#4F7CFF]/25 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2.5 group"
                      >
                        <span>{userRole === 'recruiter' ? 'Start Screening Free' : 'Get Started Free'}</span>
                        <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => handleOpenAuth('login')}
                        className="px-7 py-3.5 bg-white text-[#1F2937] border border-[#EEF2F7] hover:bg-[#EEF2F7]/50 font-extrabold text-base rounded-2xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2.5 shadow-xs"
                      >
                        <LogIn className="w-4.5 h-4.5 text-[#6B7280]" />
                        <span>{userRole === 'recruiter' ? 'Recruiter Log In' : 'Log In'}</span>
                      </button>
                    </motion.div>

                    {/* Trust Pills */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="pt-3 flex items-center gap-5 text-xs text-[#6B7280] font-bold flex-wrap"
                    >
                      {userRole === 'recruiter' ? (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1F2937] font-extrabold" /> Batch Applicant Scanning
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1F2937] font-extrabold" /> Job Description Alignment
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1F2937] font-extrabold" /> Shortlist Scorecards
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1F2937] font-extrabold" /> Instant PDF/DOCX Analysis
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1F2937] font-extrabold" /> No Credit Card Required
                          </span>
                        </>
                      )}
                    </motion.div>

                  </div>

                  {/* Hero Right Column: Interactive ATS SaaS Dashboard Mockup */}
                  <div className="lg:col-span-6">
                    <HeroAtsIllustration userRole={userRole} />
                  </div>

                </div>
              </motion.section>

              {/* Live Instant Resume Scanner Section (#upload / #scanner) - Personal portal only on public page */}
              {userRole !== 'recruiter' && (
                <section id="upload" className="space-y-4">
                  <div id="scanner" className="bg-white rounded-[24px] border border-[#EEF2F7] p-6 sm:p-10 shadow-[0_4px_24px_rgb(15,23,42,0.04)] space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                      <span className="px-3.5 py-1 bg-slate-900 text-teal-400 font-black text-xs rounded-full border border-slate-800 inline-block shadow-xs">
                        Instant ATS Resume Scanner
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Test Your Resume Against ATS Algorithms
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        Upload your PDF or Word resume to get an instant 0-100 ATS compatibility score, section audit, and tailored improvement suggestions.
                      </p>
                    </div>

                    <ResumeUploadForm
                      userRole={userRole}
                      onAnalyze={handleAnalyzeNewResume}
                      onAnalyzeBatch={handleAnalyzeBatch}
                      onSelectResume={setSelectedResume}
                    />
                  </div>
                </section>
              )}

              {/* Features Section (#features) */}
              <section id="features" className="bg-white rounded-[24px] border border-[#EEF2F7] p-6 sm:p-12 space-y-12 soft-shadow relative">
                
                {/* Features Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="px-3.5 py-1 bg-[#4F7CFF]/10 text-[#4F7CFF] font-black text-xs rounded-full border border-[#4F7CFF]/20 inline-block">
                    {userRole === 'recruiter' ? 'RECRUITER & TALENT INTELLIGENCE' : 'COMPREHENSIVE AI SUITE'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-[#1F2937] tracking-tight">
                    {userRole === 'recruiter'
                      ? 'Everything You Need for Data-Driven Candidate Screening'
                      : 'Everything You Need to Build a Winning Resume'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] font-medium leading-relaxed">
                    {userRole === 'recruiter'
                      ? 'Accelerate applicant evaluations, spot qualified talent instantly, detect critical skill gaps, and export candidate shortlist scorecards.'
                      : 'Our AI-powered tools help you optimize your resume, improve ATS compatibility, and increase your chances of landing interviews.'}
                  </p>
                </div>

                {/* 8 Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {userRole === 'recruiter' ? (
                    <>
                      {/* Recruiter Feature 1 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Brain className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Batch Candidate Screening
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Process applicant pools at scale with automated high-speed AI extraction and structure mapping.
                        </p>
                      </div>

                      {/* Recruiter Feature 2 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <ShieldCheck className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          ATS Compatibility Auditor
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Verify applicant formatting against enterprise ATS standards like Workday, Taleo, and Greenhouse.
                        </p>
                      </div>

                      {/* Recruiter Feature 3 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Target className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Job Requirement Alignment
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Benchmark candidate qualifications directly against target job descriptions and required skills.
                        </p>
                      </div>

                      {/* Recruiter Feature 4 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#FF6B6B] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-[#FF6B6B] flex items-center justify-center font-bold group-hover:bg-[#FF6B6B] group-hover:text-white transition-colors shadow-2xs">
                          <Sparkles className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#FF6B6B] transition-colors">
                          Recruiter AI Copilot
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Ask AI for instant candidate summaries, career trajectory checks, and interview question prompts.
                        </p>
                      </div>

                      {/* Recruiter Feature 5 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <KeyRound className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Skill Gap & Keyword Audit
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Identify missing technical competencies, certifications, or tool experiences before interviews.
                        </p>
                      </div>

                      {/* Recruiter Feature 6 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Briefcase className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Candidate Ranking Matrix
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Rank applicants objectively by skill relevance, experience depth, and ATS compatibility.
                        </p>
                      </div>

                      {/* Recruiter Feature 7 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <BarChart3 className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Pipeline Scorecards
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Maintain structured candidate scorecards and compare talent performance across requisition pools.
                        </p>
                      </div>

                      {/* Recruiter Feature 8 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#FF6B6B] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-[#FF6B6B] flex items-center justify-center font-bold group-hover:bg-[#FF6B6B] group-hover:text-white transition-colors shadow-2xs">
                          <FileText className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#FF6B6B] transition-colors">
                          Shortlist Reports & Sharing
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Export candidate summary reports and share applicant scorecards with hiring managers easily.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Feature 1 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Brain className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Smart Resume Analysis
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          AI-powered insights to improve your overall resume structure, tone, and professional impact.
                        </p>
                      </div>

                      {/* Feature 2 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <ShieldCheck className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          ATS Score Checker
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Measure your resume's exact compatibility against automated applicant tracking screeners.
                        </p>
                      </div>

                      {/* Feature 3 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Target className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Detailed Section Scores
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Receive granular breakdown scores for formatting, experience impact, and contact details.
                        </p>
                      </div>

                      {/* Feature 4 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#FF6B6B] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-[#FF6B6B] flex items-center justify-center font-bold group-hover:bg-[#FF6B6B] group-hover:text-white transition-colors shadow-2xs">
                          <Sparkles className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#FF6B6B] transition-colors">
                          AI Suggestions
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Actionable, personalized recommendations tailored to your specific target positions.
                        </p>
                      </div>

                      {/* Feature 5 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <KeyRound className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Keyword Optimization
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Identify missing high-priority industry keywords to drastically boost recruiter visibility.
                        </p>
                      </div>

                      {/* Feature 6 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <Briefcase className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Job Match Analysis
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Compare your resume side-by-side against target job descriptions and key skill requirements.
                        </p>
                      </div>

                      {/* Feature 7 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#4F7CFF] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#4F7CFF]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center font-bold group-hover:bg-[#4F7CFF] group-hover:text-white transition-colors shadow-2xs">
                          <BarChart3 className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#4F7CFF] transition-colors">
                          Analytics Dashboard
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Track historical score improvements and resume performance trends across application rounds.
                        </p>
                      </div>

                      {/* Feature 8 */}
                      <div className="p-6 bg-white rounded-2xl border border-[#EEF2F7] space-y-3 hover:border-[#FF6B6B] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 group cursor-pointer">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-[#FF6B6B] flex items-center justify-center font-bold group-hover:bg-[#FF6B6B] group-hover:text-white transition-colors shadow-2xs">
                          <FileText className="w-5.5 h-5.5" />
                        </div>
                        <h3 className="text-base font-black text-[#1F2937] group-hover:text-[#FF6B6B] transition-colors">
                          Cover Letter Generator
                        </h3>
                        <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                          Generate personalized cover letters tailored to matched job roles in seconds.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Performance Metrics Section */}
                <div className="pt-8 border-t border-[#EEF2F7] space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-[#4F7CFF]" />
                      <span>ATS Performance Benchmark Statistics</span>
                    </h3>
                    <span className="text-xs font-black text-[#4F7CFF] bg-[#4F7CFF]/10 px-3 py-1 rounded-full border border-[#4F7CFF]/20">
                      Real-time Platform Metrics
                    </span>
                  </div>
                  <DashboardStats stats={liveStats} />
                </div>

              </section>

              {/* How It Works Section (#how-it-works) */}
              <section id="how-it-works" className="bg-white rounded-[24px] border border-[#EEF2F7] p-6 sm:p-12 space-y-12 soft-shadow">
                
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="px-3.5 py-1 bg-[#4F7CFF]/10 text-[#4F7CFF] font-black text-xs rounded-full border border-[#4F7CFF]/20 inline-block">
                    SIMPLE 4-STEP PROCESS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-[#1F2937] tracking-tight">
                    How ATS Score Checker Works
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] font-medium leading-relaxed">
                    Transform your job application callbacks in minutes with AI-driven precision and instant formatting feedback.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                  
                  {/* Step 1 */}
                  <div className="p-6 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-4 relative hover:border-[#4F7CFF] hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#4F7CFF]/20">
                      1
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[#4F7CFF]" />
                        Upload Resume
                      </h3>
                      <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                        Upload your PDF or DOCX candidate resume securely to initiate the instant scan.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-6 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-4 relative hover:border-[#4F7CFF] hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#4F7CFF]/20">
                      2
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#4F7CFF]" />
                        AI Deep Scan
                      </h3>
                      <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                        Gemini AI evaluates keyword density, formatting compliance, action verbs, and skill matches.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-6 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-4 relative hover:border-[#4F7CFF] hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#4F7CFF]/20">
                      3
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#4F7CFF]" />
                        Get Your ATS Score
                      </h3>
                      <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                        Receive a comprehensive 0-100 ATS compatibility score with detailed section feedback.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-6 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-4 relative hover:border-[#4F7CFF] hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#4F7CFF]/20">
                      4
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center gap-2">
                        <Download className="w-5 h-5 text-[#4F7CFF]" />
                        Optimize & Export
                      </h3>
                      <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                        Apply AI recommended keywords and export your optimized analysis report.
                      </p>
                    </div>
                  </div>

                </div>
              </section>

              {/* Advantages & Facilities Section */}
              <section id="advantages" className="bg-[#EEF2F7]/30 rounded-[24px] border border-[#EEF2F7] p-6 sm:p-12 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="px-3.5 py-1 bg-[#4F7CFF]/10 text-[#4F7CFF] font-black text-xs rounded-full border border-[#4F7CFF]/20 inline-block">
                    {userRole === 'recruiter' ? 'ENTERPRISE TALENT CAPABILITIES' : 'CANDIDATE SUCCESS PLATFORM'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-[#1F2937] tracking-tight">
                    {userRole === 'recruiter' 
                      ? 'Core Advantages & Recruiting Facilities' 
                      : 'Key Advantages & Platform Facilities'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] font-medium leading-relaxed">
                    {userRole === 'recruiter'
                      ? 'Streamline cohort screening, reduce evaluation cycle times, and standardize hiring decisions with enterprise talent analytics.'
                      : 'Engineered to help you navigate modern ATS algorithms, pinpoint missing keywords, and land more interview callbacks.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {userRole === 'recruiter' ? (
                    <>
                      {/* Recruiter Facility 1 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                              <Zap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-wider">
                              Facility
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Concurrent Cohort Ingestion</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Bulk parse and analyze 25+ PDF, DOCX, and TXT resumes simultaneously with automated candidate indexing.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Cuts initial CV screening time by over 80%, converting unstructured resume documents into structured applicant scorecards.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-indigo-600">
                          <span>High-Volume Ingestion</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-[10px]">
                            25+ Resumes / Batch
                          </span>
                        </div>
                      </div>

                      {/* Recruiter Facility 2 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                              <Target className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-wider">
                              Advantage
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Weighted JD Matching Matrix</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Benchmark candidate pools against customized Job Description parameters and required skill criteria.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Enforces consistent, objective criteria across your team and automatically groups applicants into Strong Hire, Lean Hire, and Review tiers.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-emerald-600">
                          <span>Unbiased Shortlisting</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 text-[10px]">
                            Automated Fit Tiers
                          </span>
                        </div>
                      </div>

                      {/* Recruiter Facility 3 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-full border border-purple-100 uppercase tracking-wider">
                              Facility
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Side-by-Side Candidate Analytics</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Interactive comparison modal highlighting section scores, matched competencies, and missing skills side by side.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Gives talent leads and hiring managers immediate visual evidence to debate and finalize interview rosters faster.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-purple-600">
                          <span>Cross-Cohort Comparison</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-100 text-[10px]">
                            Direct Matrix View
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Personal Facility 1 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
                              <ShieldCheck className="w-5 h-5 text-teal-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-full border border-teal-100 uppercase tracking-wider">
                              Advantage
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Enterprise ATS Verification</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Deep structural audit checking layout compliance, section headers, font readability, and multi-column parsing.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Eliminates hidden formatting traps that cause automated rejection by enterprise ATS tools like Workday, Taleo, and Greenhouse.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-teal-600">
                          <span>Format Compliance</span>
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-100 text-[10px]">
                            99.2% Parsing Pass Rate
                          </span>
                        </div>
                      </div>

                      {/* Personal Facility 2 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                              <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-wider">
                              Facility
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Skill Set Graph & Gap Analysis</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Interactive competency graph breaking down Frontend, Backend, Cloud, Databases, and role-specific domains.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Highlights exact missing keywords and competency gaps so you can strategically align your resume to your target role.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-indigo-600">
                          <span>Keyword Intelligence</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-[10px]">
                            Domain Breakdown
                          </span>
                        </div>
                      </div>

                      {/* Personal Facility 3 */}
                      <div className="bg-white p-6 rounded-2xl border border-[#EEF2F7] soft-shadow space-y-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                              <FileCheck2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-wider">
                              Advantage
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-[#1F2937]">Granular Section Diagnostics</h3>
                            <div className="space-y-1.5 text-xs text-[#6B7280] font-medium leading-relaxed">
                              <p><strong className="text-slate-800 font-bold">Facility:</strong> Itemized scoring and actionable suggestions for Work Experience, Education, Technical Skills, and Summary.</p>
                              <p><strong className="text-slate-800 font-bold">Advantage:</strong> Replaces weak duty descriptions with high-impact, metric-driven bullet points that grab the attention of human recruiters.</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-[11px] font-bold text-emerald-600">
                          <span>Score Audit</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 text-[10px]">
                            0-100 Compatibility Score
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </section>
            </>
          )}

        </main>
      </div>

      {/* Minimal Modern Footer */}
      <footer className="bg-[#1F2937] text-gray-300 border-t border-gray-800">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-800">
            {/* Logo and Tagline */}
            <div className="flex items-center gap-3">
              <AtsLogo size="lg" showSubtitle={true} className="[&_span]:text-white" />
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-xs font-bold text-gray-400">
              <button onClick={() => handleNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                Home
              </button>
              <button onClick={() => handleNavigate('features')} className="hover:text-white transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => handleNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                How It Works
              </button>
            </div>
          </div>

          {/* Bottom Copyright & System Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7EDCC3] animate-pulse"></span>
              <span>System Status: <strong className="text-white font-bold">Gemini ATS Engine Active</strong></span>
            </div>

            <p className="text-gray-400 text-center sm:text-right font-medium">
              © 2026 ATS Score Checker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        targetRole={userRole}
        onRoleChange={(r) => setUserRole(r)}
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
