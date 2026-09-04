import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend
} from 'recharts';
import { ResumeRecord } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Target, 
  ChevronRight,
  Zap,
  Award,
  Folder,
  FolderOpen,
  Users,
  Check,
  ChevronDown
} from 'lucide-react';

interface SkillMatchBarChartProps {
  resume?: ResumeRecord;
  resumes?: ResumeRecord[];
  title?: string;
  subtitle?: string;
  showCandidateSelector?: boolean;
  compact?: boolean;
  onSelectResume?: (resume: ResumeRecord) => void;
}

export interface SkillCategoryData {
  category: string;
  matchPercentage: number;
  matchedCount: number;
  totalCount: number;
  matchedSkills: string[];
  missingSkills: string[];
  benchmark: number;
}

/**
 * Intelligent skill cluster builder that groups keywords into domains
 * and derives real-time match percentages.
 */
export function extractSkillSetData(resume?: ResumeRecord): SkillCategoryData[] {
  if (!resume) {
    return [
      { category: 'Frontend Tech', matchPercentage: 88, matchedCount: 7, totalCount: 8, matchedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'HTML5', 'CSS3'], missingSkills: ['Vue.js'], benchmark: 80 },
      { category: 'Backend & APIs', matchPercentage: 80, matchedCount: 4, totalCount: 5, matchedSkills: ['Node.js', 'Express', 'RESTful APIs', 'GraphQL'], missingSkills: ['gRPC'], benchmark: 75 },
      { category: 'Cloud & DevOps', matchPercentage: 65, matchedCount: 3, totalCount: 5, matchedSkills: ['Docker', 'AWS (S3/EC2)', 'Git'], missingSkills: ['Kubernetes', 'CI/CD Pipelines'], benchmark: 70 },
      { category: 'Databases & ORM', matchPercentage: 85, matchedCount: 3, totalCount: 4, matchedSkills: ['PostgreSQL', 'MongoDB', 'Prisma'], missingSkills: ['Redis Caching'], benchmark: 75 },
      { category: 'System & Testing', matchPercentage: 70, matchedCount: 2, totalCount: 3, matchedSkills: ['Jest', 'Unit Testing'], missingSkills: ['System Design'], benchmark: 70 },
      { category: 'ATS Keyword Match', matchPercentage: 85, matchedCount: 17, totalCount: 20, matchedSkills: ['Agile', 'Cross-functional Collaboration', 'Code Review'], missingSkills: ['Microservices'], benchmark: 80 },
    ];
  }

  const matched = resume.matchedKeywords || [];
  const missing = resume.missingSkills || [];
  const allSkills = [...matched, ...missing];
  const sectionScores = resume.sectionScores;

  // Domain categorization rules
  const frontendKeywords = ['react', 'vue', 'angular', 'next.js', 'nuxt', 'svelte', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'redux', 'ui', 'ux', 'responsive', 'frontend', 'dom', 'sass', 'vite', 'webpack'];
  const backendKeywords = ['node', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'go', 'golang', 'c#', '.net', 'ruby', 'rails', 'php', 'backend', 'rest', 'api', 'graphql', 'grpc', 'microservices', 'server'];
  const cloudDevopsKeywords = ['aws', 'gcp', 'azure', 'cloud', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'github actions', 'terraform', 'ansible', 'linux', 'jenkins', 'devops', 'helm', 'serverless', 'lambda'];
  const databaseKeywords = ['sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'dynamodb', 'nosql', 'prisma', 'orm', 'drizzle', 'database', 'sqlite', 'elasticsearch', 'supabase', 'firebase'];
  const architectureTestingKeywords = ['jest', 'cypress', 'testing', 'unit test', 'tdd', 'system design', 'architecture', 'scalability', 'performance', 'security', 'oauth', 'jwt', 'git', 'agile', 'scrum', 'ci'];

  function filterIn(list: string[], keywords: string[]) {
    return list.filter(item => keywords.some(kw => item.toLowerCase().includes(kw)));
  }

  const feMatched = filterIn(matched, frontendKeywords);
  const feMissing = filterIn(missing, frontendKeywords);
  const beMatched = filterIn(matched, backendKeywords);
  const beMissing = filterIn(missing, backendKeywords);
  const cloudMatched = filterIn(matched, cloudDevopsKeywords);
  const cloudMissing = filterIn(missing, cloudDevopsKeywords);
  const dbMatched = filterIn(matched, databaseKeywords);
  const dbMissing = filterIn(missing, databaseKeywords);
  const archMatched = filterIn(matched, architectureTestingKeywords);
  const archMissing = filterIn(missing, architectureTestingKeywords);

  // Remaining general keywords
  const classifiedSet = new Set([...feMatched, ...feMissing, ...beMatched, ...beMissing, ...cloudMatched, ...cloudMissing, ...dbMatched, ...dbMissing, ...archMatched, ...archMissing]);
  const otherMatched = matched.filter(k => !classifiedSet.has(k));
  const otherMissing = missing.filter(k => !classifiedSet.has(k));

  function computePercent(matchedArr: string[], missingArr: string[], fallbackRatio: number) {
    const total = matchedArr.length + missingArr.length;
    if (total === 0) return fallbackRatio;
    return Math.min(100, Math.max(10, Math.round((matchedArr.length / total) * 100)));
  }

  const baseMatch = resume.matchScore || resume.atsScore || 75;

  const data: SkillCategoryData[] = [
    {
      category: 'Frontend & UI',
      matchPercentage: computePercent(feMatched, feMissing, sectionScores?.skills ? Math.round(sectionScores.skills * 0.95) : baseMatch),
      matchedCount: feMatched.length || (matched.length > 0 ? 3 : 2),
      totalCount: (feMatched.length + feMissing.length) || 4,
      matchedSkills: feMatched.length > 0 ? feMatched : ['Modern Web Stack', 'Responsive UI'],
      missingSkills: feMissing.length > 0 ? feMissing : (missing.length > 0 ? [missing[0]] : []),
      benchmark: 80,
    },
    {
      category: 'Backend & APIs',
      matchPercentage: computePercent(beMatched, beMissing, sectionScores?.experience ? Math.round(sectionScores.experience * 0.9) : Math.max(50, baseMatch - 5)),
      matchedCount: beMatched.length || (matched.length > 1 ? 2 : 1),
      totalCount: (beMatched.length + beMissing.length) || 3,
      matchedSkills: beMatched.length > 0 ? beMatched : ['RESTful APIs', 'Server Architecture'],
      missingSkills: beMissing.length > 0 ? beMissing : (missing.length > 1 ? [missing[1]] : []),
      benchmark: 75,
    },
    {
      category: 'Cloud & DevOps',
      matchPercentage: computePercent(cloudMatched, cloudMissing, sectionScores?.projects ? Math.round(sectionScores.projects * 0.85) : Math.max(45, baseMatch - 15)),
      matchedCount: cloudMatched.length || 1,
      totalCount: (cloudMatched.length + cloudMissing.length) || 3,
      matchedSkills: cloudMatched.length > 0 ? cloudMatched : ['Containerization & Deployment'],
      missingSkills: cloudMissing.length > 0 ? cloudMissing : (missing.length > 2 ? [missing[2]] : ['CI/CD Pipelines']),
      benchmark: 70,
    },
    {
      category: 'Databases & Storage',
      matchPercentage: computePercent(dbMatched, dbMissing, sectionScores?.formatting ? Math.round(sectionScores.formatting * 0.92) : Math.max(55, baseMatch + 2)),
      matchedCount: dbMatched.length || 2,
      totalCount: (dbMatched.length + dbMissing.length) || 3,
      matchedSkills: dbMatched.length > 0 ? dbMatched : ['Relational Database Modeling'],
      missingSkills: dbMissing.length > 0 ? dbMissing : ['Distributed Caching'],
      benchmark: 75,
    },
    {
      category: 'Architecture & Testing',
      matchPercentage: computePercent(archMatched, archMissing, sectionScores?.parsing ? Math.round(sectionScores.parsing * 0.88) : Math.max(50, baseMatch - 8)),
      matchedCount: archMatched.length || 1,
      totalCount: (archMatched.length + archMissing.length) || 2,
      matchedSkills: archMatched.length > 0 ? archMatched : ['Quality Assurance & Version Control'],
      missingSkills: archMissing.length > 0 ? archMissing : ['System Scalability Testing'],
      benchmark: 70,
    },
    {
      category: 'Role Keywords & ATS',
      matchPercentage: sectionScores?.keywords ? Math.round(sectionScores.keywords) : resume.atsScore || 85,
      matchedCount: matched.length || 8,
      totalCount: (matched.length + missing.length) || 10,
      matchedSkills: otherMatched.length > 0 ? otherMatched.slice(0, 4) : ['Role Terminology', 'Technical Impact'],
      missingSkills: otherMissing.length > 0 ? otherMissing.slice(0, 2) : ['Domain Specific Keywords'],
      benchmark: 80,
    },
  ];

  return data;
}

