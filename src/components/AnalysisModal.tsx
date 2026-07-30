import React, { useState } from 'react';
import { ResumeRecord } from '../types';
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
  Briefcase
} from 'lucide-react';

interface AnalysisModalProps {
  resume: ResumeRecord | null;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ resume, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-suggestions'>('overview');

  if (!resume) return null;

  const matchedKeywords = resume.matchedKeywords || [];
  const missingSkills = resume.missingSkills || [];
  const strengths = resume.strengths || [
    'High keyword density for target technical stack',
    'Quantifiable metrics included in experience section',
    'Clear section hierarchy and standard ATS headings'
  ];
  const suggestions = resume.suggestions || [
    'Add a dedicated technical summary header at the top',
    'Quantify additional leadership & project outcomes',
    'Ensure email and contact links are standard text'
  ];
  const recommendedRoles = resume.recommendedRoles || [
    resume.targetRole,
    'Full Stack Engineer',
    'Software Architect'
  ];

  const handleDownloadPDF = () => {
    downloadResumePDF(resume);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1877f2] flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-[#0F172A]">
                  {resume.candidateName}
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-[#1877f2] font-extrabold text-[11px] rounded-md">
                  {resume.targetRole}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                File: {resume.fileName} ({resume.fileSize}) • Scanned on {resume.uploadDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-navigation Bar */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#1877f2] shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ATS Score Breakdown
          </button>
          <button
            onClick={() => setActiveTab('ai-suggestions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai-suggestions'
                ? 'bg-[#1877f2] text-white shadow-xs'
                : 'text-[#1877f2] bg-blue-50/80 hover:bg-blue-100/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggestions Module</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'ai-suggestions' ? (
            <AiSuggestionsModule
              resumeId={resume.id}
              candidateName={resume.candidateName}
              targetRole={resume.targetRole}
            />
          ) : (
            <>
          
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            
            {/* ATS Compatibility Score */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                {resume.atsScore}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">ATS Score</p>
                <p className="text-xs font-extrabold text-[#0F172A]">
                  {resume.category || (resume.atsScore >= 85 ? 'Top Candidate' : resume.atsScore >= 70 ? 'Excellent' : 'Needs Work')}
                </p>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                {resume.confidence || 95}%
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Confidence</p>
                <p className="text-xs font-extrabold text-[#0F172A]">Parser Reliability</p>
              </div>
            </div>

            {/* Job Match Score */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                {resume.matchScore}%
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Role Match</p>
                <p className="text-xs font-extrabold text-[#0F172A]">
                  {resume.matchScore >= 80 ? 'Strong Alignment' : 'Keyword Gap'}
                </p>
              </div>
            </div>

            {/* Parser Status */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">ATS Status</p>
                <p className="text-xs font-extrabold text-[#0F172A]">Workday & Taleo Ready</p>
              </div>
            </div>

          </div>

          {/* 8 Weighted Section Scores Grid */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#1877f2]" />
                Weighted ATS Criteria Breakdown (100% Total)
              </h4>
              <span className="text-[11px] font-bold text-slate-500">Hybrid Rule + AI Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { label: 'Resume Parsing', weight: '10%', score: resume.sectionScores?.parsing ?? 85 },
                { label: 'ATS Formatting & Layout', weight: '20%', score: resume.sectionScores?.formatting ?? 88 },
                { label: 'Keyword Match & Context', weight: '20%', score: resume.sectionScores?.keywords ?? 80 },
                { label: 'Skills & Competencies', weight: '15%', score: resume.sectionScores?.skills ?? 82 },
                { label: 'Work Experience Depth', weight: '15%', score: resume.sectionScores?.experience ?? 78 },
                { label: 'Projects & Repository Links', weight: '10%', score: resume.sectionScores?.projects ?? 85 },
                { label: 'Grammar & Active Voice', weight: '5%', score: resume.sectionScores?.grammar ?? 92 },
                { label: 'Education & Qualifications', weight: '5%', score: resume.sectionScores?.education ?? 95 },
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.label} <span className="text-[10px] font-bold text-slate-400">({item.weight})</span></span>
                    <span className="font-extrabold text-[#1877f2]">{item.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.score >= 85
                          ? 'bg-emerald-500'
                          : item.score >= 70
                          ? 'bg-[#1877f2]'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Sections Audit */}
          {resume.missingSections && resume.missingSections.length > 0 && (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Missing Core Resume Sections ({resume.missingSections.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {resume.missingSections.map((sec, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
                    ⚠️ {sec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume Strengths */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Resume Strengths ({strengths.length})
            </h4>
            <ul className="space-y-1.5">
              {strengths.map((str, i) => (
                <li key={i} className="text-xs text-slate-800 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing Skills */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Missing Skills ({missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((sk, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 shadow-2xs"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-[#1877f2] uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-[#1877f2]" />
              Improvement Suggestions ({suggestions.length})
            </h4>
            <ul className="space-y-1.5">
              {suggestions.map((sug, i) => (
                <li key={i} className="text-xs text-slate-800 font-medium flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#1877f2] shrink-0" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Certifications & Projects */}
          {((resume.recommendedCertifications && resume.recommendedCertifications.length > 0) ||
            (resume.recommendedProjects && resume.recommendedProjects.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resume.recommendedCertifications && resume.recommendedCertifications.length > 0 && (
                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#1877f2]" />
                    Recommended Certifications
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-medium">
                    {resume.recommendedCertifications.map((cert, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1877f2]"></span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resume.recommendedProjects && resume.recommendedProjects.length > 0 && (
                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Recommended Projects
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-medium">
                    {resume.recommendedProjects.map((proj, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommended Roles */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Recommended Roles ({recommendedRoles.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {recommendedRoles.map((role, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 shadow-2xs"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          </>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-[#0F172A] font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-[#1877f2] hover:bg-[#0866ff] text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF Breakdown</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
