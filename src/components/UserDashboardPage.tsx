import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeRecord } from '../types';
import { DashboardStats } from './DashboardStats';
import { ResumeUploadForm } from './ResumeUploadForm';
import { ResumeTable } from './ResumeTable';
import { AiInsightsCards } from './AiInsightsCards';
import { AiSuggestionsModule } from './AiSuggestionsModule';
import { AiChatbotModule } from './AiChatbotModule';
import { Sidebar, SidebarNavId } from './Sidebar';
import { statItems } from '../data/mockData';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Upload, 
  Sparkles, 
  TrendingUp, 
  History,
  FileText,
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface UserDashboardPageProps {
  user: { name: string; email: string };
  resumes: ResumeRecord[];
  onAnalyzeNewResume: (record: ResumeRecord) => void;
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onLogout: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  user,
  resumes = [],
  onAnalyzeNewResume,
  onSelectResume,
  onDeleteResume,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<SidebarNavId>('home');

  const safeResumes = resumes || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalResumes = safeResumes.length;
  const bestAtsScore = safeResumes.length > 0 
    ? `${Math.max(...safeResumes.map(r => r.atsScore))}%`
    : '0%';
  const analysisDone = safeResumes.filter(r => r.atsScore > 0 || r.status !== 'Pending').length;
  const lastUpload = safeResumes.length > 0 ? safeResumes[0].uploadDate : 'None';

  const chartData = useMemo(() => {
    if (safeResumes.length > 0) {
      const sorted = [...safeResumes].reverse();
      return sorted.map((r, i) => ({
        label: r.uploadDate ? r.uploadDate.split(',')[0] : `Scan #${i + 1}`,
        atsScore: r.atsScore,
        matchScore: r.matchScore,
        targetRole: r.targetRole,
      }));
    }
    return [];
  }, [safeResumes]);

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
          title: `Resume Scanned: ${resume.candidateName}`,
          description: `Target Role: ${resume.targetRole} (${resume.fileName})`,
          timestamp: resume.uploadDate || 'Just now',
          type: 'scan',
          score: resume.atsScore
        });
        if (resume.matchScore >= 80) {
          activities.push({
            id: `act-match-${resume.id}`,
            title: `High Job Match Achieved`,
            description: `${resume.matchScore}% keyword alignment for ${resume.targetRole}`,
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
    <div className="flex flex-col md:flex-row items-start gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeItem={activeTab}
        onSelectItem={setActiveTab}
        onLogout={onLogout}
      />

      {/* Dashboard Main Content Area */}
      <div className="flex-1 w-full min-w-0 space-y-8">
        <AnimatePresence mode="wait">

        {/* Home Tab View */}
        {activeTab === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Clean Header Greeting */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-xs space-y-3">
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="bg-gradient-to-r from-[#1877f2] via-indigo-600 to-slate-900 bg-clip-text text-transparent">
                  {getGreeting()}, {user.name || 'Subham'}
                </span>
              </h1>
              <p 
                className="text-base sm:text-lg font-medium text-slate-600 tracking-wide"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Ready to improve your resume today?
              </p>
            </div>

            {/* Stats Overview Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Resumes */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Resumes
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {totalResumes}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1877f2] flex items-center justify-center shrink-0">
                  <FileText className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Best ATS Score */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Best ATS Score
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-600">
                    {bestAtsScore}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Analysis Done */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Analysis Done
                  </p>
                  <p className="text-2xl font-extrabold text-indigo-600">
                    {analysisDone}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Last Upload */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Last Upload
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 truncate" title={lastUpload}>
                    {lastUpload}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5.5 h-5.5" />
                </div>
              </div>
            </div>

            {/* Resume Progress Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1877f2]" />
                    Resume Progress
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tracks your ATS score & job match rate improvements over time.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#1877f2]"></span>
                    <span className="text-slate-700">ATS Score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700">Match Score</span>
                  </div>
                </div>
              </div>

              {/* Progress Line Chart */}
              {chartData.length > 0 ? (
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="atsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1877f2" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1877f2" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="matchGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '0.75rem', 
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="atsScore" 
                        name="ATS Score (%)" 
                        stroke="#1877f2" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#atsGradient)" 
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="matchScore" 
                        name="Job Match (%)" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#matchGradient)" 
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Score Progress Records Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload your first resume in the "Upload resume" tab to start tracking real-time ATS score progress.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#1877f2]" />
                    Recent Activities
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live log of your recent resume scans, updates, and AI score analyses.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {recentActivities.length} recent events
                </span>
              </div>

              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => {
                    let Icon = FileText;
                    let iconBg = 'bg-blue-50 text-[#1877f2]';
                    if (act.type === 'scan') {
                      Icon = FileText;
                      iconBg = 'bg-blue-50 text-[#1877f2]';
                    } else if (act.type === 'upload') {
                      Icon = Upload;
                      iconBg = 'bg-emerald-50 text-emerald-600';
                    } else if (act.type === 'insight') {
                      Icon = Sparkles;
                      iconBg = 'bg-indigo-50 text-indigo-600';
                    } else if (act.type === 'score') {
                      Icon = Award;
                      iconBg = 'bg-amber-50 text-amber-600';
                    }

                    return (
                      <div 
                        key={act.id} 
                        className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{act.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-semibold text-slate-400">{act.timestamp}</span>
                          {act.score !== undefined && (
                            <span className="mt-1 px-2 py-0.5 bg-blue-50 text-[#1877f2] font-bold text-[10px] rounded-full border border-blue-100">
                              {act.score}% Score
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-1.5">
                    <Clock className="w-7 h-7 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-800">No Recent Activity</h4>
                    <p className="text-[11px] text-slate-500">
                      Scanned resumes and AI analysis logs will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upload Resume Tab View */}
        {activeTab === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <span className="px-3 py-1 bg-blue-50 text-[#1877f2] font-bold text-xs rounded-full border border-blue-100 inline-block">
                    Instant Resume Scanner
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Upload Resume to Check ATS Match
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Our AI parser compares your resume formatting, keywords, and skills against target job descriptions.
                  </p>
                </div>

                <ResumeUploadForm onAnalyze={(data) => {
                  onAnalyzeNewResume(data);
                  setActiveTab('history');
                }} />
              </div>
            </section>
          </motion.div>
        )}

        {/* AI Suggestions / Chatbot Tab View */}
        {activeTab === 'suggestions' && (
          <motion.div
            key="suggestions"
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

        {/* History Tab View */}
        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1877f2]" />
                  Scan History
                </h2>
                <p className="text-xs text-slate-500">All saved candidate resumes and match score reports.</p>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-[#1877f2] hover:bg-[#0866ff] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Resume</span>
              </button>
            </div>

            <ResumeTable
              resumes={safeResumes}
              onSelectResume={onSelectResume}
              onDeleteResume={onDeleteResume}
            />
          </motion.div>
        )}

        </AnimatePresence>
      </div>
    </div>
  );
};