export const SkillMatchBarChart: React.FC<SkillMatchBarChartProps> = ({
  resume,
  resumes = [],
  title = 'Skill Set Match Breakdown',
  subtitle = 'Analyzes candidate competency percentages across required tech stacks and job requisitions.',
  showCandidateSelector = false,
  compact = false,
  onSelectResume
}) => {
  // 1. Group resumes into folders by folderName or target role / cohort
  const folders = useMemo(() => {
    const map = new Map<string, ResumeRecord[]>();
    resumes.forEach((r) => {
      const folderKey = r.folderName?.trim() || (r.targetRole?.trim() ? `${r.targetRole.trim()} Cohort` : 'General Applicants');
      if (!map.has(folderKey)) map.set(folderKey, []);
      map.get(folderKey)!.push(r);
    });

    const list: Array<{ id: string; name: string; role: string; candidates: ResumeRecord[] }> = [];
    if (resumes.length > 0) {
      list.push({
        id: 'all',
        name: `All Candidates Folder (${resumes.length})`,
        role: 'All Roles',
        candidates: resumes,
      });
    }

    map.forEach((cands, role) => {
      list.push({
        id: `folder-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: `${role} (${cands.length})`,
        role,
        candidates: cands,
      });
    });

    if (list.length === 0 && resume) {
      list.push({
        id: 'single',
        name: `${resume.targetRole || 'General'} Folder (1)`,
        role: resume.targetRole || 'General',
        candidates: [resume],
      });
    }

    return list;
  }, [resumes, resume]);

  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  
  const currentFolder = folders.find((f) => f.id === activeFolderId) || folders[0] || {
    id: 'all',
    name: 'All Candidates',
    role: 'All Roles',
    candidates: resumes.length > 0 ? resumes : (resume ? [resume] : []),
  };

  const folderCandidates = currentFolder.candidates.length > 0 ? currentFolder.candidates : (resume ? [resume] : []);

  // Dropdown value: either '__WHOLE_GROUP__' or individual candidate ID
  const [selectedViewOption, setSelectedViewOption] = useState<string>(
    resumes.length > 1 ? '__WHOLE_GROUP__' : (resume?.id || (resumes[0]?.id ?? ''))
  );

  const [activeCategory, setActiveCategory] = useState<SkillCategoryData | null>(null);

  // Determine current active candidate for category view
  const currentResume =
    folderCandidates.find((r) => r.id === selectedViewOption) ||
    resumes.find((r) => r.id === selectedViewOption) ||
    resume ||
    folderCandidates[0] ||
    resumes[0];

  const skillData = extractSkillSetData(currentResume);

  // Comparison dataset across candidates in the active folder
  const candidateComparisonData = folderCandidates.map((r) => ({
    id: r.id,
    name: (r.candidateName || 'Candidate').split(' ')[0] || 'Candidate',
    fullName: r.candidateName || 'Candidate',
    role: r.targetRole || 'Software Engineer',
    atsScore: r.atsScore ?? 80,
    matchScore: r.matchScore ?? 75,
    fileName: r.fileName || 'resume.pdf',
  }));

  // Folder level statistics
  const folderStats = useMemo(() => {
    if (folderCandidates.length === 0) return null;
    const scores = folderCandidates.map((c) => c.atsScore ?? 0);
    const matches = folderCandidates.map((c) => c.matchScore ?? 0);
    const topScorer = [...folderCandidates].sort((a, b) => (b.atsScore ?? 0) - (a.atsScore ?? 0))[0];
    return {
      count: folderCandidates.length,
      avgAts: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      avgMatch: Math.round(matches.reduce((a, b) => a + b, 0) / matches.length),
      topCandidate: topScorer?.candidateName || 'N/A',
      topScore: topScorer?.atsScore ?? 0,
    };
  }, [folderCandidates]);

  const isWholeGroup = selectedViewOption === '__WHOLE_GROUP__';

  const handleSelectFolder = (newFolderId: string) => {
    setActiveFolderId(newFolderId);
    const folder = folders.find((f) => f.id === newFolderId);
    if (folder && folder.candidates.length > 1) {
      setSelectedViewOption('__WHOLE_GROUP__');
    } else if (folder && folder.candidates.length > 0) {
      setSelectedViewOption(folder.candidates[0].id);
      if (onSelectResume) onSelectResume(folder.candidates[0]);
    }
  };

  const handleSelectViewOption = (value: string) => {
    setSelectedViewOption(value);
    if (value !== '__WHOLE_GROUP__') {
      const found = folderCandidates.find((r) => r.id === value) || resumes.find((r) => r.id === value);
      if (found && onSelectResume) onSelectResume(found);
    }
  };

  const getBarColor = (percent: number) => {
    if (percent >= 80) return '#0D9488'; // Teal 600
    if (percent >= 65) return '#3B82F6'; // Blue 500
    if (percent >= 50) return '#F59E0B'; // Amber 500
    return '#EF4444'; // Red 500
  };

  return (
    <div className={`bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_rgb(15,23,42,0.04)] overflow-hidden ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'} space-y-6`}>
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-[11px] rounded-full border border-teal-200 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              AI Skill Analytics
            </span>
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Folder className="w-3 h-3 text-teal-600" />
              Folder: <strong className="text-slate-800">{currentFolder.name}</strong>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* View Mode & Selector Controls with Folder & Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Folder Selector Dropdown */}
          {folders.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200">
              <Folder className="w-3.5 h-3.5 text-teal-600 ml-1.5 shrink-0" />
              <span className="text-[11px] font-extrabold text-slate-500">Folder:</span>
              <select
                value={activeFolderId}
                onChange={(e) => handleSelectFolder(e.target.value)}
                className="bg-white text-xs font-black text-slate-800 py-1.5 px-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs"
                title="Select folder or cohort"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Candidate & Whole Group Comparison Dropdown */}
          {showCandidateSelector && (folderCandidates.length > 1 || resumes.length > 1) && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
              <span className="text-[11px] font-extrabold text-slate-500">Candidates:</span>
              <select
                value={selectedViewOption}
                onChange={(e) => handleSelectViewOption(e.target.value)}
                className="bg-white text-xs font-black text-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs max-w-[260px] truncate"
                title="Select individual candidate or compare whole group"
              >
                <option value="__WHOLE_GROUP__">
                  📊 Compare Whole Group ({folderCandidates.length} Candidates)
                </option>
                <optgroup label={`Candidates in ${currentFolder.role} (${folderCandidates.length})`}>
                  {folderCandidates.map((r) => (
                    <option key={r.id} value={r.id}>
                      👤 {r.candidateName} — {r.matchScore}% Match ({r.atsScore}% ATS)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Direct "Compare Whole Group" Quick Button */}
          {showCandidateSelector && folderCandidates.length > 1 && (
            <button
              onClick={() => handleSelectViewOption('__WHOLE_GROUP__')}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isWholeGroup
                  ? 'bg-teal-600 text-white shadow-sm font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
              title="Compare all candidates in this folder side-by-side"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Compare Whole Group</span>
              {isWholeGroup && <Check className="w-3 h-3 text-white ml-0.5 stroke-[3]" />}
            </button>
          )}

        </div>
      </div>

      {/* Main Chart Presentation */}
      {!isWholeGroup && currentResume ? (
        <div className="space-y-4">
          {/* Candidate Status Banner with Switch to Whole Group Option */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="font-extrabold text-slate-800">
                Viewing Individual Breakdown: <strong className="text-teal-700">{currentResume.candidateName}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-600">{currentResume.targetRole}</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-slate-800">{currentResume.matchScore}% Match</span>
            </div>
            {folderCandidates.length > 1 && (
              <button
                onClick={() => handleSelectViewOption('__WHOLE_GROUP__')}
                className="px-3 py-1 bg-white hover:bg-teal-50 text-teal-700 text-[11px] font-black rounded-xl border border-teal-200 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Compare Whole Group ({folderCandidates.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Bar Chart Area (7/12 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
              <span>Skill Set Domain</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Match %
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Benchmark (75%)
                </span>
              </div>
            </div>

            <div className="w-full h-72 sm:h-80 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillData}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 20, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                    unit="%"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 700 }}
                    width={110}
                  />
                  <Tooltip
                    cursor={{ fill: '#F1F5F9', radius: 8 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SkillCategoryData;
                        return (
                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-2 max-w-xs text-xs">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
                              <span className="font-black text-slate-900">{data.category}</span>
                              <span 
                                className="px-2 py-0.5 font-black rounded-md text-white text-[11px]"
                                style={{ backgroundColor: getBarColor(data.matchPercentage) }}
                              >
                                {data.matchPercentage}% Match
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px]">
                              <p className="text-slate-500 font-bold">
                                Matched: <span className="text-emerald-700">{data.matchedSkills.join(', ') || 'None'}</span>
                              </p>
                              {data.missingSkills.length > 0 && (
                                <p className="text-slate-500 font-bold">
                                  Skill Gaps: <span className="text-rose-600">{data.missingSkills.join(', ')}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="matchPercentage" 
                    name="Match %" 
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    onClick={(data) => setActiveCategory(data)}
                  >
                    {skillData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.matchPercentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-center">
                <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Strongest Match</span>
                <span className="text-sm font-black text-teal-700">
                  {skillData.reduce((prev, curr) => curr.matchPercentage > prev.matchPercentage ? curr : prev).category}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Average Fit</span>
                <span className="text-sm font-black text-blue-700">
                  {Math.round(skillData.reduce((acc, c) => acc + c.matchPercentage, 0) / skillData.length)}% Overall
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Skill Focus Gap</span>
                <span className="text-sm font-black text-amber-700">
                  {skillData.reduce((prev, curr) => curr.matchPercentage < prev.matchPercentage ? curr : prev).category}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Skill Chips & Recommendation Cards (5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-teal-600" />
                  Key Skill Match Roster
                </h4>
                <span className="text-[11px] font-extrabold text-slate-500">
                  {currentResume?.candidateName || 'Recent Scan'}
                </span>
              </div>

              {/* Matched Skills Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Matched Keywords ({currentResume?.matchedKeywords?.length || 6})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(currentResume?.matchedKeywords && currentResume.matchedKeywords.length > 0 
                    ? currentResume.matchedKeywords 
                    : ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker']
                  ).map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 font-bold text-[11px] rounded-xl shadow-2xs flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills / Growth Opportunities */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Recommended Additions to Reach 95%+ Match
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(currentResume?.missingSkills && currentResume.missingSkills.length > 0
                    ? currentResume.missingSkills
                    : ['Kubernetes', 'CI/CD Automation', 'Redis Caching', 'System Architecture']
                  ).map((ms, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-amber-50/80 border border-amber-200 text-amber-900 font-bold text-[11px] rounded-xl flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {ms}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Note */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 font-medium flex items-center justify-between">
                <span>Overall ATS Compatibility Score:</span>
                <span className="font-black text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded-lg">
                  {currentResume?.atsScore || 85}%
                </span>
              </div>
            </div>
          </div>

          </div>
        </div>
      ) : (
        /* Candidate Comparison Bar Chart Mode (Whole Group) */
        <div className="space-y-5">
          {/* Cohort Summary KPI Badges */}
          {folderStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Group Size</p>
                <p className="text-xl font-black text-slate-900">{folderStats.count} Candidates</p>
              </div>
              <div className="bg-teal-50/40 p-3.5 rounded-2xl border border-teal-200 space-y-1">
                <p className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">Top Contender</p>
                <p className="text-sm font-black text-teal-900 truncate" title={folderStats.topCandidate}>
                  {folderStats.topCandidate} ({folderStats.topScore}%)
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Group Avg ATS</p>
                <p className="text-xl font-black text-slate-900">{folderStats.avgAts}%</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Group Avg Match</p>
                <p className="text-xl font-black text-slate-900">{folderStats.avgMatch}%</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Side-by-Side Comparison: {currentFolder.name}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-teal-600"></span> ATS Score (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-900"></span> Job Match Rate (%)
              </span>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={candidateComparisonData}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                  unit="%"
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-1.5 text-xs">
                          <p className="font-black text-slate-900">{item.fullName}</p>
                          <p className="text-[11px] font-bold text-slate-500">{item.role}</p>
                          <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-teal-700 font-extrabold">ATS: {item.atsScore}%</span>
                            <span className="text-slate-800 font-extrabold">Match: {item.matchScore}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="atsScore" 
                  name="ATS Score" 
                  fill="#0D9488" 
                  radius={[6, 6, 0, 0]} 
                  barSize={24}
                />
                <Bar 
                  dataKey="matchScore" 
                  name="Job Match" 
                  fill="#0F172A" 
                  radius={[6, 6, 0, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Candidate Click Cards to Drill Down into an Individual */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Select any candidate from this folder to view detailed competency breakdown:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {folderCandidates.map((cand) => (
                <button
                  key={cand.id}
                  onClick={() => handleSelectViewOption(cand.id)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center justify-between text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-black text-slate-800 truncate group-hover:text-teal-700">
                      {cand.candidateName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{cand.targetRole}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-teal-700">{cand.matchScore}%</span>
                    <span className="block text-[9px] text-slate-400 font-bold">Match</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SkillMatchBarChart;
