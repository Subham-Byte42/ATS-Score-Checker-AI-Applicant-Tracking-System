import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  X, 
  Layers, 
  FileType,
  AlertCircle,
  TrendingUp,
  Award,
  CheckCircle2,
  ListChecks,
  BriefcaseIcon,
  RefreshCw
} from 'lucide-react';
import { AnalysisResponseData, ResumeRecord } from '../types';

interface ResumeUploadFormProps {
  onAnalyze: (record: ResumeRecord) => void;
}

export const ResumeUploadForm: React.FC<ResumeUploadFormProps> = ({ onAnalyze }) => {
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // API State: 'idle' | 'loading' | 'success' | 'error'
  const [apiState, setApiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisResponseData | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiState('loading');
    setErrorMessage('');
    setAnalysisData(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('resume', selectedFile);
      }
      formData.append('targetRole', targetRole || 'Software Engineer');
      formData.append('candidateName', candidateName || 'Candidate');
      formData.append('jobDescription', jobDescription);

      // 1. Trigger resume analysis POST API
      const analyzeRes = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!analyzeRes.ok) {
        throw new Error(`Server returned status ${analyzeRes.status}`);
      }

      const analyzeJson = await analyzeRes.json();
      const resumeId = analyzeJson.resumeId || analyzeJson.data?._id;

      if (!resumeId) {
        throw new Error('No valid resume ID returned from analysis server.');
      }

      // 2. Call GET /api/resume/result/:resumeId to fetch final structured result
      const resultRes = await fetch(`/api/resume/result/${resumeId}`);

      if (!resultRes.ok) {
        throw new Error(`Failed to retrieve analysis result for ID ${resumeId}`);
      }

      const resultJson: AnalysisResponseData = await resultRes.json();

      if (!resultJson.success && resultJson.status === 'failed') {
        throw new Error('Analysis completed with failure status.');
      }

      setAnalysisData(resultJson);
      setApiState('success');

      // Update parent dashboard record
      const newRecord: ResumeRecord = {
        id: resultJson.resumeId || `res-${Date.now()}`,
        candidateName: candidateName || 'Candidate',
        fileName: selectedFile ? selectedFile.name : 'Uploaded_Resume.pdf',
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
        targetRole: targetRole || 'Software Engineer',
        uploadDate: new Date().toISOString().split('T')[0],
        atsScore: resultJson.atsScore || 85,
        matchScore: Math.max(50, (resultJson.atsScore || 85) - 4),
        status: (resultJson.atsScore || 85) >= 85 ? 'Excellent' : 'Good',
        missingSkills: resultJson.analysis?.missingSkills || [],
        matchedKeywords: resultJson.analysis?.skillsFound || [],
        strengths: resultJson.analysis?.strengths || [],
        suggestions: resultJson.analysis?.suggestions || [],
        recommendedRoles: resultJson.analysis?.recommendedRoles || [],
      };

      onAnalyze(newRecord);
    } catch (err: any) {
      console.error('Error during resume analysis:', err);
      setApiState('error');
      setErrorMessage(err.message || 'Unable to analyze resume. Please try again.');
    }
  };

  const resetForm = () => {
    setApiState('idle');
    setAnalysisData(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Form Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              New ATS Score Check & Resume Scan
            </h2>
            <p className="text-xs text-[#64748B] font-medium">
              Upload candidate resume and paste job description to check your ATS compatibility score.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 bg-blue-100 text-[#1877f2] font-semibold text-xs rounded-full border border-blue-200">
          Fast Scan • ~3 seconds
        </span>
      </div>

      {/* Loading Banner */}
      {apiState === 'loading' && (
        <div className="p-8 text-center space-y-4 bg-blue-50/40 border-b border-blue-100 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center mx-auto shadow-inner">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-[#0F172A]">
              Analyzing your resume...
            </h3>
            <p className="text-xs text-[#64748B] font-medium max-w-md mx-auto">
              Extracting text, evaluating ATS formatting compliance, matching skills, and computing weighted score pillars...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-blue-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-[#1877f2] animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {apiState === 'error' && (
        <div className="p-6 bg-rose-50 border-b border-rose-200 space-y-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-900">
                Unable to analyze resume
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                {errorMessage || 'There was an issue processing your PDF file with Gemini AI. Please verify file format and retry.'}
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success Analysis Result Panel */}
      {apiState === 'success' && analysisData && (
        <div className="p-6 bg-slate-50/80 border-b border-slate-200 space-y-6 animate-in fade-in duration-300">
          
          {/* Status Badge & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-md border border-emerald-200">
                  Analysis completed
                </span>
                <h3 className="text-lg font-extrabold text-[#0F172A] mt-1">
                  ATS Score & Detailed Analysis Report
                </h3>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Scan Another Resume
            </button>
          </div>

          {/* 1. ATS Score Gauge & Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1877f2] to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <div className="text-center">
                  <span className="text-3xl font-black block leading-none">
                    {analysisData.atsScore}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">
                    / 100 ATS
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Award className="w-5 h-5 text-[#1877f2]" />
                <h4 className="text-base font-extrabold text-[#0F172A]">
                  ATS Score Breakdown
                </h4>
              </div>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Calculated using weighted keyword matching (30%), skills alignment (25%), experience metrics (20%), projects quality (15%), and structural formatting (10%) combined with Gemini AI evaluation.
              </p>
            </div>
          </div>

          {/* 2. Resume Strengths */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              Resume Strengths ({analysisData.analysis.strengths.length})
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {analysisData.analysis.strengths.map((str, i) => (
                <li
                  key={i}
                  className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-900 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Missing Skills */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
              Missing Skills ({analysisData.analysis.missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.analysis.missingSkills.length > 0 ? (
                analysisData.analysis.missingSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {sk}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  No critical missing skills detected.
                </p>
              )}
            </div>
          </div>

          {/* 4. Improvement Suggestions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-[#1877f2] uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4.5 h-4.5 text-[#1877f2]" />
              Improvement Suggestions ({analysisData.analysis.suggestions.length})
            </h4>
            <ul className="space-y-2">
              {analysisData.analysis.suggestions.map((sug, i) => (
                <li
                  key={i}
                  className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-xs font-semibold text-slate-800 flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#1877f2] shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Recommended Roles */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
              <BriefcaseIcon className="w-4.5 h-4.5 text-indigo-600" />
              Recommended Roles ({analysisData.analysis.recommendedRoles.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.analysis.recommendedRoles.map((role, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {role}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Form Body - Only visible when not actively showing success state */}
      {apiState !== 'success' && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          
          {/* Candidate & Role Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Candidate Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                disabled={apiState === 'loading'}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Target Job Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  disabled={apiState === 'loading'}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Seniority / Experience Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                disabled={apiState === 'loading'}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden cursor-pointer disabled:opacity-60"
                required
              >
                <option value="">Select Experience Level *</option>
                <option value="Entry Level (0-2 yrs)">Entry Level (0-2 yrs)</option>
                <option value="Mid-Senior Level (3-5 yrs)">Mid-Senior Level (3-5 yrs)</option>
                <option value="Senior Level (5-8 yrs)">Senior Level (5-8 yrs)</option>
                <option value="Lead / Director (8+ yrs)">Lead / Director (8+ yrs)</option>
              </select>
            </div>
          </div>

          {/* Upload & Job Description Dual Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* File Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Upload Resume File (PDF / DOCX) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B] font-medium">Max 10MB</span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[170px] ${
                  isDragging
                    ? 'border-[#1877f2] bg-blue-50/60 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-[#1877f2] bg-[#F8FAFC] hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  disabled={apiState === 'loading'}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{selectedFile.name}</p>
                      <p className="text-xs text-[#64748B]">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={apiState === 'loading'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877f2] border border-blue-100 flex items-center justify-center shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">
                        Drag and drop your resume here, or <span className="text-[#1877f2] underline">browse file</span>
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Supports PDF, DOCX, TXT formats
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded text-[#64748B] font-medium flex items-center gap-1">
                        <FileType className="w-3 h-3 text-red-500" /> PDF
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded text-[#64748B] font-medium flex items-center gap-1">
                        <FileType className="w-3 h-3 text-[#1877f2]" /> DOCX
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Job Description Requirements <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B] font-medium">Paste verbatim for accurate match %</span>
              </div>

              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={apiState === 'loading'}
                placeholder="Paste job posting description, key duties, required technologies..."
                className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden resize-none disabled:opacity-60"
                required
              ></textarea>
            </div>

          </div>

          {/* Submit Bar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
              <Layers className="w-4 h-4 text-[#1877f2]" />
              <span>AI Model: <strong>Gemini 2.0 ATS Optimizer</strong></span>
            </div>

            <button
              type="submit"
              disabled={apiState === 'loading'}
              className="px-6 py-2.5 bg-[#1877f2] hover:bg-[#0866ff] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-75"
            >
              {apiState === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing your resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>Run ATS Score Check</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};
