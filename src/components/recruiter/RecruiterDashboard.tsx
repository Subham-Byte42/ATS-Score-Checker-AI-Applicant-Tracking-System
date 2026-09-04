import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  CheckCircle2, 
  Upload, 
  Sparkles, 
  History,
  BarChart3,
  Users,
  Folder,
  CheckSquare,
  Square,
  Maximize2,
  SlidersHorizontal,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';
import { ResumeRecord } from '../../types';
import { Sidebar, SidebarNavId } from '../Sidebar';
import { ResumeTable } from '../ResumeTable';
import { ResumeUploadForm } from '../ResumeUploadForm';
import { AiChatbotModule } from '../AiChatbotModule';
import { SkillMatchBarChart } from '../SkillMatchBarChart';
import { CandidateComparisonModal } from '../CandidateComparisonModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export interface RecruiterDashboardProps {
  user: { name: string; email: string };
  resumes: ResumeRecord[];
  onBack?: () => void;
  onAnalyzeNewResume: (record: ResumeRecord) => void;
  onAnalyzeBatch?: (records: ResumeRecord[]) => void;
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onLogout: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  user,
  resumes = [],
  onBack,
  onAnalyzeNewResume,
  onAnalyzeBatch,
  onSelectResume,
  onDeleteResume,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<SidebarNavId>('home');

  const handleGoBack = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    } else if (onBack) {
      onBack();
    }
  };

  const safeResumes = resumes || [];

  // Recruiter Graphical Comparison & Cohort Filters
  const [comparisonViewType, setComparisonViewType] = useState<'overview' | 'competencies'>('overview');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('All');
  const [selectedComparisonCandidateIds, setSelectedComparisonCandidateIds] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);

  // Categorical Folders present in resumes
  const availableFolders = useMemo(() => {
    const set = new Set<string>();
    safeResumes.forEach(r => {
      const f = r.folderName || (r.targetRole ? `${r.targetRole} Cohort` : 'General Candidates');
      set.add(f);
    });
    return Array.from(set);
  }, [safeResumes]);

  // Folder filtered candidates
  const folderFilteredResumes = useMemo(() => {
    if (selectedFolderFilter === 'All') return safeResumes;
    return safeResumes.filter(r => {
      const f = r.folderName || (r.targetRole ? `${r.targetRole} Cohort` : 'General Candidates');
      return f === selectedFolderFilter;
    });
  }, [safeResumes, selectedFolderFilter]);

  // Candidates currently plotted in Graphical Comparison (max 5, strictly from active folder)
  const candidatesForGraphicalComparison = useMemo(() => {
    if (selectedComparisonCandidateIds.length > 0) {
      const matched = folderFilteredResumes.filter(r => selectedComparisonCandidateIds.includes(r.id));
      if (matched.length > 0) return matched;
    }
    return folderFilteredResumes.slice(0, 5);
  }, [folderFilteredResumes, selectedComparisonCandidateIds]);

  // Reset comparison candidate selections when folder changes
  useEffect(() => {
    setSelectedComparisonCandidateIds([]);
  }, [selectedFolderFilter]);

  // Overview grouped bar data (ATS Score, Job Match, Skills Score)
  const comparisonBarData = useMemo(() => {
    return candidatesForGraphicalComparison.map((c, idx) => {
      const displayName = c.candidateName 
        ? (c.candidateName.length > 14 ? c.candidateName.slice(0, 12) + '…' : c.candidateName)
        : `Candidate #${idx + 1}`;
      return {
        id: c.id,
        name: c.candidateName || `Candidate #${idx + 1}`,
        displayName,
        targetRole: c.targetRole || 'Software Engineer',
        folder: c.folderName || (c.targetRole ? `${c.targetRole} Cohort` : 'General'),
        atsScore: c.atsScore ?? 0,
        matchScore: c.matchScore ?? c.atsScore ?? 0,
        skillsScore: c.sectionScores?.skills ?? (c.atsScore ? Math.min(100, Math.max(40, c.atsScore + 3)) : 78),
        experienceScore: c.sectionScores?.experience ?? (c.atsScore ? Math.min(100, Math.max(40, c.atsScore - 5)) : 72),
        fitRating: c.recruiterEvaluation?.fitRating || (c.atsScore && c.atsScore >= 88 ? 'Strong Hire' : 'Lean Hire'),
      };
    });
  }, [candidatesForGraphicalComparison]);

  // Distinct series colors for multi-candidate competency breakdown
  const CANDIDATE_SERIES_COLORS = [
    '#0D9488', // Teal
    '#4F46E5', // Indigo
    '#0F172A', // Slate 900
    '#D97706', // Amber
    '#2563EB', // Blue
  ];

  // Detailed Competency breakdown across 6 core dimensions
  const competencyComparisonData = useMemo(() => {
    const metrics = [
      { key: 'ats', label: 'ATS Score' },
      { key: 'match', label: 'Job Match' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'formatting', label: 'Formatting' },
      { key: 'parsing', label: 'Parsing' },
    ];

    return metrics.map(m => {
      const row: Record<string, any> = { metric: m.label };
      candidatesForGraphicalComparison.forEach((c, idx) => {
        let score = 75;
        if (m.key === 'ats') score = c.atsScore ?? 80;
        else if (m.key === 'match') score = c.matchScore ?? c.atsScore ?? 75;
        else if (m.key === 'skills') score = c.sectionScores?.skills ?? (c.atsScore ? Math.min(100, c.atsScore + 2) : 78);
        else if (m.key === 'experience') score = c.sectionScores?.experience ?? (c.atsScore ? Math.max(50, c.atsScore - 5) : 72);
        else if (m.key === 'formatting') score = c.sectionScores?.formatting ?? (c.atsScore ? Math.min(100, c.atsScore + 5) : 85);
        else if (m.key === 'parsing') score = c.sectionScores?.parsing ?? (c.atsScore ? Math.min(100, c.atsScore + 8) : 90);

        row[`cand_${idx}`] = score;
        row[`cand_${idx}_name`] = c.candidateName || `Candidate ${idx + 1}`;
      });
      return row;
    });
  }, [candidatesForGraphicalComparison]);

  const toggleCandidateForComparison = (id: string) => {
    setSelectedComparisonCandidateIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      } else {
        if (prev.length >= 5) {
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalCandidates = safeResumes.length;
  const strongHires = safeResumes.filter(
    (r) => r.recruiterEvaluation?.fitRating === 'Strong Hire' || (r.atsScore ?? 0) >= 88
  ).length;
  const strongHirePercent = safeResumes.length > 0
    ? `${Math.round((strongHires / safeResumes.length) * 100)}%`
    : '0%';
  const avgAtsScore = safeResumes.length > 0
    ? `${Math.round(safeResumes.reduce((acc, curr) => acc + (curr.atsScore ?? 0), 0) / safeResumes.length)}%`
    : '0%';
  const readyToInterview = safeResumes.filter(
    (r) => r.recruiterEvaluation?.fitRating === 'Strong Hire' || r.recruiterEvaluation?.fitRating === 'Lean Hire' || (r.atsScore ?? 0) >= 76
  ).length;

  const mostRecentResume = safeResumes.length > 0 ? safeResumes[0] : undefined;

  return (
    <div className="flex flex-col md:flex-row items-start gap-6 animate-in fade-in duration-300 min-h-screen">
      {/* Dedicated Recruiter Sidebar Navigation */}
      <Sidebar
        activeItem={activeTab}
        onSelectItem={setActiveTab}
        onLogout={onLogout}
        onBack={handleGoBack}
      />

      {/* Main Recruiter Content Area */}
      <div className="flex-1 w-full space-y-8 min-w-0">
        <AnimatePresence mode="wait">
          
          {/* Overview Dashboard Tab */}
          {activeTab === 'home' && (
            <motion.div
              key="recruiter-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Header Greeting Banner */}
              <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 z-10 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-extrabold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recruiter & HR Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {getGreeting()}, {user?.name || 'Recruiter'}!
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                    Evaluate applicant cohorts, audit ATS match compatibility, compare top contenders side-by-side, and accelerate candidate shortlisting.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center flex-wrap">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>Screen New Candidate</span>
                  </button>
                </div>
              </div>

              {/* Recruiter Stats Overview Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Candidates Screened */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Candidates Screened
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {totalCandidates}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* Strong Fit Ratio */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-teal-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Strong Fit Ratio
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-teal-600 tracking-tight">
                      {strongHirePercent}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-extrabold">
                    <Award className="w-6 h-6 text-teal-600" />
                  </div>
                </div>

                {/* Avg. ATS Compatibility */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Avg. ATS Compatibility
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {avgAtsScore}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Interview Shortlist */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] transition-all flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Interview Shortlist
                    </p>
                    <p className="text-sm font-black text-slate-900 truncate" title={`${readyToInterview} Candidates Ready`}>
                      {readyToInterview} Candidates
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>

              {/* Skill Match Bar Chart for Recent Candidate */}
              {safeResumes.length > 0 ? (
                <SkillMatchBarChart
                  resume={mostRecentResume}
                  resumes={safeResumes}
                  title="Recent Candidate: Skill Set Match & Competency Graph"
                  subtitle="Visual bar chart analysis plotting candidate matching percentages across technical domains for your latest scan."
                  showCandidateSelector={true}
                  onSelectResume={onSelectResume}
                />
              ) : (
                <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] text-center space-y-3">
                  <BarChart3 className="w-10 h-10 text-teal-600 mx-auto" />
                  <h3 className="text-lg font-black text-slate-900">No Candidate Resumes Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                    Upload candidate resumes to instantly generate the Skill Set Match Bar Chart and candidate comparison analytics.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-400" />
                    Screen First Candidate
                  </button>
                </div>
              )}

              {/* Candidate Graphical Comparison Section */}
              <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] space-y-6">
                {/* Header with Title, Folder Filter, and View Toggles */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      Candidate Graphical Comparison
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Side-by-side graphical benchmark comparing applicant competencies across cohorts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Folder Filter Pill Dropdown */}
                    {availableFolders.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700">
                        <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-[11px] text-slate-400 font-extrabold uppercase">Cohort:</span>
                        <select
                          value={selectedFolderFilter}
                          onChange={(e) => setSelectedFolderFilter(e.target.value)}
                          className="bg-transparent text-xs font-black text-slate-900 focus:outline-hidden cursor-pointer"
                        >
                          <option value="All">All Folders ({safeResumes.length})</option>
                          {availableFolders.map(folder => (
                            <option key={folder} value={folder}>{folder}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* View Switcher (Overview vs Competencies) */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setComparisonViewType('overview')}
                        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                          comparisonViewType === 'overview'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Overview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setComparisonViewType('competencies')}
                        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                          comparisonViewType === 'competencies'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Competencies</span>
                      </button>
                    </div>

                    {/* Deep-Dive Modal Action */}
                    {candidatesForGraphicalComparison.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => setIsComparisonModalOpen(true)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Compare Details</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Candidate Selection Chips (Max 5) */}
                {folderFilteredResumes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                        Select Candidates to Plot ({candidatesForGraphicalComparison.length}/5 Plotted):
                      </span>
                      {selectedComparisonCandidateIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedComparisonCandidateIds([])}
                          className="text-[11px] font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                        >
                          Reset to Top 5
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {folderFilteredResumes.slice(0, 10).map((cand) => {
                        const isSelected = selectedComparisonCandidateIds.length > 0
                          ? selectedComparisonCandidateIds.includes(cand.id)
                          : candidatesForGraphicalComparison.some(c => c.id === cand.id);
                        return (
                          <button
                            key={cand.id}
                            type="button"
                            onClick={() => toggleCandidateForComparison(cand.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="truncate max-w-[140px]">{cand.candidateName || cand.fileName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                              isSelected ? 'bg-slate-800 text-teal-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {cand.atsScore}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Graph Visualization */}
                {candidatesForGraphicalComparison.length > 0 ? (
                  <div className="space-y-4">
                    <div className="w-full h-80 sm:h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        {comparisonViewType === 'overview' ? (
                          <BarChart
                            data={comparisonBarData}
                            margin={{ top: 20, right: 20, left: -20, bottom: 25 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                              dataKey="displayName"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                              unit="%"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#E2E8F0',
                                borderRadius: '1rem',
                                color: '#0F172A',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="atsScore" name="ATS Overall Score (%)" fill="#0D9488" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="matchScore" name="Job Keyword Match (%)" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="skillsScore" name="Technical Skills (%)" fill="#0F172A" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        ) : (
                          <BarChart
                            data={competencyComparisonData}
                            margin={{ top: 20, right: 20, left: -20, bottom: 25 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                              dataKey="metric"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                              unit="%"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#E2E8F0',
                                borderRadius: '1rem',
                                color: '#0F172A',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            {candidatesForGraphicalComparison.map((c, idx) => (
                              <Bar
                                key={c.id}
                                dataKey={`cand_${idx}`}
                                name={c.candidateName || `Candidate ${idx + 1}`}
                                fill={CANDIDATE_SERIES_COLORS[idx % CANDIDATE_SERIES_COLORS.length]}
                                radius={[6, 6, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 bg-teal-50/60 border border-teal-200/70 rounded-2xl flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 block">
                            Top ATS Contender
                          </span>
                          <p className="text-sm font-black text-slate-900 truncate">
                            {[...candidatesForGraphicalComparison].sort((a, b) => (b.atsScore ?? 0) - (a.atsScore ?? 0))[0]?.candidateName || 'N/A'}
                          </p>
                        </div>
                        <span className="text-lg font-black text-teal-700 shrink-0">
                          {[...candidatesForGraphicalComparison].sort((a, b) => (b.atsScore ?? 0) - (a.atsScore ?? 0))[0]?.atsScore ?? 0}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Plotted Cohort Avg. ATS
                          </span>
                          <p className="text-sm font-black text-slate-900">
                            {candidatesForGraphicalComparison.length > 0
                              ? Math.round(
                                  candidatesForGraphicalComparison.reduce((acc, c) => acc + (c.atsScore ?? 0), 0) /
                                    candidatesForGraphicalComparison.length
                                )
                              : 0}%
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                      </div>

                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block">
                            Highest Job Keyword Match
                          </span>
                          <p className="text-sm font-black text-slate-900 truncate">
                            {[...candidatesForGraphicalComparison].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0]?.candidateName || 'N/A'}
                          </p>
                        </div>
                        <span className="text-lg font-black text-indigo-700 shrink-0">
                          {[...candidatesForGraphicalComparison].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0]?.matchScore ?? 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-12 px-4 rounded-[20px] bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <Users className="w-10 h-10 text-teal-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">No Candidates to Compare Yet</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                      Upload candidate resumes in the "Upload Resume" tab to generate interactive side-by-side graphical comparisons.
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-400" />
                      Screen First Candidate
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Upload / Screen Candidate Tab */}
          {activeTab === 'upload' && (
            <motion.div 
              key="recruiter-upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <ResumeUploadForm 
                userRole="recruiter"
                onAnalyze={(data) => {
                  onAnalyzeNewResume(data);
                }} 
                onAnalyzeBatch={onAnalyzeBatch}
                onSelectResume={onSelectResume}
              />
            </motion.div>
          )}

          {/* AI Talent Advisor Tab */}
          {activeTab === 'suggestions' && (
            <motion.div
              key="recruiter-suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AiChatbotModule
                resumes={safeResumes}
                user={user}
                onSelectResume={onSelectResume}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            </motion.div>
          )}

          {/* Candidate Pipeline History Tab */}
          {activeTab === 'history' && (
            <motion.div 
              key="recruiter-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                      <History className="w-5 h-5 text-teal-600" />
                    </div>
                    Candidate Evaluation Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    All saved applicant evaluations, scorecards, and match reports.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-teal-400" />
                  <span>Screen Candidate Resume</span>
                </button>
              </div>

              <ResumeTable
                resumes={safeResumes}
                userRole="recruiter"
                onSelectResume={onSelectResume}
                onDeleteResume={onDeleteResume}
              />
            </motion.div>
          )}

        </AnimatePresence>

        {/* Deep Dive Candidate Comparison Modal */}
        <CandidateComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          candidates={candidatesForGraphicalComparison}
          allCandidates={folderFilteredResumes}
          folderName={selectedFolderFilter !== 'All' ? selectedFolderFilter : undefined}
          onSelectCandidate={onSelectResume}
        />
      </div>
    </div>
  );
};
