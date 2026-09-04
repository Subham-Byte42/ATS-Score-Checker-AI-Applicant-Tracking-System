import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  History,
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { ResumeRecord } from '../../types';

export interface PersonalResumeTableProps {
  resumes: ResumeRecord[];
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onViewSkills?: (resume: ResumeRecord) => void;
}

export const PersonalResumeTable: React.FC<PersonalResumeTableProps> = ({
  resumes = [],
  onSelectResume,
  onDeleteResume,
  onViewSkills
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const safeResumes = Array.isArray(resumes) ? resumes : [];

  const filteredResumes = useMemo(() => {
    return safeResumes.filter((r) => {
      const candidateName = r.candidateName || '';
      const targetRole = r.targetRole || '';
      const fileName = r.fileName || '';

      const matchesSearch =
        candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fileName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        filterStatus === 'All' || r.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [safeResumes, searchTerm, filterStatus]);

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
      {/* Top Controls & Summary Bar */}
      <div className="bg-white rounded-[20px] border border-[#EEF2F7] p-5 sm:p-6 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-[#1F2937] flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <History className="w-4.5 h-4.5 text-teal-600" />
            </div>
            Saved Resumes & Scan History
          </h3>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            View your ATS compatibility breakdowns, keyword matches, and past optimization reports.
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

      {/* Main Table Container */}
      <div className="bg-white rounded-[20px] border border-[#EEF2F7] soft-shadow overflow-hidden">
        
        {/* Table Filter Bar: Search + Status Buttons */}
        <div className="p-4 sm:p-5 border-b border-[#EEF2F7] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by target role or file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#EEF2F7] rounded-2xl text-xs font-bold text-[#1F2937] placeholder-[#6B7280] focus:outline-hidden focus:border-teal-500 transition-all"
              />
            </div>

            {/* Status Filter Buttons */}
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
          </div>
        </div>

        {/* Resumes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEF2F7]/40 border-b border-[#EEF2F7] text-[11px] font-black text-[#6B7280] uppercase tracking-wider">
                <th className="py-3.5 px-4">Resume File</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4 text-center">ATS Score</th>
                <th className="py-3.5 px-4">Job Match %</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date Scanned</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7] text-xs font-semibold">
              {filteredResumes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280] font-bold">
                    No matching resumes found in your history.
                  </td>
                </tr>
              ) : (
                filteredResumes.map((resume, idx) => (
                  <motion.tr
                    key={resume.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Resume File */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-extrabold border border-teal-100">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#1F2937] truncate">
                            {resume.fileName}
                          </p>
                          <p className="text-[11px] text-[#6B7280] font-medium truncate mt-0.5">
                            {resume.candidateName ? `${resume.candidateName} • ` : ''}{resume.fileSize}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Target Role */}
                    <td className="py-4 px-4 text-[#1F2937] font-bold">
                      {resume.targetRole || 'Not specified'}
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
                        {resume.atsScore}%
                      </span>
                    </td>

                    {/* Match % Progress */}
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

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      {getStatusBadge(resume.status)}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-[#6B7280] text-[11px] font-bold">
                      {resume.uploadDate}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Skill Graph Button */}
                        <button
                          type="button"
                          onClick={() => onViewSkills ? onViewSkills(resume) : onSelectResume(resume)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          title="Show skill graph & domain breakdown for this candidate"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Skill Graph</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectResume(resume)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="View detailed ATS score report"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-400" />
                          <span>View Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(resume.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete resume scan"
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
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">Delete Resume Scan?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete this scan from your history? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteResume(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
