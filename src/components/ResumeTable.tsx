import React, { useState } from 'react';
import { ResumeRecord } from '../types';
import { downloadResumePDF } from '../utils/pdfExport';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface ResumeTableProps {
  resumes: ResumeRecord[];
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
}

export const ResumeTable: React.FC<ResumeTableProps> = ({
  resumes = [],
  onSelectResume,
  onDeleteResume
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const safeResumes = resumes || [];

  const filteredResumes = safeResumes.filter((r) => {
    const matchesSearch =
      r.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      filterStatus === 'All' || r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ResumeRecord['status']) => {
    switch (status) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Excellent
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1877f2] border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-[#1877f2]" /> Good
          </span>
        );
      case 'Needs Improvement':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Fix Recommended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1877f2]" />
            Recent Analyzed Candidate Resumes
          </h3>
          <p className="text-xs text-[#64748B] font-medium">
            Manage, review, and filter candidate resume compatibility scores.
          </p>
        </div>

        {/* Filter and Search controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search resume..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#1877f2]"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
            {['All', 'Excellent', 'Good', 'Needs Improvement'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white text-[#1877f2] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {st === 'Needs Improvement' ? 'Needs Fix' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4">Candidate & File</th>
              <th className="py-3 px-4">Target Position</th>
              <th className="py-3 px-4 text-center">ATS Score</th>
              <th className="py-3 px-4">Job Match %</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {filteredResumes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#64748B]">
                  No matching resumes found.
                </td>
              </tr>
            ) : (
              filteredResumes.map((resume) => (
                <tr
                  key={resume.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* Candidate Name & File */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1877f2] shrink-0 font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#0F172A] truncate">
                          {resume.candidateName}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {resume.fileName} • {resume.fileSize}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Target Role */}
                  <td className="py-3.5 px-4 text-[#0F172A] font-semibold">
                    {resume.targetRole}
                  </td>

                  {/* ATS Score */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-black text-xs ${
                        resume.atsScore >= 90
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : resume.atsScore >= 75
                          ? 'bg-blue-100 text-[#1877f2] border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {resume.atsScore}
                    </span>
                  </td>

                  {/* Match % progress bar */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 w-32">
                      <div className="flex justify-between text-[11px] font-bold text-[#0F172A]">
                        <span>Match Rate</span>
                        <span>{resume.matchScore}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            resume.matchScore >= 85
                              ? 'bg-[#1877f2]'
                              : resume.matchScore >= 70
                              ? 'bg-sky-400'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${resume.matchScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                    {resume.uploadDate}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">{getStatusBadge(resume.status)}</td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectResume(resume)}
                        className="p-1.5 text-[#64748B] hover:text-[#1877f2] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="View Full AI Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => downloadResumePDF(resume)}
                        className="p-1.5 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Export PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteResume(resume.id)}
                        className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
        <span>Showing <strong>{filteredResumes.length}</strong> of <strong>{safeResumes.length}</strong> scanned resumes</span>
        <div className="flex items-center gap-1">
          <button className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[#64748B] hover:bg-slate-50 font-medium cursor-pointer">
            Previous
          </button>
          <span className="px-2.5 py-1 bg-[#1877f2] text-white font-bold rounded">1</span>
          <button className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[#64748B] hover:bg-slate-50 font-medium cursor-pointer">
            Next
          </button>
        </div>
      </div>

    </div>
  );
};
