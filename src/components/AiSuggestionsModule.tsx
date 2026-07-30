import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Cpu, 
  FileCheck2, 
  Briefcase, 
  MessageSquare, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export interface AISuggestionsData {
  skillsToLearn: string[];
  missingTechnologies: string[];
  resumeImprovementTips: string[];
  suitableJobRoles: string[];
  interviewPreparationSuggestions: string[];
}

interface AISuggestionsModuleProps {
  resumeId: string;
  candidateName?: string;
  targetRole?: string;
}

export const AiSuggestionsModule: React.FC<AISuggestionsModuleProps> = ({
  resumeId,
  candidateName = 'Candidate',
  targetRole = 'Software Engineer',
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AISuggestionsData | null>(null);

  const fetchSuggestions = async () => {
    if (!resumeId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/resume/suggestions/${resumeId}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.suggestions) {
        setSuggestions(json.suggestions);
      } else {
        throw new Error(json.message || 'Failed to parse AI suggestions');
      }
    } catch (err: any) {
      console.error('Error fetching AI suggestions:', err);
      setError(err.message || 'Unable to fetch personalized suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [resumeId]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600 via-[#1877f2] to-indigo-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Personalized AI Career & Skill Advisor
              </h2>
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full text-sky-100">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-blue-100/90 font-medium mt-0.5">
              Personalized career suggestions for <strong className="text-white">{candidateName}</strong> targeting <strong className="text-white">{targetRole}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating...' : 'Refresh Suggestions'}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center mx-auto shadow-inner">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">
            Consulting Gemini AI Career Advisor...
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Analyzing resume gaps, tech stack requirements, and generating targeted interview & career growth tips.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-900">{error}</p>
          </div>
          <button
            onClick={fetchSuggestions}
            className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Suggestions Content Grid */}
      {!loading && suggestions && (
        <div className="p-6 space-y-6 bg-slate-50/40">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Skills to Learn */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1877f2] flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">Skills to Learn Next</h3>
                    <p className="text-[11px] text-[#64748B]">Bridging key competency gaps</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-50 text-[#1877f2] rounded-md border border-blue-200">
                  {suggestions.skillsToLearn.length} High Impact
                </span>
              </div>

              <ul className="space-y-2">
                {suggestions.skillsToLearn.map((skill, index) => (
                  <li key={index} className="p-3 bg-blue-50/40 border border-blue-100/80 rounded-xl text-xs font-semibold text-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#1877f2] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Missing Technologies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">Missing Technologies</h3>
                    <p className="text-[11px] text-[#64748B]">Required tech for target role</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-50 text-rose-800 rounded-md border border-rose-200">
                  {suggestions.missingTechnologies.length} Gaps Found
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.missingTechnologies.map((tech, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Resume Improvement Tips */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">Resume Improvement Tips</h3>
                    <p className="text-[11px] text-[#64748B]">Formatting & impact enhancements</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                  ATS Verified
                </span>
              </div>

              <ul className="space-y-2">
                {suggestions.resumeImprovementTips.map((tip, index) => (
                  <li key={index} className="p-3 bg-emerald-50/40 border border-emerald-100/80 rounded-xl text-xs font-semibold text-emerald-950 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Suitable Job Roles */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">Suitable Job Roles</h3>
                    <p className="text-[11px] text-[#64748B]">Alternative & aligned positions</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200">
                  Matched
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.suitableJobRoles.map((role, index) => (
                  <div
                    key={index}
                    className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-extrabold text-indigo-900 flex items-center justify-between"
                  >
                    <span>{role}</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 5. Interview Preparation Suggestions (Full Width) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#1877f2] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">Interview Preparation Strategy</h3>
                  <p className="text-[11px] text-[#64748B]">Technical, system design & STAR behavioral practice</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-sky-50 text-[#1877f2] rounded-md border border-sky-200">
                Tailored Questions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.interviewPreparationSuggestions.map((prep, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-gradient-to-r from-sky-50/60 to-blue-50/30 border border-sky-100 rounded-xl text-xs font-semibold text-slate-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#1877f2] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    Q{index + 1}
                  </div>
                  <span className="leading-relaxed">{prep}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
