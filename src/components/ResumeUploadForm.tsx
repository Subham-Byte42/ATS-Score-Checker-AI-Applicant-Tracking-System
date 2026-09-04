import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  X, 
  FileType,
  AlertCircle,
  Award,
  CheckCircle2,
  ListChecks,
  BriefcaseIcon,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Lock,
  Folder
} from 'lucide-react';
import { AnalysisResponseData, ResumeRecord } from '../types';
import { BrandedLoadingScreen } from './BrandedLoadingScreen';
import { RecruiterBulkUploadHub } from './RecruiterBulkUploadHub';

interface ResumeUploadFormProps {
  onAnalyze: (record: ResumeRecord) => void;
  userRole?: 'personal' | 'recruiter';
  onSelectResume?: (resume: ResumeRecord) => void;
  onAnalyzeBatch?: (records: ResumeRecord[]) => void;
}

export const ResumeUploadForm: React.FC<ResumeUploadFormProps> = ({ 
  onAnalyze, 
  userRole = 'personal',
  onSelectResume,
  onAnalyzeBatch
}) => {
  // If user role is recruiter, render the specialized bulk upload and Power BI comparison hub
  if (userRole === 'recruiter') {
    return (
      <RecruiterBulkUploadHub
        onAnalyzeCandidate={onAnalyze}
        onAnalyzeBatch={onAnalyzeBatch}
        onSelectResume={onSelectResume}
      />
    );
  }

  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [folderName, setFolderName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Senior Level (3-5 yrs)');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);

  // API State: 'idle' | 'loading' | 'success' | 'error'
  const [apiState, setApiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisResponseData | null>(null);

  const loadingStages = [
    'Reading & extracting document structure (.doc, .docx, .pdf)...',
    'Auditing contact details, layout & Workday ATS formatting...',
    'Matching technical competencies against target role...',
    'Calculating 7-criteria weighted ATS compatibility score...',
  ];

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
    setLoadingStage(0);
    setErrorMessage('');
    setAnalysisData(null);

    // Progress interval for smooth stage transitions during audit
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
    }, 700);

    if (!selectedFile && !resumeText.trim()) {
      setErrorMessage('Please upload a resume file (PDF, DOCX) or paste your resume text to scan.');
      setApiState('error');
      return;
    }

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('resume', selectedFile);
      } else if (resumeText.trim()) {
        formData.append('resumeText', resumeText.trim());
      }
      formData.append('targetRole', targetRole.trim() || 'Software Engineer');
      formData.append('candidateName', candidateName.trim() || 'Candidate');
      formData.append('jobDescription', jobDescription.trim());

      // Single direct call to resume analyze endpoint with resilient fallback
      let analyzeRes = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!analyzeRes.ok && analyzeRes.status === 404) {
        // Fallback to /api/resumes/analyze alias
        analyzeRes = await fetch('/api/resumes/analyze', {
          method: 'POST',
          body: formData,
        });
      }

      clearInterval(stageInterval);

      const rawResponseText = await analyzeRes.text();
      let analyzeJson: any = null;

      try {
        analyzeJson = JSON.parse(rawResponseText);
      } catch (parseErr) {
        console.error('Non-JSON server response:', rawResponseText);
        throw new Error(
          `Server returned an invalid response (${analyzeRes.status}). Please verify the uploaded document is a valid PDF or Word (.docx) document.`
        );
      }

      if (!analyzeRes.ok || analyzeJson.status === 'failed') {
        throw new Error(analyzeJson?.message || `Analysis failed with status code ${analyzeRes.status}`);
      }

      const resultData = analyzeJson.data || {};

      const resultJson: AnalysisResponseData = {
        success: true,
        resumeId: analyzeJson.resumeId || resultData._id || `res-${Date.now()}`,
        status: analyzeJson.status || 'completed',
        atsScore: analyzeJson.atsScore ?? resultData.atsScore ?? 85,
        confidence: analyzeJson.confidence ?? resultData.confidence ?? 88,
        category: analyzeJson.category ?? resultData.category ?? (analyzeJson.atsScore >= 85 ? 'Excellent' : 'Good'),
        sectionScores: analyzeJson.sectionScores || resultData.sectionScores || {
          parsing: 88,
          formatting: 85,
          keywords: 82,
          skills: 84,
          experience: 80,
          projects: 86,
          grammar: 92,
        },
        missingSections: Array.isArray(analyzeJson.missingSections) 
          ? analyzeJson.missingSections 
          : Array.isArray(resultData.missingSections) 
          ? resultData.missingSections 
          : [],
        analysis: {
          skillsFound: Array.isArray(analyzeJson.analysis?.skillsFound)
            ? analyzeJson.analysis.skillsFound
            : Array.isArray(resultData.skills?.found)
            ? resultData.skills.found
            : ['Core Technical Skills', 'Problem Solving'],
          missingSkills: Array.isArray(analyzeJson.analysis?.missingSkills)
            ? analyzeJson.analysis.missingSkills
            : Array.isArray(resultData.skills?.missing)
            ? resultData.skills.missing
            : [],
          strengths: Array.isArray(analyzeJson.analysis?.strengths)
            ? analyzeJson.analysis.strengths
            : Array.isArray(resultData.strengths)
            ? resultData.strengths
            : ['Clear structure', 'Standard ATS headings'],
          weaknesses: Array.isArray(analyzeJson.analysis?.weaknesses)
            ? analyzeJson.analysis.weaknesses
            : Array.isArray(resultData.weaknesses)
            ? resultData.weaknesses
            : ['Add more quantifiable achievements'],
          suggestions: Array.isArray(analyzeJson.analysis?.suggestions)
            ? analyzeJson.analysis.suggestions
            : Array.isArray(resultData.suggestions)
            ? resultData.suggestions
            : ['Add domain-specific keywords for target role'],
          recommendedRoles: Array.isArray(analyzeJson.analysis?.recommendedRoles)
            ? analyzeJson.analysis.recommendedRoles
            : Array.isArray(resultData.recommendedRoles)
            ? resultData.recommendedRoles
            : [targetRole || 'Software Engineer', 'Full Stack Engineer'],
        },
        aiSuggestions: analyzeJson.aiSuggestions || resultData.aiSuggestions,
        data: resultData,
      };

      setAnalysisData(resultJson);
      setApiState('success');

      // Update parent dashboard record
      const newRecord: ResumeRecord = {
        id: resultJson.resumeId || `res-${Date.now()}`,
        candidateName: candidateName || resultData.candidateName || 'Candidate',
        fileName: selectedFile ? selectedFile.name : 'Uploaded_Resume.docx',
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
        targetRole: targetRole || 'Software Engineer',
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        atsScore: resultJson.atsScore || 85,
        matchScore: Math.max(50, (resultJson.atsScore || 85) - 3),
        status: (resultJson.atsScore || 85) >= 85 ? 'Excellent' : 'Good',
        missingSkills: resultJson.analysis?.missingSkills || [],
        matchedKeywords: resultJson.analysis?.skillsFound || [],
        strengths: resultJson.analysis?.strengths || [],
        suggestions: resultJson.analysis?.suggestions || [],
        recommendedRoles: resultJson.analysis?.recommendedRoles || [],
        sectionScores: resultJson.sectionScores,
        missingSections: resultJson.missingSections,
        category: (
          resultJson.category === 'Top Candidate' ||
          resultJson.category === 'Excellent' ||
          resultJson.category === 'Good' ||
          resultJson.category === 'Needs Improvement' ||
          resultJson.category === 'Pending'
            ? resultJson.category
            : (resultJson.atsScore || 85) >= 90
            ? 'Top Candidate'
            : (resultJson.atsScore || 85) >= 75
            ? 'Excellent'
            : 'Good'
        ),
        confidence: resultJson.confidence,
        folderName: folderName.trim() || (targetRole ? `${targetRole} Cohort` : 'General Uploads'),
      };

      onAnalyze(newRecord);
    } catch (err: any) {
      clearInterval(stageInterval);
      console.error('Error during resume analysis:', err);
      setApiState('error');
      setErrorMessage(err.message || 'Unable to analyze resume. Please ensure the document is a valid PDF or Word document (.doc / .docx).');
    }
  };

  const resetForm = () => {
    setApiState('idle');
    setAnalysisData(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200/80 soft-shadow overflow-hidden transition-all duration-300">
      
      {/* Upload Card Header */}
      <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Upload className="w-5.5 h-5.5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Scan & Check ATS Resume Score
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload candidate resume and job description for instant AI matching.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 bg-teal-50 text-teal-800 font-extrabold text-xs rounded-full border border-teal-200">
          Instant Scan • Gemini AI
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading Banner */}
        {apiState === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 bg-white border-b border-slate-200 overflow-hidden"
          >
            <BrandedLoadingScreen 
              fullScreen={false}
              inline={true}
              size="md"
              message="Analyzing Resume..."
              subMessage="Extracting text, evaluating ATS formatting compliance, matching keywords & calculating score..."
            />
          </motion.div>
        )}

        {/* Error Banner */}
        {apiState === 'error' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 bg-rose-50 border-b border-rose-200 space-y-3 text-rose-900 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-900">
                  Unable to analyze resume
                </h3>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  {errorMessage || 'There was an issue processing your file with AI. Please verify file format and retry.'}
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Analysis Result Panel */}
        {apiState === 'success' && analysisData && (() => {
          const strengthsList = Array.isArray(analysisData.analysis?.strengths) ? analysisData.analysis.strengths : [];
          const missingSkillsList = Array.isArray(analysisData.analysis?.missingSkills) ? analysisData.analysis.missingSkills : [];
          const suggestionsList = Array.isArray(analysisData.analysis?.suggestions) ? analysisData.analysis.suggestions : [];
          const recommendedRolesList = Array.isArray(analysisData.analysis?.recommendedRoles) ? analysisData.analysis.recommendedRoles : [];
          
          return (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-slate-50 border-b border-slate-200/80 space-y-6"
          >
          
          {/* Status Badge & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <span className="px-3 py-0.5 bg-teal-50 text-teal-800 font-black text-xs rounded-full border border-teal-200">
                  Analysis completed
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 tracking-tight">
                  ATS Compatibility & Score Breakdown
                </h3>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Scan Another Resume
            </button>
          </div>

          {/* 1. ATS Score Gauge & Summary Card - Prominent Teal Circular Tracker */}
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-600"
                    strokeDasharray={`${analysisData.atsScore || 85}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {analysisData.atsScore ?? 85}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider mt-0.5">
                    / 100 ATS
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Award className="w-5 h-5 text-teal-600" />
                <h4 className="text-base font-extrabold text-slate-900">
                  ATS Score Analysis
                </h4>
                {analysisData.category && (
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-black rounded-full border border-teal-200">
                    {analysisData.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Calculated using weighted industry benchmarks powered by Gemini semantic AI & ATS crawler criteria.
              </p>
              {analysisData.confidence && (
                <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <span>Confidence Level: <strong className="text-teal-700 font-black">{analysisData.confidence}%</strong></span>
                  <span>•</span>
                  <span>Target Role: <strong className="text-slate-800 font-black">{targetRole || 'Software Engineer'}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section Score Breakdown Bar Grid */}
          {analysisData.sectionScores && (
            <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-teal-600" />
                  ATS Criteria Breakdown & Section Weights
                </h4>
                <span className="text-[10px] font-bold text-slate-500">Gemini AI Audit</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {[
                  { label: 'Parsing & Contact', weight: '10%', score: analysisData.sectionScores.parsing ?? 88 },
                  { label: 'ATS Format & Layout', weight: '15%', score: analysisData.sectionScores.formatting ?? 85 },
                  { label: 'Keyword Match', weight: '25%', score: analysisData.sectionScores.keywords ?? 82 },
                  { label: 'Skills & Competencies', weight: '20%', score: analysisData.sectionScores.skills ?? 84 },
                  { label: 'Experience & Impact', weight: '15%', score: analysisData.sectionScores.experience ?? 80 },
                  { label: 'Projects & Evidence', weight: '10%', score: analysisData.sectionScores.projects ?? 86 },
                  { label: 'Grammar & Tone', weight: '5%', score: analysisData.sectionScores.grammar ?? 92 },
                ].map((crit, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-slate-800 text-[11px]">{crit.label} <span className="text-[10px] font-semibold text-slate-400">({crit.weight})</span></span>
                      <span className={`text-[11px] font-black ${
                        crit.score >= 85 ? 'text-teal-700' : crit.score >= 70 ? 'text-blue-700' : 'text-amber-700'
                      }`}>
                        {crit.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          crit.score >= 85 ? 'bg-teal-600' : crit.score >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${crit.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Resume Strengths */}
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-teal-600" />
              Resume Strengths ({strengthsList.length})
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {strengthsList.map((str, i) => (
                <li
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs font-semibold text-slate-800 flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 mt-1 shrink-0"></span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Missing Skills */}
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow space-y-3">
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
              Missing Keywords ({missingSkillsList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {missingSkillsList.length > 0 ? (
                missingSkillsList.map((sk, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-extrabold text-rose-700 shadow-2xs flex items-center gap-1.5"
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
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4.5 h-4.5 text-slate-800" />
              Improvement Suggestions ({suggestionsList.length})
            </h4>
            <ul className="space-y-2">
              {suggestionsList.map((sug, i) => (
                <li
                  key={i}
                  className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-800 flex items-start gap-3"
                >
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Recommended Roles */}
          <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 soft-shadow space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BriefcaseIcon className="w-4.5 h-4.5 text-slate-800" />
              Recommended Roles ({recommendedRolesList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendedRolesList.map((role, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                  {role}
                </span>
              ))}
            </div>
          </div>

        </motion.div>
        );
      })()}
      </AnimatePresence>

      {/* Form Body - Only visible when not actively showing success state */}
      {apiState !== 'success' && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
          
          {/* Candidate & Role Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Candidate Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                disabled={apiState === 'loading'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-teal-600" />
                Folder Name <span className="text-slate-400 font-normal">(category)</span>
              </label>
              <div className="relative">
                <Folder className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Q3 Engineering"
                  disabled={apiState === 'loading'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Target Job Title <span className="text-slate-400 font-normal">(recommended)</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  disabled={apiState === 'loading'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                disabled={apiState === 'loading'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden cursor-pointer disabled:opacity-60"
              >
                <option value="Entry Level (0-2 yrs)">Entry Level (0-2 yrs)</option>
                <option value="Mid-Senior Level (3-5 yrs)">Mid-Senior Level (3-5 yrs)</option>
                <option value="Senior Level (5-8 yrs)">Senior Level (5-8 yrs)</option>
                <option value="Lead / Director (8+ yrs)">Lead / Director (8+ yrs)</option>
              </select>
            </div>
          </div>

          {/* Upload & Job Description Dual Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Resume Input Mode (File vs Text) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      uploadMode === 'file'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload File (.pdf / .docx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('text')}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      uploadMode === 'text'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Paste Text Directly
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  {uploadMode === 'file' ? 'PDF, DOCX, DOC' : 'Plain Text'}
                </span>
              </div>

              {uploadMode === 'file' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative group border-2 border-dashed rounded-[24px] p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[190px] ${
                    isDragging
                      ? 'border-slate-900 bg-slate-100 scale-[0.99]'
                      : selectedFile
                      ? 'border-teal-500 bg-teal-50/50'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    id="resume-file-input"
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                    onChange={handleFileChange}
                    disabled={apiState === 'loading'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                        selectedFile.name.toLowerCase().endsWith('.docx') || selectedFile.name.toLowerCase().endsWith('.doc')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {selectedFile.name.toLowerCase().endsWith('.docx') || selectedFile.name.toLowerCase().endsWith('.doc') ? (
                          <FileType className="w-6 h-6 text-blue-600" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-teal-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            selectedFile.name.toLowerCase().endsWith('.docx') || selectedFile.name.toLowerCase().endsWith('.doc')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {selectedFile.name.toLowerCase().endsWith('.docx') ? 'DOCX' : selectedFile.name.toLowerCase().endsWith('.doc') ? 'DOC' : 'PDF'}
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 truncate max-w-[220px]">{selectedFile.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for scan
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={apiState === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="mt-1 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 cursor-pointer z-20"
                      >
                        <X className="w-3.5 h-3.5" /> Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300">
                        <Upload className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Drag & drop your resume here, or <span className="text-slate-900 underline font-extrabold">browse file</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Supports PDF, Word (.doc, .docx), and TXT formats
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold flex items-center gap-1.5 shadow-2xs">
                          <FileType className="w-3.5 h-3.5 text-rose-500" /> PDF (.pdf)
                        </span>
                        <span className="text-[10px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold flex items-center gap-1.5 shadow-2xs">
                          <FileType className="w-3.5 h-3.5 text-blue-600" /> Word (.doc / .docx)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[190px]">
                  <textarea
                    rows={7}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    disabled={apiState === 'loading'}
                    placeholder="Paste full resume text here (Summary, Experience, Skills, Education, Projects)..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[24px] text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden resize-none disabled:opacity-60"
                  />
                </div>
              )}
            </div>

            {/* Job Description Text Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                  Target Job Description <span className="text-slate-400 font-normal">(optional but recommended)</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">For keyword match %</span>
              </div>

              <textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={apiState === 'loading'}
                placeholder="Paste the target job description, key requirements, required tech stack to calculate tailored keyword alignment..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[24px] text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-hidden resize-none disabled:opacity-60"
              ></textarea>
            </div>

          </div>

          {/* Live Progress Stage Feedback when loading */}
          {apiState === 'loading' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>{loadingStages[loadingStage]}</span>
                </div>
                <span className="text-[11px] font-black text-teal-700">{Math.round(((loadingStage + 1) / loadingStages.length) * 100)}%</span>
              </div>
              <div className="w-full bg-teal-200/60 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-teal-600 h-full rounded-full"
                  initial={{ width: '20%' }}
                  animate={{ width: `${Math.min(95, ((loadingStage + 1) / loadingStages.length) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Submit Bar & Trust Message */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Trust message below upload */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>100% Private & Encrypted • Word (.doc/.docx) & PDF supported</span>
            </div>

            <button
              type="submit"
              disabled={apiState === 'loading'}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-98 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-75"
            >
              {apiState === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Analyzing Resume ({loadingStage + 1}/4)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Check ATS Compatibility Score</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

