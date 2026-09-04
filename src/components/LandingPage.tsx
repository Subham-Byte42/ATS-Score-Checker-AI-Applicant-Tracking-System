import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserCheck, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Building2, 
  Search, 
  FileText,
  Target,
  Award,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { AtsLogo, AtsLogoIcon } from './AtsLogo';

export type UserRole = 'personal' | 'recruiter';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  currentRole?: UserRole;
  personalUser?: { name: string; email: string } | null;
  recruiterUser?: { name: string; email: string } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectRole,
  onOpenAuth,
  currentRole = 'personal',
  personalUser,
  recruiterUser,
}) => {
  const [hoveredCard, setHoveredCard] = useState<UserRole | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1F2937] flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Custom CSS for Smooth Floating Keyframe Animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-0.5deg); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
        .animate-float-slow {
          animation: floatSlow 5s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 6s ease-in-out infinite;
        }
        .bg-grid-pattern {
          background-size: 32px 32px;
          background-image: 
            linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px);
        }
      `}</style>

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      {/* Radial Gradient Mesh Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header / Branding Bar */}
      <header className="w-full px-4 sm:px-8 lg:px-12 pt-6 pb-4 flex items-center justify-center sm:justify-start relative z-20">
        <AtsLogo size="xl" showSubtitle={true} />
      </header>

      {/* Main Container */}
      <main className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Hero Section Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto space-y-4 mb-10 sm:mb-14"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-[#0284C7] text-xs sm:text-sm font-black shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#0284C7] animate-pulse" />
            <span>Smart resume analytics tailored for candidates and recruiters alike.</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.12]">
            <span className="text-[#0284C7] underline decoration-[#0284C7]/25 underline-offset-8">ATS Score Checker</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 font-semibold max-w-3xl mx-auto leading-relaxed">
            Transforming resumes into actionable insights with dual-mode evaluation for personal growth and recruiter screening.
          </p>
        </motion.div>

        {/* 2 Prominent Interactive Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch w-full">
          
          {/* CARD 1: Personal Tracking (Candidates) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onMouseEnter={() => setHoveredCard('personal')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectRole('personal')}
            className={`group relative bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
              hoveredCard === 'personal' || currentRole === 'personal'
                ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20 shadow-[0_20px_45px_rgba(59,130,246,0.12)] -translate-y-1'
                : 'border-slate-200/90 hover:border-blue-300'
            }`}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/60 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-100/50 transition-colors" />

            <div className="relative z-10 space-y-6">
              
              {/* Header Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#3B82F6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#3B82F6] group-hover:text-white transition-all duration-300">
                  <UserCheck className="w-7 h-7" />
                </div>

                <span className="px-3 py-1 bg-blue-50 text-[#3B82F6] font-extrabold text-[11px] rounded-full border border-blue-200/70 uppercase tracking-wider">
                  For Job Seekers
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#3B82F6] transition-colors">
                  Personal Tracking
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Analyze your resume against target job descriptions. Get instant match scores, detailed skill gap analysis, and tailored Gemini AI formatting advice.
                </p>
              </div>

              {/* Animated Live Preview Widget (Floating UI Card) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 animate-float-slow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AtsLogoIcon size={24} />
                    <span className="text-xs font-bold text-slate-800">My Resume Health</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    92/100 ATS Match
                  </span>
                </div>

                {/* Progress bar preview */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Keyword Optimization</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-[88%] h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full" />
                  </div>
                </div>

                {/* Feature Bullet Points */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Skill Gap Fixer</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <Target className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Role Alignment</span>
                  </div>
                </div>
              </div>

              {/* Key Features List */}
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span>Instant PDF & DOCX ATS Score Scanner</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span>Personal AI Career Coach & Chat Advisor</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span>Historical Progress & Version Tracking</span>
                </li>
              </ul>
            </div>

            {/* Bottom Call To Action Button */}
            <div className="pt-8 relative z-10 space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('personal');
                }}
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-[#3B82F6] text-white font-black text-sm rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {personalUser ? `Enter Personal Workspace (${personalUser.name})` : 'Enter Personal Workspace'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {personalUser ? (
                <p className="text-center text-[11px] font-bold text-emerald-600">
                  ✓ Logged in with Personal ID ({personalUser.email})
                </p>
              ) : (
                <p className="text-center text-[11px] text-slate-500 font-medium">
                  Personal candidate login or free signup
                </p>
              )}
            </div>
          </motion.div>

          {/* CARD 2: For Recruiters (HR & Enterprise) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onMouseEnter={() => setHoveredCard('recruiter')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectRole('recruiter')}
            className={`group relative bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
              hoveredCard === 'recruiter' || currentRole === 'recruiter'
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-[0_20px_45px_rgba(99,102,241,0.12)] -translate-y-1'
                : 'border-slate-200/90 hover:border-indigo-300'
            }`}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-colors" />

            <div className="relative z-10 space-y-6">
              
              {/* Header Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <Users className="w-7 h-7" />
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-full border border-indigo-200/70 uppercase tracking-wider">
                    For Recruiters & HR
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded-md border border-amber-200/70">
                    Separate Recruiter ID
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                  For Recruiters
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Streamline talent acquisition with candidate pipeline screening, job description alignment matrix, bulk applicant ranking, and HR export tools.
                </p>
              </div>

              {/* Animated Live Preview Widget (Floating UI Card) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 animate-float-reverse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Candidate Pipeline Scan</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Batch Active
                  </span>
                </div>

                {/* Candidate Rank Preview Stack */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/70 text-[11px]">
                    <span className="font-bold text-slate-800">Alex Chen (Senior Dev)</span>
                    <span className="font-black text-emerald-600">96% Match</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/70 text-[11px]">
                    <span className="font-bold text-slate-800">Sarah Jenkins (Fullstack)</span>
                    <span className="font-black text-indigo-600">89% Match</span>
                  </div>
                </div>

                {/* Feature Bullet Points */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Talent Ranking</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-rose-500" />
                    <span>Batch AI Parser</span>
                  </div>
                </div>
              </div>

              {/* Key Features List */}
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span>Candidate Match Matrix & JD Keyword Alignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span>Bulk Applicant Screening & PDF Resume Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span>Shortlist Exporting & Hiring Insights Analytics</span>
                </li>
              </ul>
            </div>

            {/* Bottom Call To Action Button */}
            <div className="pt-8 relative z-10 space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('recruiter');
                }}
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {recruiterUser 
                    ? `Enter Recruiter Portal (${recruiterUser.name})` 
                    : personalUser 
                      ? 'Requires Recruiter ID • Create / Sign In' 
                      : 'Enter Recruiter Portal'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {recruiterUser ? (
                <p className="text-center text-[11px] font-bold text-indigo-600">
                  ✓ Logged in with Recruiter ID ({recruiterUser.email})
                </p>
              ) : personalUser ? (
                <p className="text-center text-[11px] text-amber-700 font-semibold">
                  Personal ID cannot access recruiter mode. Dedicated Recruiter ID required.
                </p>
              ) : (
                <p className="text-center text-[11px] text-slate-500 font-medium">
                  Dedicated Recruiter ID required for candidate screening
                </p>
              )}
            </div>
          </motion.div>

        </div>

        {/* Feature Highlights Grid Below */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 pt-10 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        >
          <div className="p-4 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center mx-auto mb-2 font-black">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Instant AI Analysis</h4>
            <p className="text-xs text-slate-500 font-medium">Powered by Gemini 3.6 Flash for sub-second precision scoring</p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Privacy & Enterprise Safe</h4>
            <p className="text-xs text-slate-500 font-medium">Encrypted resume processing & confidential candidate storage</p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">High Match Rate</h4>
            <p className="text-xs text-slate-500 font-medium">Boost interview callback rates by up to 3.4x with keyword tuning</p>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-8 lg:px-12 py-6 text-center text-xs text-slate-400 font-medium relative z-10 border-t border-slate-100">
        <p>© {new Date().getFullYear()} ATS Score Checker • Powered by Gemini AI Engine</p>
      </footer>

    </div>
  );
};

export default LandingPage;
