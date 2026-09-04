import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeRecord, CandidateFitRating, RecruiterEvaluation } from '../types';
import { downloadResumePDF } from '../utils/pdfExport';
import { AiSuggestionsModule } from './AiSuggestionsModule';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Download, 
  Award,
  ListChecks,
  Briefcase,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  Save,
  MessageSquareQuote,
  ShieldAlert,
  Edit3,
  Check
} from 'lucide-react';

interface AnalysisModalProps {
  resume: ResumeRecord | null;
  onClose: () => void;
  userRole?: 'personal' | 'recruiter';
  onUpdateResume?: (updatedResume: ResumeRecord) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  resume, 
  onClose,
  userRole = 'personal',
  onUpdateResume
}) => {
  const [activeTab, setActiveTab] = useState<'recruiter-screening' | 'overview' | 'ai-suggestions'>(
    userRole === 'recruiter' ? 'recruiter-screening' : 'overview'
  );

  // Local state for recruiter notes and fit rating modifications
  const [notes, setNotes] = useState<string>('');
  const [selectedFitRating, setSelectedFitRating] = useState<CandidateFitRating>('Review');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  useEffect(() => {
    if (resume) {
      setNotes(resume.recruiterEvaluation?.candidateNotes || '');
      setSelectedFitRating(resume.recruiterEvaluation?.fitRating || (
        resume.atsScore >= 88 ? 'Strong Hire' :
        resume.atsScore >= 76 ? 'Lean Hire' :
        resume.atsScore >= 60 ? 'Review' : 'Pass'
      ));
      if (userRole === 'recruiter') {
        setActiveTab('recruiter-screening');
      }
    }
  }, [resume, userRole]);

  if (!resume) return null;

  const candidateName = resume.candidateName || 'Candidate';
  const targetRole = resume.targetRole || 'Software Engineer';
  const fileName = resume.fileName || 'Resume.pdf';
  const fileSize = resume.fileSize || '1.0 MB';
  const uploadDate = resume.uploadDate || new Date().toLocaleDateString();
  const atsScore = resume.atsScore ?? 85;
  const matchScore = resume.matchScore ?? 80;
  const confidence = resume.confidence ?? 92;

  const missingSkills = Array.isArray(resume.missingSkills) ? resume.missingSkills : [];
  const strengths = Array.isArray(resume.strengths) && resume.strengths.length > 0 ? resume.strengths : [
    'High keyword density for target technical stack',
    'Quantifiable metrics included in experience section',
    'Clear section hierarchy and standard ATS headings'
  ];
  const suggestions = Array.isArray(resume.suggestions) && resume.suggestions.length > 0 ? resume.suggestions : [
    'Add a dedicated technical summary header at the top',
    'Quantify additional leadership & project outcomes',
    'Ensure email and contact links are standard text'
  ];
  const recommendedRoles = Array.isArray(resume.recommendedRoles) && resume.recommendedRoles.length > 0 ? resume.recommendedRoles : [
    targetRole,
    'Full Stack Engineer',
    'Software Architect'
  ];
  const missingSections = Array.isArray(resume.missingSections) ? resume.missingSections : [];

  // Recruiter Evaluation Data (with intelligent fallbacks if not yet screened)
  const recruiterEval: RecruiterEvaluation = resume.recruiterEvaluation || {
    fitRating: selectedFitRating,
    candidateFitScore: atsScore,
    hiringRecommendation: selectedFitRating === 'Strong Hire'
      ? `Strongly recommended for ${targetRole}. Technical foundation and ATS profile align closely with role requirements.`
      : selectedFitRating === 'Lean Hire'
      ? `Promising applicant for ${targetRole}. Recommend verifying specific technical and workflow gaps during interview rounds.`
      : `Candidate has noticeable gaps against target specifications for ${targetRole}. Assess timeline continuity and core tools.`,
    keyStrengths: strengths.slice(0, 3),
    redFlags: [
      missingSkills.length > 0 ? `Lacks key expected tools on resume: ${missingSkills.slice(0, 2).join(', ')}` : 'Lack of explicit metric quantification in prior roles',
      'Tenure stability and technical depth should be probed in first round'
    ],
    skillGaps: missingSkills,
    tailoredInterviewQuestions: {
      technical: [
        `How do you handle system architecture and edge cases when ${missingSkills[0] || 'core tools'} are unavailable?`,
        `Walk through your approach to optimizing performance and diagnosing production latency in ${targetRole}.`
      ],
      behavioral: [
        'Describe an instance where project scope shifted unexpectedly. How did you realign priorities and communicate with stakeholders?',
        'What prompted your recent career transitions and what specific impact did you deliver at each stop?'
      ]
    },
    candidateNotes: notes,
  };

  const handleSaveRecruiterNotes = () => {
    const updatedEval: RecruiterEvaluation = {
      ...recruiterEval,
      fitRating: selectedFitRating,
      candidateNotes: notes,
      screenedAt: new Date().toISOString(),
    };

    const updatedResume: ResumeRecord = {
      ...resume,
      recruiterEvaluation: updatedEval,
    };

    if (onUpdateResume) {
      onUpdateResume(updatedResume);
    }

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleDownloadPDF = () => {
    downloadResumePDF(resume);
  };

  const getFitBadgeStyle = (rating: CandidateFitRating) => {
    switch (rating) {
      case 'Strong Hire':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          indicator: 'bg-emerald-500',
          title: 'Strong Hire',
          subtitle: 'High-confidence candidate. Fast-track to interview panel.'
        };
      case 'Lean Hire':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-300',
          indicator: 'bg-teal-500',
          title: 'Lean Hire',
          subtitle: 'Solid match with minor gaps. Proceed with targeted interview.'
        };
      case 'Review':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          indicator: 'bg-amber-500',
          title: 'Review Required',
          subtitle: 'Potential fit but notable risks or gaps require manager review.'
        };
      case 'Pass':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300',
          indicator: 'bg-rose-500',
          title: 'Pass',
          subtitle: 'Significant qualifications gap relative to target role requirements.'
        };
    }
  };

  const activeFitStyle = getFitBadgeStyle(selectedFitRating);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md"
    >
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-[24px] border border-[#EEF2F7] soft-shadow w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#EEF2F7]/30 border-b border-[#EEF2F7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20 flex items-center justify-center font-extrabold shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#1F2937] tracking-tight">
                  {resume.candidateName}
                </h3>
                <span className="px-3 py-0.5 bg-[#4F7CFF]/10 text-[#4F7CFF] font-black text-[11px] rounded-full border border-[#4F7CFF]/20">
                  {resume.targetRole}
                </span>
                {resume.recruiterEvaluation?.fitRating && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getFitBadgeStyle(resume.recruiterEvaluation.fitRating).bg}`}>
                    {resume.recruiterEvaluation.fitRating}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                File: {resume.fileName} ({resume.fileSize}) • Scanned on {resume.uploadDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#EEF2F7] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-navigation Bar */}
        <div className="px-6 py-2.5 bg-[#EEF2F7]/30 border-b border-[#EEF2F7] flex items-center gap-2 shrink-0 flex-wrap">
          {/* Recruiter Tab */}
          <button
            onClick={() => setActiveTab('recruiter-screening')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'recruiter-screening'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Recruiter Screening & Decision</span>
            <span className="ml-1 px-1.5 py-0.2 bg-teal-500/20 text-teal-300 text-[10px] rounded-md font-bold">
              {selectedFitRating}
            </span>
          </button>

          {/* ATS Overview Tab */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#4F7CFF] shadow-2xs border border-[#EEF2F7]'
                : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            ATS Score Breakdown
          </button>

          {/* AI Suggestions Tab */}
          <button
            onClick={() => setActiveTab('ai-suggestions')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai-suggestions'
                ? 'bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF] text-white shadow-md shadow-[#4F7CFF]/20'
                : 'text-[#4F7CFF] bg-[#4F7CFF]/10 hover:bg-[#4F7CFF]/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggestions Module</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* View 1: Recruiter Screening & Evaluative Decision */}
            {activeTab === 'recruiter-screening' && (
              <motion.div
                key="recruiter-screening"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Evaluative Fit Rating Banner */}
                <div className={`p-5 rounded-2xl border ${activeFitStyle.bg} shadow-xs relative overflow-hidden`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${activeFitStyle.indicator} animate-pulse`} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Candidate Fit Decision</span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight">
                        {activeFitStyle.title}
                      </h4>
                      <p className="text-xs font-medium opacity-90 max-w-lg">
                        {activeFitStyle.subtitle}
                      </p>
                    </div>

                    {/* Quick Fit Rating Selector */}
                    <div className="bg-white/90 backdrop-blur-xs p-2 rounded-2xl border border-black/5 shadow-2xs space-y-1.5 shrink-0">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                        Screening Verdict
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['Strong Hire', 'Lean Hire', 'Review', 'Pass'] as CandidateFitRating[]).map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setSelectedFitRating(rating)}
                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${
                              selectedFitRating === rating
                                ? 'bg-slate-900 text-white shadow-xs scale-102'
                                : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Hiring Manager Recommendation */}
                <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                    <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
                    <span>Hiring Manager Screening Verdict</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-200/80">
                    "{recruiterEval.hiringRecommendation}"
                  </p>
                </div>

                {/* Evaluative Flags: Red Flags & Key Strengths Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Red Flags & Risks */}
                  <div className="p-4.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2.5">
                    <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Critical Red Flags & Screening Risks ({recruiterEval.redFlags.length})
                    </h4>
                    <ul className="space-y-2">
                      {recruiterEval.redFlags.map((flag, i) => (
                        <li key={i} className="text-xs text-rose-900 font-bold flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-200/60">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Strengths & Competitive Moats */}
                  <div className="p-4.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Key Strengths & Differentiators ({recruiterEval.keyStrengths.length})
                    </h4>
                    <ul className="space-y-2">
                      {recruiterEval.keyStrengths.map((str, i) => (
                        <li key={i} className="text-xs text-emerald-950 font-bold flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skill Gaps Against Target Spec */}
                <div className="p-4.5 bg-[#EEF2F7]/40 rounded-2xl border border-[#EEF2F7] space-y-2.5">
                  <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Identified Requirement Gaps ({recruiterEval.skillGaps.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recruiterEval.skillGaps.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white border border-amber-200 rounded-xl text-xs font-extrabold text-amber-900 shadow-2xs"
                      >
                        ⚠️ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tailored Interview Questions (Gap-Driven) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      Gap-Specific Interview Questions
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500">Tailored to identified resume gaps</span>
                  </div>

                  {/* Technical Questions */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                    <p className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      Technical Deep-Dive (Targeting Skill Gaps & System Claims)
                    </p>
                    <div className="space-y-2">
                      {recruiterEval.tailoredInterviewQuestions.technical.map((q, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-indigo-200/60 shadow-2xs text-xs font-bold text-slate-800 flex items-start gap-2.5">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md shrink-0">
                            T{i + 1}
                          </span>
                          <span className="leading-relaxed">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral & Ownership Questions */}
                  <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200 space-y-2.5">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                      Behavioral, Tenure & Scope Validation
                    </p>
                    <div className="space-y-2">
                      {recruiterEval.tailoredInterviewQuestions.behavioral.map((q, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs font-bold text-slate-800 flex items-start gap-2.5">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-black rounded-md shrink-0">
                            B{i + 1}
                          </span>
                          <span className="leading-relaxed">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recruiter Private Screening Notes & Persistent Sync */}
                <div className="p-4.5 bg-white rounded-2xl border border-[#EEF2F7] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-teal-600" />
                      Recruiter Private Screening Notes (Syncs with Workspace)
                    </h4>
                    {isSavedFeedback && (
                      <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved & Synced!
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter candidate interview feedback, screening comments, or salary expectations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 transition-all resize-none"
                  />
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleSaveRecruiterNotes}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <Save className="w-3.5 h-3.5 text-teal-400" />
                      <span>Save Evaluation & Sync</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {/* View 2: AI Suggestions Module */}
            {activeTab === 'ai-suggestions' && (
              <motion.div
                key="ai-suggestions"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AiSuggestionsModule
                  resumeId={resume.id}
                  candidateName={resume.candidateName}
                  targetRole={resume.targetRole}
                />
              </motion.div>
            )}

            {/* View 3: ATS Score Breakdown */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
            
            {/* Top Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              
              {/* ATS Compatibility Score */}
              <div className="p-3.5 bg-[#4F7CFF]/5 border border-[#EEF2F7] rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-[#4F7CFF]/20">
                  {resume.atsScore}
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">ATS Score</p>
                  <p className="text-xs font-black text-[#1F2937]">
                    {resume.category || (resume.atsScore >= 85 ? 'Top Candidate' : resume.atsScore >= 70 ? 'Excellent' : 'Needs Work')}
                  </p>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="p-3.5 bg-[#8B7CFF]/10 border border-[#EEF2F7] rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#8B7CFF] text-white font-black text-lg flex items-center justify-center shrink-0">
                  {resume.confidence || 95}%
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">Confidence</p>
                  <p className="text-xs font-black text-[#1F2937]">Parser Reliability</p>
                </div>
              </div>

              {/* Job Match Score */}
              <div className="p-3.5 bg-[#4F7CFF]/5 border border-[#EEF2F7] rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white font-black text-lg flex items-center justify-center shrink-0">
                  {resume.matchScore}%
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">Role Match</p>
                  <p className="text-xs font-black text-[#1F2937]">
                    {resume.matchScore >= 80 ? 'Strong Alignment' : 'Keyword Gap'}
                  </p>
                </div>
              </div>

              {/* Parser Status */}
              <div className="p-3.5 bg-[#7EDCC3]/15 border border-[#EEF2F7] rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1F2937] text-white font-black text-lg flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-[#7EDCC3]" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">ATS Status</p>
                  <p className="text-xs font-black text-[#1F2937]">Workday Ready</p>
                </div>
              </div>

            </div>

            {/* 8 Weighted Section Scores Grid */}
            <div className="p-5 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[#4F7CFF]" />
                  Weighted ATS Criteria Breakdown (100% Total)
                </h4>
                <span className="text-[11px] font-semibold text-[#6B7280]">Hybrid Rule + AI Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { label: 'Resume Parsing & Contact', weight: '10%', score: resume.sectionScores?.parsing ?? 88 },
                  { label: 'ATS Formatting & Layout', weight: '15%', score: resume.sectionScores?.formatting ?? 85 },
                  { label: 'Keyword Match & Context', weight: '25%', score: resume.sectionScores?.keywords ?? 82 },
                  { label: 'Skills & Competencies', weight: '20%', score: resume.sectionScores?.skills ?? 84 },
                  { label: 'Work Experience & Impact', weight: '15%', score: resume.sectionScores?.experience ?? 80 },
                  { label: 'Projects & Practical Proof', weight: '10%', score: resume.sectionScores?.projects ?? 86 },
                  { label: 'Grammar & Professional Tone', weight: '5%', score: resume.sectionScores?.grammar ?? 92 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-2xl border border-[#EEF2F7] space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-[#1F2937]">{item.label} <span className="text-[10px] font-semibold text-[#6B7280]">({item.weight})</span></span>
                      <span className="font-black text-[#4F7CFF]">{item.score}/100</span>
                    </div>
                    <div className="w-full bg-[#EEF2F7] h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          item.score >= 85
                            ? 'bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF]'
                            : item.score >= 70
                            ? 'bg-[#4F7CFF]'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Sections Audit */}
            {missingSections.length > 0 && (
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <h4 className="text-xs font-black text-[#FF6B6B] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#FF6B6B]" />
                  Missing Core Resume Sections ({missingSections.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {missingSections.map((sec, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-rose-200 rounded-xl text-xs font-extrabold text-[#FF6B6B] shadow-2xs">
                      ⚠️ {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Strengths */}
            <div className="p-4.5 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-2.5">
              <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7EDCC3]" />
                Resume Strengths ({strengths.length})
              </h4>
              <ul className="space-y-1.5">
                {strengths.map((str, i) => (
                  <li key={i} className="text-xs text-[#1F2937] font-extrabold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7EDCC3] shrink-0"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Skills */}
            <div className="p-4.5 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-2.5">
              <h4 className="text-xs font-black text-[#FF6B6B] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#FF6B6B]" />
                Missing Skills ({missingSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white border border-rose-200 rounded-xl text-xs font-extrabold text-[#FF6B6B] shadow-2xs"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="p-4.5 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-2.5">
              <h4 className="text-xs font-black text-[#4F7CFF] uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#4F7CFF]" />
                Improvement Suggestions ({suggestions.length})
              </h4>
              <ul className="space-y-1.5">
                {suggestions.map((sug, i) => (
                  <li key={i} className="text-xs text-[#1F2937] font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F7CFF] shrink-0" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Roles */}
            <div className="p-4.5 bg-[#EEF2F7]/30 rounded-2xl border border-[#EEF2F7] space-y-2.5">
              <h4 className="text-xs font-black text-[#8B7CFF] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#8B7CFF]" />
                Recommended Roles ({recommendedRoles.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {recommendedRoles.map((role, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1 bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 rounded-xl text-xs font-black text-[#1F2937] shadow-2xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#EEF2F7]/30 border-t border-[#EEF2F7] flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#EEF2F7]/50 text-[#1F2937] font-extrabold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4.5 py-2 bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF] hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#4F7CFF]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF Breakdown</span>
            </button>
          </div>
        </div>

      </motion.div>

    </motion.div>
  );
};

