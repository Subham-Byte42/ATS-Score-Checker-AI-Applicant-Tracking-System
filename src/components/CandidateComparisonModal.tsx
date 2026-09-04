import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Folder, 
  Sparkles, 
  Download, 
  UserCheck, 
  FileText,
  BarChart3,
  TrendingUp,
  Layers
} from 'lucide-react';
import { ResumeRecord, DetailedSectionScores } from '../types';

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: ResumeRecord[];
  allCandidates?: ResumeRecord[];
  folderName?: string;
  onSelectCandidate?: (candidate: ResumeRecord) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  isOpen,
  onClose,
  candidates = [],
  allCandidates = [],
  folderName,
  onSelectCandidate
}) => {
  const pool = React.useMemo(() => {
    const raw = allCandidates.length > 0 ? allCandidates : candidates;
    if (!folderName || folderName === 'All') return raw;
    const inFolder = raw.filter((c) => {
      const f = c.folderName || (c.targetRole ? `${c.targetRole} Cohort` : 'General Candidates');
      return f === folderName || c.targetRole === folderName;
    });
    return inFolder.length > 0 ? inFolder : raw;
  }, [allCandidates, candidates, folderName]);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initialPool = (!folderName || folderName === 'All') 
      ? (allCandidates.length > 0 ? allCandidates : candidates)
      : (allCandidates.length > 0 ? allCandidates : candidates).filter((c) => {
          const f = c.folderName || (c.targetRole ? `${c.targetRole} Cohort` : 'General Candidates');
          return f === folderName || c.targetRole === folderName;
        });
    const effectiveCandidates = candidates.filter(c => initialPool.some(p => p.id === c.id));
    return (effectiveCandidates.length > 0 ? effectiveCandidates : initialPool).slice(0, 4).map(c => c.id);
  });

  // Keep selected IDs in sync when candidate list or folder changes
  React.useEffect(() => {
    if (pool.length > 0) {
      const validSelected = candidates.filter(c => pool.some(p => p.id === c.id));
      if (validSelected.length > 0) {
        setSelectedIds(validSelected.slice(0, 4).map(c => c.id));
      } else {
        setSelectedIds(pool.slice(0, 4).map(c => c.id));
      }
    }
  }, [candidates, pool]);

  if (!isOpen) return null;

  const activeCandidates = pool.filter(c => selectedIds.includes(c.id));

  // Determine highest score candidate
  const topCandidate = activeCandidates.length > 0
    ? [...activeCandidates].sort((a, b) => b.atsScore - a.atsScore)[0]
    : null;

  const toggleCandidateSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  const getFitBadge = (rating?: string, ats = 80) => {
    const effectiveRating = rating || (
      ats >= 88 ? 'Strong Hire' :
      ats >= 76 ? 'Lean Hire' :
      ats >= 60 ? 'Review' : 'Pass'
    );

    switch (effectiveRating) {
      case 'Strong Hire':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Strong Hire
          </span>
        );
      case 'Lean Hire':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Lean Hire
          </span>
        );
      case 'Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Pass
          </span>
        );
    }
  };

  const sectionKeys: Array<{ key: keyof DetailedSectionScores; label: string }> = [
    { key: 'parsing', label: 'Parsing' },
    { key: 'formatting', label: 'Formatting' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'skills', label: 'Skills' },
    { key: 'experience', label: 'Experience' },
    { key: 'projects', label: 'Projects' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-black">
              <Users className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Side-by-Side Comparison
                </span>
                {folderName && (
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-teal-400" />
                    {folderName}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                Candidate Cohort Comparison Tool
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Selector Bar (if pool has more than 2 candidates) */}
        {pool.length > 2 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
              Select Candidates (up to 4):
            </span>
            {pool.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCandidateSelection(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-300'}`} />
                  <span>{c.candidateName}</span>
                  <span className="text-[10px] opacity-80">({c.atsScore}%)</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Comparison Body - Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeCandidates.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No candidates selected for comparison.</p>
              <p className="text-xs text-slate-400 mt-1">Select at least 2 candidates above to view comparative analytics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
              {activeCandidates.map((c) => {
                const isTop = topCandidate && topCandidate.id === c.id && activeCandidates.length > 1;
                const rec = c.recruiterEvaluation;
                const sections = c.sectionScores || {
                  parsing: c.atsScore,
                  formatting: c.atsScore - 2,
                  keywords: c.matchScore || c.atsScore,
                  skills: c.atsScore,
                  experience: c.atsScore - 4,
                  projects: c.atsScore - 1,
                  grammar: 90
                };

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-5 space-y-5 transition-all relative ${
                      isTop
                        ? 'bg-teal-50/40 border-teal-300 shadow-md ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {/* Top Winner Pill */}
                    {isTop && (
                      <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Award className="w-3 h-3" /> Highest ATS Score
                      </div>
                    )}

                    {/* Candidate Name & Folder Info */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-900 truncate">
                          {c.candidateName}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 truncate mt-0.5">
                          {c.targetRole}
                        </p>
                        {c.folderName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md mt-1.5">
                            <Folder className="w-3 h-3 text-teal-600" />
                            {c.folderName}
                          </span>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center font-black text-sm shrink-0">
                        {c.candidateName ? c.candidateName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    </div>

                    {/* Primary Metrics */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          ATS Score
                        </span>
                        <span className={`text-2xl font-black ${
                          c.atsScore >= 85 ? 'text-teal-600' : c.atsScore >= 70 ? 'text-indigo-600' : 'text-amber-600'
                        }`}>
                          {c.atsScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Job Match
                        </span>
                        <span className="text-2xl font-black text-slate-900">
                          {c.matchScore}%
                        </span>
                      </div>
                    </div>

                    {/* Fit Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">Recruiter Fit:</span>
                      {getFitBadge(rec?.fitRating, c.atsScore)}
                    </div>

                    {/* Section Scores Bar Comparison */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Detailed Competencies
                      </span>
                      <div className="space-y-1.5">
                        {sectionKeys.map((sec) => {
                          const val = (sections as any)[sec.key] || 80;
                          return (
                            <div key={sec.key} className="space-y-0.5">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>{sec.label}</span>
                                <span className="font-extrabold text-slate-900">{val}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    val >= 85 ? 'bg-teal-600' : val >= 75 ? 'bg-indigo-600' : 'bg-amber-500'
                                  }`} 
                                  style={{ width: `${val}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Strengths */}
                    {c.strengths && c.strengths.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Key Strengths
                        </span>
                        <ul className="text-[11px] text-slate-700 font-semibold space-y-1">
                          {c.strengths.slice(0, 2).map((st, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {c.missingSkills && c.missingSkills.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
                          Missing Qualifications
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {c.missingSkills.slice(0, 3).map((sk, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-md">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectCandidate) {
                            onSelectCandidate(c);
                            onClose();
                          }
                        }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                        <span>View Full Scorecard</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Comparing <strong className="text-slate-900">{activeCandidates.length}</strong> candidate{activeCandidates.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </motion.div>
    </div>
  );
};
