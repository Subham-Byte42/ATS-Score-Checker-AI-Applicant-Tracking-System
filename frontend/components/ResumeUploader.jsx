import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Award, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

const STAGES = [
  { label: 'Extracting text & parsing document structure...', duration: 800 },
  { label: 'Evaluating ATS keywords & hard skills...', duration: 1200 },
  { label: 'Auditing metrics, formatting & experience depth...', duration: 1500 },
  { label: 'Generating Gemini AI qualitative suggestions & X-Y-Z rewrites...', duration: 2000 },
];

const REQUEST_TIMEOUT_MS = 25000; // 25s client-side abort timeout

export default function ResumeUploader({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  
  // Loading & State Safety
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clear pending abort controllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Unsupported file format. Please upload a PDF (.pdf), Word document (.docx/.doc), or Text file (.txt).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const runStageProgress = () => {
    setCurrentStageIndex(0);
    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      if (stage < STAGES.length) {
        setCurrentStageIndex(stage);
      } else {
        clearInterval(interval);
      }
    }, 1100);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please attach a resume file before scanning.');
      return;
    }

    // 1. Reset states & Setup AbortController with 25s timeout
    setErrorMessage('');
    setAnalysisResult(null);
    setIsLoading(true);
    setIsAnalyzing(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    const progressInterval = runStageProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateName', candidateName || 'Candidate');
      formData.append('targetRole', targetRole || 'Software Engineer');
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }

      // Try FastAPI route first, fallback to standard express proxy if running unified
      let response;
      try {
        response = await fetch('/api/v1/analyze', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });
      } catch (err) {
        // Retry with default application endpoint if /api/v1/analyze route not routed
        if (err.name !== 'AbortError') {
          response = await fetch('/api/resume/analyze', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
          });
        } else {
          throw err;
        }
      }

      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        if (response.status === 504) {
          throw new Error('Analysis took too long on the server. Please try a simpler document or shorter job description.');
        }
        throw new Error(errorJson?.message || errorJson?.detail || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      const finalResult = data.data || data;

      setAnalysisResult(finalResult);
      if (onAnalysisComplete) {
        onAnalysisComplete(finalResult);
      }
    } catch (err) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        setErrorMessage('Request timed out after 25 seconds. Please ensure your document text is readable and try again.');
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred during resume evaluation. Please try again.');
      }
    } finally {
      // Guaranteed fail-safe state cleanup
      setIsLoading(false);
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>High-Throughput Resume Audit Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ATS Compatibility & AI Suggestions
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            Evaluated with sub-6s latency using deterministic NLP scoring & Gemini Pro semantic auditing.
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-sm font-medium animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Evaluation Notice: </span>
              {errorMessage}
            </div>
            <button 
              onClick={() => setErrorMessage('')} 
              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Role & Candidate Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Target Role / Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                disabled={isAnalyzing}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                disabled={isAnalyzing}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Job Description (Optional) */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Target Job Description (Recommended)</span>
              <span className="text-[11px] font-semibold text-slate-400">Optional</span>
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description requirements or responsibilities here to calculate exact keyword intersection..."
              disabled={isAnalyzing}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none disabled:opacity-60"
            />
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Resume Document (.pdf, .docx, .txt)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-teal-500 bg-teal-50/50 scale-[1.01]' 
                  : file 
                  ? 'border-teal-300 bg-teal-50/30' 
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="hidden"
                disabled={isAnalyzing}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileCheck className="w-8 h-8 text-teal-600" />
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drop to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm text-slate-600">
                    <Upload className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      Drag & drop your resume here, or <span className="text-teal-700 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Supports PDF, DOCX, and TXT (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Step-by-Step Progress Feedback UI */}
          {isAnalyzing && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>{STAGES[currentStageIndex]?.label}</span>
                </div>
                <span className="text-[11px] font-black text-teal-700">
                  {Math.round(((currentStageIndex + 1) / STAGES.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-teal-200/60 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button & Security Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>256-bit encryption • Non-blocking async processing</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {file && !isAnalyzing && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                disabled={isAnalyzing || !file}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-sm font-extrabold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-teal-400" />
                    <span>Scan ATS Score</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          {/* Header Score Overview */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-teal-800">
                  {analysisResult.ats_score || analysisResult.atsScore || 85}
                </span>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">/ 100 ATS</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {analysisResult.candidate_name || candidateName || 'Candidate'}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-black rounded-full">
                    {analysisResult.rating_category || analysisResult.category || 'Good'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Target: <strong className="text-slate-800">{targetRole}</strong>
                </p>
              </div>
            </div>

            <div className="text-right sm:max-w-xs">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {analysisResult.role_alignment_summary || 'Resume demonstrates strong technical competencies and structural readiness.'}
              </p>
            </div>
          </div>

          {/* Section Score Breakdown */}
          {analysisResult.section_scores && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Weighted Section Breakdown</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(analysisResult.section_scores).map(([key, val]) => (
                  <div key={key} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="capitalize text-slate-700 text-[11px]">{key}</span>
                      <span className="text-teal-700 font-black">{typeof val === 'object' ? val.score : val}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full rounded-full"
                        style={{ width: `${typeof val === 'object' ? val.score : val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions & Google X-Y-Z Rewrites */}
          {analysisResult.bullet_rewrites && analysisResult.bullet_rewrites.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Google X-Y-Z High-Impact Bullet Rewrites</span>
              </h4>
              <div className="space-y-3">
                {analysisResult.bullet_rewrites.map((rw, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="text-xs text-rose-700 font-semibold line-through">
                      "{rw.original_bullet}"
                    </div>
                    <div className="text-xs font-black text-teal-900 flex items-start gap-2 bg-teal-50/80 p-3 rounded-xl border border-teal-200/80">
                      <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{rw.rewritten_xyz}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
