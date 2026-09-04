import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Check, 
  X, 
  ShieldCheck,
  SearchCheck,
  TrendingUp,
  Award,
  Users,
  Briefcase
} from 'lucide-react';

interface HeroAtsIllustrationProps {
  userRole?: 'personal' | 'recruiter';
}

export const HeroAtsIllustration: React.FC<HeroAtsIllustrationProps> = ({ userRole = 'personal' }) => {
  const isRecruiter = userRole === 'recruiter';

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Background Soft Glows */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow"></div>
      <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow"></div>

      {/* Main SaaS Dashboard Floating Container */}
      <div className="relative bg-white border border-slate-200/80 rounded-[24px] soft-shadow p-5 sm:p-6 space-y-4">
        
        {/* Window Chrome Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span className="text-[11px] font-semibold text-slate-500 ml-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-800" />
              {isRecruiter ? 'Candidate_Pool_Sr_Software_Engineer.pdf' : 'Alex_Morgan_Software_Engineer_Resume.pdf'}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
            isRecruiter 
              ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
              : 'bg-teal-50 text-teal-800 border-teal-200/70'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${isRecruiter ? 'bg-indigo-600' : 'bg-teal-600'}`}></span>
            <span className="font-extrabold">
              {isRecruiter ? 'Recruiter Screening • Batch Evaluation' : 'ATS Ready • Workday & Taleo'}
            </span>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          
          {/* Left Side: Resume Preview Card */}
          <div className="sm:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-[18px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-md ${
                  isRecruiter ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-900 shadow-slate-900/10'
                }`}>
                  AM
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">Alex Morgan</h4>
                  <p className="text-[10px] font-medium text-slate-500">Sr. Full Stack Candidate</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isRecruiter 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-slate-200/80 text-slate-800 border-slate-300/60'
              }`}>
                {isRecruiter ? 'Top Candidate' : 'PDF Resume'}
              </span>
            </div>

            {/* Resume Text Box */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-[10px] text-slate-800 space-y-2 leading-relaxed shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 tracking-wider text-[9px]">
                  {isRecruiter ? 'REQUIREMENT ALIGNMENT SUMMARY' : 'PROFESSIONAL SUMMARY'}
                </span>
                <span className="text-[9px] font-bold text-teal-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-teal-600" /> Verified
                </span>
              </div>
              <p className="line-clamp-2 text-slate-600">
                Senior engineer with 6+ years experience designing scalable web apps with{' '}
                <span className="bg-teal-50 text-teal-700 border border-teal-200/60 font-bold px-1 rounded">React</span>,{' '}
                <span className="bg-teal-50 text-teal-700 border border-teal-200/60 font-bold px-1 rounded">TypeScript</span>, and{' '}
                <span className="bg-teal-50 text-teal-700 border border-teal-200/60 font-bold px-1 rounded">Node.js</span>.
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
                <span className="text-slate-500 font-medium">Keywords Matched: 22/24</span>
                <span className="text-teal-700 font-extrabold flex items-center gap-0.5">
                  <SearchCheck className="w-3 h-3" /> 92% Match Score
                </span>
              </div>
            </div>

            {/* Formatting & Grammar Score Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
                  {isRecruiter ? 'Qualification & Technical Audit' : 'Action Verbs & Grammar'}
                </span>
                <span className="font-extrabold text-slate-800">96% Excellent</span>
              </div>
              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                <div className={`h-full w-[96%] rounded-full ${isRecruiter ? 'bg-indigo-600' : 'bg-teal-600'}`}></div>
              </div>
            </div>
          </div>

          {/* Right Side: Circular ATS Score & Missing Skills */}
          <div className="sm:col-span-5 space-y-3 flex flex-col justify-between">
            
            {/* ATS Score Circle Box */}
            <div className="bg-white border border-slate-200/80 rounded-[18px] p-3 text-center space-y-1.5 soft-shadow">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                {isRecruiter ? 'Candidate Ranking Score' : 'ATS Compatibility Score'}
              </span>
              
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center my-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={isRecruiter ? "text-indigo-600" : "text-teal-600"}
                    strokeDasharray="90, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900 leading-none">90</span>
                  <span className={`text-[8px] font-bold uppercase ${isRecruiter ? 'text-indigo-700' : 'text-teal-700'}`}>/ 100</span>
                </div>
              </div>

              <span className={`inline-block px-3 py-0.5 font-extrabold text-[10px] rounded-full border ${
                isRecruiter
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200/80'
              }`}>
                {isRecruiter ? 'Shortlist Priority: High' : 'Top 5% Candidate'}
              </span>
            </div>

            {/* Missing Skills Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-[18px] p-3 space-y-1.5">
              <p className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                {isRecruiter ? 'JD Skill Gaps' : 'Missing Keywords'}
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/70 rounded-full text-[9px] font-bold flex items-center gap-1">
                  <X className="w-2.5 h-2.5" /> Kubernetes
                </span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/70 rounded-full text-[9px] font-bold flex items-center gap-1">
                  <X className="w-2.5 h-2.5" /> GraphQL
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* AI Suggestions Floating Banner */}
        <motion.div 
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-50 border border-slate-200/80 rounded-[16px] p-3.5 flex items-start gap-3 relative z-10"
        >
          <div className="p-2 bg-slate-900 text-white rounded-xl shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-extrabold text-slate-800">
              {isRecruiter ? 'Recruiter AI Insights Copilot' : 'AI Recommendation Engine'}
            </p>
            <p className="text-[10px] text-slate-600 leading-snug font-medium">
              {isRecruiter ? (
                <>Candidate exceeds <strong className="text-slate-900">React & TypeScript</strong> requirements by <span className="text-indigo-600 font-black">+18%</span>. Highly recommended for technical interview round.</>
              ) : (
                <>Add <strong className="text-slate-900">"Microservices"</strong> and <strong className="text-slate-900">"AWS CI/CD"</strong> to increase callback likelihood by <span className="text-teal-600 font-black">+14%</span>.</>
              )}
            </p>
          </div>
        </motion.div>

      </div>

      {/* Floating Card Badge 1 (Top Right) */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-7 -right-6 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3.5 rounded-2xl shadow-xl shadow-slate-900/5 z-20"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${
          isRecruiter ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-teal-50 border-teal-200 text-teal-600'
        }`}>
          {isRecruiter ? <Award className="w-5 h-5 text-indigo-600" /> : <CheckCircle2 className="w-5 h-5 text-teal-600" />}
        </div>
        <div>
          <p className="text-xs font-black text-slate-900">
            {isRecruiter ? 'Shortlisted Candidate' : 'Keyword Match'}
          </p>
          <p className={`text-[11px] font-extrabold ${isRecruiter ? 'text-indigo-600' : 'text-teal-600'}`}>
            {isRecruiter ? '94% Match • High Priority' : '92% Match Rate'}
          </p>
        </div>
      </motion.div>

      {/* Floating Card Badge 2 (Bottom Left) */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-7 -left-6 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3.5 rounded-2xl shadow-xl shadow-slate-900/5 z-20"
      >
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/20">
          {isRecruiter ? <Users className="w-5 h-5 text-teal-400" /> : <TrendingUp className="w-5 h-5 text-teal-400" />}
        </div>
        <div>
          <p className="text-xs font-black text-slate-900">
            {isRecruiter ? 'Batch Screening Active' : 'Formatting Check'}
          </p>
          <p className="text-[11px] font-bold text-slate-600">
            {isRecruiter ? '24 Resumes Screened in 1.2s' : 'Workday & Taleo Compliant'}
          </p>
        </div>
      </motion.div>

      {/* Floating Card Badge 3 (Top Left - Recruiter Accent) */}
      {isRecruiter && (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 -left-10 hidden lg:flex items-center gap-2.5 bg-slate-900 text-white p-3 rounded-2xl shadow-xl z-20 border border-slate-800"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-black leading-tight text-white">Job Match Matrix</p>
            <p className="text-[10px] font-semibold text-indigo-300">100% Core Requirements Met</p>
          </div>
        </motion.div>
      )}

    </div>
  );
};
