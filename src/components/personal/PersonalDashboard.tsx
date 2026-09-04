import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Award, 
  CheckCircle2, 
  Clock, 
  Upload, 
  TrendingUp, 
  Sparkles, 
  History,
  BarChart3,
  Check,
  User,
  Users
} from 'lucide-react';
import { ResumeRecord } from '../../types';
import { Sidebar, SidebarNavId } from '../Sidebar';
import { PersonalResumeTable } from './PersonalResumeTable';
import { ResumeUploadForm } from '../ResumeUploadForm';
import { AiChatbotModule } from '../AiChatbotModule';
import { PersonalSkillMatchChart } from './PersonalSkillMatchChart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export interface PersonalDashboardProps {
  user: { name: string; email: string };
  resumes: ResumeRecord[];
  onBack?: () => void;
  onAnalyzeNewResume: (record: ResumeRecord) => void;
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onLogout: () => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  user,
  resumes = [],
  onBack,
  onAnalyzeNewResume,
  onSelectResume,
  onDeleteResume,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<SidebarNavId>('home');
  const [selectedSkillResumeId, setSelectedSkillResumeId] = useState<string | null>(null);
  const [selectedCandidateName, setSelectedCandidateName] = useState<string>('all');

  const handleGoBack = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    } else if (onBack) {
      onBack();
    }
  };

  const handleViewSkills = (resume: ResumeRecord) => {
    setSelectedSkillResumeId(resume.id);
    setActiveTab('home');
    setTimeout(() => {
      const el = document.getElementById('personal-skill-graph-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-teal-500', 'ring-offset-4');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-4');
        }, 2000);
      }
    }, 100);
  };

  const safeResumes = resumes || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalResumes = safeResumes.length;
  const bestAtsScore = safeResumes.length > 0 
    ? `${Math.max(...safeResumes.map(r => r.atsScore ?? 0))}%`
    : '0%';
  const analysisDone = safeResumes.filter(r => (r.atsScore ?? 0) > 0 || r.status !== 'Pending').length;
  const lastUpload = safeResumes.length > 0 ? (safeResumes[0].uploadDate || 'Recently') : 'None';
  const mostRecentResume = safeResumes.length > 0 ? safeResumes[0] : undefined;
  const activeResume = useMemo(() => {
    if (selectedSkillResumeId && safeResumes.length > 0) {
      const found = safeResumes.find(r => r.id === selectedSkillResumeId);
      if (found) return found;
    }
    return mostRecentResume;
  }, [selectedSkillResumeId, safeResumes, mostRecentResume]);

  // Unique candidate names deduplicated as single units for the dropdown
  const uniqueCandidateNames = useMemo(() => {
    const nameMap = new Map<string, number>();
    safeResumes.forEach((r) => {
      const name = (r.candidateName || r.fileName || 'Unnamed Candidate').trim();
      nameMap.set(name, (nameMap.get(name) || 0) + 1);
    });
    return Array.from(nameMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }, [safeResumes]);

  const chartData = useMemo(() => {
    if (safeResumes.length > 0) {
      // Filter by candidate name if a specific candidate is selected
      const filtered = selectedCandidateName === 'all'
        ? safeResumes
        : safeResumes.filter(r => (r.candidateName || r.fileName || 'Unnamed Candidate').trim().toLowerCase() === selectedCandidateName.toLowerCase());

      const sorted = [...filtered].reverse();
      return sorted.map((r, i) => ({
        label: r.uploadDate ? String(r.uploadDate).split(',')[0] : `Scan #${i + 1}`,
        atsScore: r.atsScore ?? 80,
        matchScore: r.matchScore ?? 75,
        candidateName: r.candidateName || r.fileName || 'Candidate',
        targetRole: r.targetRole || 'Target Role',
        fileName: r.fileName
      }));
    }
    return [];
  }, [safeResumes, selectedCandidateName]);

  const recentActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: 'scan' | 'upload' | 'insight' | 'score';
      score?: number;
    }> = [];

    if (safeResumes.length > 0) {
      safeResumes.forEach((resume) => {
        activities.push({
          id: `act-scan-${resume.id}`,
          title: `Resume Scanned: ${resume.fileName}`,
          description: `Target Role: ${resume.targetRole}`,
          timestamp: resume.uploadDate || 'Just now',
          type: 'scan',
          score: resume.atsScore
        });
        if (resume.matchScore >= 80) {
          activities.push({
            id: `act-match-${resume.id}`,
            title: `High ATS Match Achieved`,
            description: `${resume.matchScore}% alignment with ${resume.targetRole}`,
            timestamp: resume.uploadDate || 'Recently',
            type: 'score',
            score: resume.matchScore
          });
        }
      });
    }

    return activities.slice(0, 5);
  }, [safeResumes]);

  return (
    <div className="flex flex-col md:flex-row items-start gap-6 animate-in fade-in duration-300 min-h-screen">
      {/* Dedicated Personal Sidebar Navigation */}
      <Sidebar
        activeItem={activeTab}
        onSelectItem={setActiveTab}
        onLogout={onLogout}
        onBack={handleGoBack}
      />

      {/* Main Personal Content Area */}
      <div className="flex-1 w-full space-y-8 min-w-0">
        <AnimatePresence mode="wait">
          
          {/* Overview Dashboard Tab */}
          {activeTab === 'home' && (
            <motion.div
              key="personal-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Header Greeting Banner */}
              <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 z-10 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#3B82F6] text-xs font-extrabold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Personal Job Seeker Workspace</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {getGreeting()}, {user?.name || 'Job Seeker'}!
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                    Optimize your resume formatting, boost keyword alignment, and track your ATS readiness for top employers.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center flex-wrap">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>Upload New Resume</span>
                  </button>
                </div>
              </div>

              {/* Personal Stats Overview Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Resumes */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Total Resumes
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {totalResumes}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* Best ATS Score */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-teal-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Best ATS Score
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-teal-600 tracking-tight">
                      {bestAtsScore}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-extrabold">
                    <Award className="w-6 h-6 text-teal-600" />
                  </div>
                </div>

                {/* Scans Completed */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Scans Completed
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {analysisDone}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Last Upload */}
                <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 shadow-[0_2px_10px_rgb(15,23,42,0.03)] transition-all flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Last Upload
                    </p>
                    <p className="text-sm font-black text-slate-900 truncate" title={lastUpload}>
                      {lastUpload}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Skill Match Bar Chart Section */}
              {safeResumes.length > 0 ? (
                <PersonalSkillMatchChart
                  resume={activeResume}
                  resumes={safeResumes}
                  selectedResumeId={selectedSkillResumeId}
                  onSelectResumeId={(id) => setSelectedSkillResumeId(id)}
                  title="Skill Set Match & Competency Graph"
                  subtitle="Detailed visual bar chart analyzing your resume's keyword and competency alignment for your target role."
                  onSelectResume={onSelectResume}
                />
              ) : (
                <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] text-center space-y-3">
                  <BarChart3 className="w-10 h-10 text-teal-600 mx-auto" />
                  <h3 className="text-lg font-black text-slate-900">No Resume Scans Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                    Upload your resume to generate your Skill Set Match Bar Chart and discover keyword gaps.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-400" />
                    Upload Your First Resume
                  </button>
                </div>
              )}

              {/* Score Progress Trend Section */}
              <div 
                id="personal-score-progress-trend-section"
                className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] space-y-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                      </div>
                      ATS Score Progress Trend
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {selectedCandidateName === 'all' 
                        ? 'Track how resume scores evolve across all revisions and target role adaptations.' 
                        : `Viewing historical revision and score progression for ${selectedCandidateName}.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Candidate Name Dropdown - Deduplicated Single Units */}
                    {uniqueCandidateNames.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 shadow-2xs">
                        <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <label htmlFor="trend-candidate-dropdown" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                          Candidate:
                        </label>
                        <select
                          id="trend-candidate-dropdown"
                          value={selectedCandidateName}
                          onChange={(e) => setSelectedCandidateName(e.target.value)}
                          className="bg-white text-xs font-black text-slate-900 py-1 px-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs font-sans max-w-[220px] truncate"
                          title="Select a candidate to view their individual ATS score progression over time"
                        >
                          <option value="all">All Candidates ({safeResumes.length} scans)</option>
                          {uniqueCandidateNames.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.count} {c.count === 1 ? 'scan' : 'scans'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {chartData.length > 0 && (
                      <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                          <span className="text-slate-800">ATS Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                          <span className="text-slate-800">Job Match %</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Trend Summary Pill */}
                {selectedCandidateName !== 'all' && chartData.length > 0 && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-teal-50/70 border border-teal-200/70 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-teal-900">
                        Showing Trend: <span className="underline decoration-teal-500">{selectedCandidateName}</span>
                      </span>
                      <span className="text-slate-500">
                        ({chartData.length} recorded {chartData.length === 1 ? 'version' : 'versions'} over time)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-600">
                        Latest: <strong className="text-teal-700">{chartData[chartData.length - 1].atsScore}% ATS</strong>
                      </span>
                      {chartData.length > 1 && (
                        <span className="font-bold text-slate-600">
                          Change:{' '}
                          <strong className={chartData[chartData.length - 1].atsScore >= chartData[0].atsScore ? 'text-emerald-700' : 'text-rose-600'}>
                            {chartData[chartData.length - 1].atsScore >= chartData[0].atsScore ? '+' : ''}
                            {chartData[chartData.length - 1].atsScore - chartData[0].atsScore}%
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {chartData.length > 0 ? (
                  <div className="w-full h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="personalAtsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="personalMatchGradient" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#personalAtsGradient)" 
                          activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="matchScore" 
                          name="Job Match (%)" 
                          stroke="#0F172A" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#personalMatchGradient)" 
                          activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="w-full py-12 px-4 rounded-[20px] bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <TrendingUp className="w-8 h-8 text-teal-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">No Score History Yet</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                      Scan your resume to track your progress and see your ATS compatibility grow over time.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Activity Log */}
              <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                        <Clock className="w-5 h-5 text-teal-600" />
                      </div>
                      Recent Activities
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Recent resume scans, target role analyses, and AI score assessments.
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {recentActivities.length} recent events
                  </span>
                </div>

                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act) => (
                      <div 
                        key={act.id} 
                        className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">{act.title}</h4>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{act.description}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 shrink-0">{act.timestamp}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">
                      No recent activities recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Resume Tab */}
          {activeTab === 'upload' && (
            <motion.div 
              key="personal-upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <section className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgb(15,23,42,0.04)]">
                <div className="w-full space-y-6">
                  <div className="text-center space-y-2">
                    <span className="px-3.5 py-1 bg-slate-900 text-teal-400 font-extrabold text-xs rounded-full border border-slate-800 inline-block shadow-xs">
                      Instant Resume Scanner
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Upload Resume to Check ATS Match
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
                      Our parser analyzes your resume formatting, keywords, and skills against your target job title or job description.
                    </p>
                  </div>

                  <ResumeUploadForm 
                    userRole="personal"
                    onAnalyze={(data) => {
                      onAnalyzeNewResume(data);
                    }} 
                    onSelectResume={onSelectResume}
                  />
                </div>
              </section>
            </motion.div>
          )}

          {/* AI Chat Advisor Tab */}
          {activeTab === 'suggestions' && (
            <motion.div
              key="personal-suggestions"
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

          {/* Scan History Tab */}
          {activeTab === 'history' && (
            <motion.div 
              key="personal-history"
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
                    Resume Scan History
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    All your saved resume scans, ATS compatibility breakdowns, and match reports.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-teal-400" />
                  <span>Upload Resume</span>
                </button>
              </div>

              <PersonalResumeTable
                resumes={safeResumes}
                onSelectResume={onSelectResume}
                onDeleteResume={onDeleteResume}
                onViewSkills={handleViewSkills}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
