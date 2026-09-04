import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeRecord, CandidateFitRating } from '../types';
import { downloadResumePDF } from '../utils/pdfExport';
import { SkillMatchBarChart } from './SkillMatchBarChart';
import { CandidateComparisonModal } from './CandidateComparisonModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  Table as TableIcon,
  Layers,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Folder,
  FolderOpen,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';

interface ResumeTableProps {
  resumes: ResumeRecord[];
  userRole?: 'personal' | 'recruiter';
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
}

export const ResumeTable: React.FC<ResumeTableProps> = ({
  resumes = [],
  userRole = 'personal',
  onSelectResume,
  onDeleteResume
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'graph' | 'trend'>('table');
  const [selectedCandidateForChart, setSelectedCandidateForChart] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterFit, setFilterFit] = useState<string>('All');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const safeResumes = Array.isArray(resumes) ? resumes : [];

  // Group resumes categorically by Folder Name
  const folderCategories = useMemo(() => {
    const map: Record<string, { count: number; avgAts: number }> = {};
    safeResumes.forEach((r) => {
      const fName = r.folderName || (r.targetRole ? `${r.targetRole} Cohort` : 'General Candidates');
      if (!map[fName]) {
        map[fName] = { count: 0, avgAts: 0 };
      }
      map[fName].count += 1;
      map[fName].avgAts += r.atsScore || 0;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      avgAts: Math.round(data.avgAts / data.count)
    }));
  }, [safeResumes]);

  // Candidates strictly belonging to the currently selected folder
  const currentFolderCandidates = useMemo(() => {
    if (selectedFolder === 'All') return safeResumes;
    return safeResumes.filter((r) => {
      const fName = r.folderName || (r.targetRole ? `${r.targetRole} Cohort` : 'General Candidates');
      return fName === selectedFolder;
    });
  }, [safeResumes, selectedFolder]);

  const filteredResumes = useMemo(() => {
    return currentFolderCandidates.filter((r) => {
      const candidateName = r.candidateName || '';
      const targetRole = r.targetRole || '';
      const fileName = r.fileName || '';
      const resumeFolder = r.folderName || (r.targetRole ? `${r.targetRole} Cohort` : 'General Candidates');

      const matchesSearch =
        candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resumeFolder.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        filterStatus === 'All' || r.status === filterStatus;

      const currentFit = r.recruiterEvaluation?.fitRating || (
        r.atsScore >= 88 ? 'Strong Hire' :
        r.atsScore >= 76 ? 'Lean Hire' :
        r.atsScore >= 60 ? 'Review' : 'Pass'
      );
      const matchesFit =
        filterFit === 'All' || currentFit === filterFit;

      return matchesSearch && matchesStatus && matchesFit;
    });
  }, [currentFolderCandidates, searchTerm, filterStatus, filterFit]);

  // Candidates for comparison strictly from this selected folder
  const candidatesForComparison = useMemo(() => {
    if (selectedCandidateIds.length > 0) {
      const matched = currentFolderCandidates.filter(r => selectedCandidateIds.includes(r.id));
      if (matched.length > 0) return matched;
    }
    return currentFolderCandidates.slice(0, 4);
  }, [selectedCandidateIds, currentFolderCandidates]);

  // Synchronize selection when folder changes
  useEffect(() => {
    setSelectedCandidateIds(prev => prev.filter(id => currentFolderCandidates.some(c => c.id === id)));
    if (currentFolderCandidates.length > 0) {
      if (!currentFolderCandidates.some(c => c.id === selectedCandidateForChart)) {
        setSelectedCandidateForChart(currentFolderCandidates[0].id);
      }
    }
  }, [selectedFolder, currentFolderCandidates, selectedCandidateForChart]);

  const toggleSelectCandidate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInView = () => {
    if (selectedCandidateIds.length === filteredResumes.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredResumes.map(r => r.id));
    }
  };

  const activeGraphResume = currentFolderCandidates.find(r => r.id === selectedCandidateForChart) || currentFolderCandidates[0] || safeResumes[0];

  const trendData = useMemo(() => {
    return [...currentFolderCandidates].reverse().map((r, idx) => ({
      label: r.uploadDate ? String(r.uploadDate).split(',')[0] : `Scan #${idx + 1}`,
      atsScore: r.atsScore ?? 80,
      matchScore: r.matchScore ?? 75,
      candidateName: r.candidateName || 'Candidate',
      role: r.targetRole || 'Software Engineer',
    }));
  }, [currentFolderCandidates]);

  const getFitBadge = (rating?: CandidateFitRating, ats = 80) => {
    const effectiveRating = rating || (
      ats >= 88 ? 'Strong Hire' :
      ats >= 76 ? 'Lean Hire' :
      ats >= 60 ? 'Review' : 'Pass'
    );

    switch (effectiveRating) {
      case 'Strong Hire':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Strong Hire
          </span>
        );
      case 'Lean Hire':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Lean Hire
          </span>
        );
      case 'Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Review
          </span>
        );
      case 'Pass':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Pass
          </span>
        );
    }
  };

  const getStatusBadge = (status: ResumeRecord['status']) => {
    switch (status) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#7EDCC3]/20 text-[#1F2937] border border-[#7EDCC3]/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1F2937]" /> Excellent
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4F7CFF]" /> Good
          </span>
        );
      case 'Needs Improvement':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-[#FF6B6B] border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-[#FF6B6B]" /> Needs Fix
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#EEF2F7] text-[#6B7280] border border-[#EEF2F7]">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Pipeline Summary Bar */}
      <div className="bg-white rounded-[20px] border border-[#EEF2F7] p-5 sm:p-6 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-[#1F2937] flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-[#4F7CFF]/10 text-[#4F7CFF] rounded-xl">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            Scanned Resumes & Candidate Pipeline
          </h3>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            Organized folder cohorts, candidate benchmarks, ATS scores, and side-by-side graphical comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            Total Scanned: <strong className="text-slate-900 font-black">{safeResumes.length}</strong>
          </span>
          <span className="px-3 py-1.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-200/80">
            In Active View: <strong className="text-teal-950 font-black">{filteredResumes.length}</strong>
          </span>
        </div>
      </div>

      {/* Folder Name & Dropdown Section with Right-Aligned View Buttons (Skill Match Bar Chart, Table, Trends, Compare) - RECRUITER ONLY */}
      {userRole === 'recruiter' && (
        <div 
          id="folder-controls-section"
          className="bg-white rounded-[20px] border border-[#EEF2F7] p-4 sm:p-5 soft-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          {/* Left: ONLY the folder name and a dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-2xl border border-slate-200 shadow-2xs">
              <Folder className="w-4 h-4 text-teal-600 shrink-0" />
              <label htmlFor="folder-select-dropdown" className="text-xs font-black text-slate-700 whitespace-nowrap">
                Folder Name:
              </label>
              <select
                id="folder-select-dropdown"
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  setSelectedCandidateIds([]);
                }}
                className="bg-white text-xs font-black text-slate-900 py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs font-sans min-w-[190px] max-w-[280px] truncate"
                title="Select a folder cohort to view and compare its candidates"
              >
                <option value="All">All Folders ({safeResumes.length} candidates)</option>
                {folderCategories.map((fc) => (
                  <option key={fc.name} value={fc.name}>
                    {fc.name} ({fc.count} candidates)
                  </option>
                ))}
              </select>
            </div>

            {/* Current Active Folder Name Display */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-teal-50 text-teal-900 border border-teal-200/80 text-xs font-black shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
              <span className="text-teal-700 font-extrabold">Folder:</span>
              <span className="font-black text-slate-900 truncate max-w-[200px]">
                {selectedFolder === 'All' ? 'All Candidates' : selectedFolder}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-black shrink-0">
                {currentFolderCandidates.length} candidate{currentFolderCandidates.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Right: Buttons such that Skill Match Bar Chart, Table View, Score Trends, and Compare Candidates */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
              <button
                id="btn-table-view"
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to table candidate list"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>

              <button
                id="btn-skill-match-chart"
                type="button"
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'graph'
                    ? 'bg-white text-teal-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Skill Match Bar Chart for this folder"
              >
                <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Skill Match Bar Chart</span>
              </button>
            </div>

            {/* Quick Compare Candidates Action Button */}
            <button
              id="btn-compare-candidates"
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              title={
                selectedFolder !== 'All'
                  ? `Compare candidates in ${selectedFolder}`
                  : 'Compare candidates side-by-side'
              }
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>
                {selectedCandidateIds.length > 0
                  ? `Compare Selected (${selectedCandidateIds.length})`
                  : selectedFolder !== 'All'
                  ? `Compare Folder Candidates (${currentFolderCandidates.length})`
                  : `Compare Candidates (${currentFolderCandidates.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Candidates Floating Action Bar */}
      {selectedCandidateIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-slate-800"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span>
              <strong className="text-white">{selectedCandidateIds.length}</strong> candidate{selectedCandidateIds.length > 1 ? 's' : ''} selected for comparison
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCandidateIds([])}
              className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Compare Selected Candidates</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* View 1: Skill Match Bar Chart Mode */}
      {viewMode === 'graph' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentFolderCandidates.length > 0 ? (
            <SkillMatchBarChart
              resume={activeGraphResume}
              resumes={currentFolderCandidates}
              title={`Skill Set & Compatibility: ${selectedFolder === 'All' ? 'All Candidates' : selectedFolder}`}
              subtitle={`Plotted comparison of technical skill domains and competencies for candidates in ${selectedFolder === 'All' ? 'all cohorts' : selectedFolder}.`}
              showCandidateSelector={true}
              onSelectResume={(r) => {
                setSelectedCandidateForChart(r.id);
              }}
            />
          ) : (
            <div className="bg-white rounded-[24px] border border-slate-200 p-12 text-center space-y-3">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-black text-slate-900">No Resumes in This Folder</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Upload or assign resumes to {selectedFolder} to view candidate skill match bar charts.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* View 2: Score Trends Area Chart Mode */}
      {viewMode === 'trend' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Historical Score & Match Rate Trends
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Visual timeline tracking ATS score improvements and keyword match evolution across uploads.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                <span className="text-slate-800">ATS Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                <span className="text-slate-800">Job Match %</span>
              </div>
            </div>
          </div>

          {trendData.length > 0 ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="atsHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="matchHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
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
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="atsScore" 
                    name="ATS Score (%)" 
                    stroke="#0D9488" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#atsHistoryGradient)" 
                    activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="matchScore" 
                    name="Job Match (%)" 
                    stroke="#0F172A" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#matchHistoryGradient)" 
                    activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-bold">
              No historical trend data available.
            </div>
          )}
        </motion.div>
      )}

      {/* View 3: Standard Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-[20px] border border-[#EEF2F7] soft-shadow overflow-hidden">
          
          {/* Table Header Filter Controls */}
          <div className="p-4 sm:p-5 border-b border-[#EEF2F7] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search candidate, job title, or file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#EEF2F7] rounded-2xl text-xs font-bold text-[#1F2937] placeholder-[#6B7280] focus:outline-hidden focus:border-[#4F7CFF] transition-all"
                />
              </div>

              {/* Status or Fit filter buttons */}
              {userRole === 'recruiter' ? (
                <div className="flex items-center p-1 bg-white rounded-2xl border border-[#EEF2F7] flex-wrap gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Fit:</span>
                  {['All', 'Strong Hire', 'Lean Hire', 'Review', 'Pass'].map((fit) => (
                    <button
                      key={fit}
                      onClick={() => setFilterFit(fit)}
                      className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        filterFit === fit
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center p-1 bg-white rounded-2xl border border-[#EEF2F7]">
                  {['All', 'Excellent', 'Good', 'Needs Improvement'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      {st === 'Needs Improvement' ? 'Needs Fix' : st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF2F7]/40 border-b border-[#EEF2F7] text-[11px] font-black text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredResumes.length > 0 && selectedCandidateIds.length === filteredResumes.length}
                      onChange={handleSelectAllInView}
                      className="rounded border-slate-300 text-slate-900 focus:ring-teal-500 cursor-pointer"
                      title="Select all in view"
                    />
                  </th>
                  <th className="py-3.5 px-4">Candidate & File</th>
                  <th className="py-3.5 px-4">Folder Name</th>
                  <th className="py-3.5 px-4">Target Position</th>
                  <th className="py-3.5 px-4 text-center">ATS Score</th>
                  <th className="py-3.5 px-4">Job Match %</th>
                  <th className="py-3.5 px-4">{userRole === 'recruiter' ? 'Fit Rating' : 'Status'}</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions & Screening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7] text-xs font-semibold">
                {filteredResumes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#6B7280] font-bold">
                      No matching candidate resumes found.
                    </td>
                  </tr>
                ) : (
                  filteredResumes.map((resume, idx) => (
                    <motion.tr
                      key={resume.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className={`transition-colors group ${
                        selectedCandidateIds.includes(resume.id) ? 'bg-teal-50/40' : 'hover:bg-[#4F7CFF]/5'
                      }`}
                    >
                      {/* Checkbox for selection */}
                      <td className="py-4 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(resume.id)}
                          onChange={(e) => toggleSelectCandidate(resume.id, e as any)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-teal-500 cursor-pointer"
                          title="Select candidate for comparison"
                        />
                      </td>

                      {/* Candidate Name & File */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center shrink-0 font-extrabold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-[#1F2937] truncate">
                              {resume.candidateName}
                            </p>
                            <p className="text-[11px] text-[#6B7280] font-medium truncate mt-0.5">
                              {resume.fileName} • {resume.fileSize}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Folder Name */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                          <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {resume.folderName || (resume.targetRole ? `${resume.targetRole} Cohort` : 'General')}
                          </span>
                        </span>
                      </td>

                      {/* Target Role */}
                      <td className="py-4 px-4 text-[#1F2937] font-bold">
                        {resume.targetRole}
                      </td>

                      {/* ATS Score */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl font-black text-xs ${
                            resume.atsScore >= 90
                              ? 'bg-[#7EDCC3]/20 text-[#1F2937] border border-[#7EDCC3]/30'
                              : resume.atsScore >= 75
                              ? 'bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20'
                              : 'bg-rose-50 text-[#FF6B6B] border border-rose-200'
                          }`}
                        >
                          {resume.atsScore}
                        </span>
                      </td>

                      {/* Match % progress bar */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5 w-32">
                          <div className="flex justify-between text-[11px] font-extrabold text-[#1F2937]">
                            <span>Match Rate</span>
                            <span>{resume.matchScore}%</span>
                          </div>
                          <div className="w-full bg-[#EEF2F7] rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${resume.matchScore}%` }}
                              transition={{ duration: 0.6, delay: 0.1 + idx * 0.05, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                resume.matchScore >= 85
                                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600'
                                  : resume.matchScore >= 70
                                  ? 'bg-[#4F7CFF]'
                                  : 'bg-amber-400'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status / Fit Rating */}
                      <td className="py-4 px-5">
                        {userRole === 'recruiter' 
                          ? getFitBadge(resume.recruiterEvaluation?.fitRating, resume.atsScore)
                          : getStatusBadge(resume.status)
                        }
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-[#6B7280] text-[11px] font-bold">
                        {resume.uploadDate}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {userRole === 'recruiter' ? (
                            <button
                              onClick={() => onSelectResume(resume)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              title="Screen Candidate"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                              <span>Screen</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCandidateForChart(resume.id);
                                setViewMode('graph');
                              }}
                              className="px-2.5 py-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                              title="View Skill Set Bar Chart"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                              <span>Skill Graph</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectResume(resume)}
                            className="p-2 text-[#6B7280] hover:text-[#4F7CFF] hover:bg-[#4F7CFF]/10 rounded-xl transition-colors cursor-pointer"
                            title="View Full AI Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => downloadResumePDF(resume)}
                            className="p-2 text-[#6B7280] hover:text-[#7EDCC3] hover:bg-[#7EDCC3]/10 rounded-xl transition-colors cursor-pointer"
                            title="Export PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Quick Row Compare Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelectCandidate(resume.id, e)}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              selectedCandidateIds.includes(resume.id)
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title={selectedCandidateIds.includes(resume.id) ? 'Deselect from comparison' : 'Select to compare'}
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteResume(resume.id)}
                            className="p-2 text-[#6B7280] hover:text-[#FF6B6B] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-[#EEF2F7]/30 border-t border-[#EEF2F7] flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Showing <strong className="text-[#1F2937]">{filteredResumes.length}</strong> of <strong className="text-[#1F2937]">{safeResumes.length}</strong> scanned resumes</span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 bg-white border border-[#EEF2F7] rounded-xl text-[#1F2937] hover:bg-[#EEF2F7]/50 font-bold cursor-pointer">
                Previous
              </button>
              <span className="px-3 py-1.5 bg-slate-900 text-white font-black rounded-xl">1</span>
              <button className="px-3 py-1.5 bg-white border border-[#EEF2F7] rounded-xl text-[#1F2937] hover:bg-[#EEF2F7]/50 font-bold cursor-pointer">
                Next
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        candidates={candidatesForComparison}
        allCandidates={currentFolderCandidates}
        folderName={selectedFolder !== 'All' ? selectedFolder : undefined}
        onSelectCandidate={(c) => {
          onSelectResume(c);
        }}
      />

    </div>
  );
};

