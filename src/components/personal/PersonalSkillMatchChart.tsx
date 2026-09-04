import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { ResumeRecord } from '../../types';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Target,
  ChevronRight,
  FileText,
  User
} from 'lucide-react';

export interface PersonalSkillCategoryData {
  category: string;
  matchPercentage: number;
  matchedCount: number;
  totalCount: number;
  matchedSkills: string[];
  missingSkills: string[];
  benchmark: number;
}

function extractPersonalSkillSetData(resume?: ResumeRecord): PersonalSkillCategoryData[] {
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
  const sectionScores = resume.sectionScores;

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

  const classifiedSet = new Set([...feMatched, ...feMissing, ...beMatched, ...beMissing, ...cloudMatched, ...cloudMissing, ...dbMatched, ...dbMissing, ...archMatched, ...archMissing]);
  const otherMatched = matched.filter(k => !classifiedSet.has(k));
  const otherMissing = missing.filter(k => !classifiedSet.has(k));

  function computePercent(matchedArr: string[], missingArr: string[], fallbackRatio: number) {
    const total = matchedArr.length + missingArr.length;
    if (total === 0) return fallbackRatio;
    return Math.min(100, Math.max(10, Math.round((matchedArr.length / total) * 100)));
  }

  const baseMatch = resume.matchScore || resume.atsScore || 75;

  return [
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
}

export interface PersonalSkillMatchChartProps {
  resume?: ResumeRecord;
  resumes?: ResumeRecord[];
  selectedResumeId?: string | null;
  onSelectResumeId?: (id: string) => void;
  title?: string;
  subtitle?: string;
  onSelectResume?: (resume: ResumeRecord) => void;
}

export const PersonalSkillMatchChart: React.FC<PersonalSkillMatchChartProps> = ({
  resume,
  resumes = [],
  selectedResumeId,
  onSelectResumeId,
  title = 'Skill Set Match & Competency Graph',
  subtitle = "Detailed visual bar chart analyzing your resume's keyword and competency alignment for your target role.",
  onSelectResume
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedResumeId || resume?.id || (resumes.length > 0 ? resumes[0].id : null)
  );

  useEffect(() => {
    if (selectedResumeId) {
      setInternalSelectedId(selectedResumeId);
    } else if (resume?.id) {
      setInternalSelectedId(resume.id);
    }
  }, [selectedResumeId, resume?.id]);

  const currentResume = useMemo(() => {
    if (internalSelectedId && resumes.length > 0) {
      const found = resumes.find((r) => r.id === internalSelectedId);
      if (found) return found;
    }
    return resume || (resumes.length > 0 ? resumes[0] : undefined);
  }, [internalSelectedId, resumes, resume]);

  const skillData = extractPersonalSkillSetData(currentResume);

  const handleCandidateChange = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectResumeId) {
      onSelectResumeId(id);
    }
    const found = resumes.find((r) => r.id === id);
    if (found && onSelectResume) {
      onSelectResume(found);
    }
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 85) return '#0D9488'; // Teal
    if (percentage >= 70) return '#3B82F6'; // Blue
    if (percentage >= 50) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const strongestCategory = skillData.reduce((prev, curr) => 
    curr.matchPercentage > prev.matchPercentage ? curr : prev, skillData[0]
  );
  const weakestCategory = skillData.reduce((prev, curr) => 
    curr.matchPercentage < prev.matchPercentage ? curr : prev, skillData[0]
  );
  const averageMatch = Math.round(
    skillData.reduce((acc, c) => acc + c.matchPercentage, 0) / skillData.length
  );

  return (
    <div 
      id="personal-skill-graph-section"
      className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_rgb(15,23,42,0.04)] overflow-hidden p-6 sm:p-8 space-y-6 transition-all duration-300"
    >
      {/* Header Bar - Clean Job Seeker View with Candidate Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-[11px] rounded-full border border-teal-200 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              AI Skill Analytics
            </span>
            {currentResume?.targetRole && (
              <span className="text-xs text-slate-500 font-bold">
                Target Role: <strong className="text-slate-800">{currentResume.targetRole}</strong>
              </span>
            )}
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

        {/* Candidate Dropdown Selector & Info Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {resumes.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-2xl border border-slate-200 shadow-2xs">
              <User className="w-4 h-4 text-teal-600 shrink-0" />
              <label htmlFor="personal-candidate-dropdown" className="text-xs font-black text-slate-700 whitespace-nowrap">
                Candidate:
              </label>
              <select
                id="personal-candidate-dropdown"
                value={currentResume?.id || ''}
                onChange={(e) => handleCandidateChange(e.target.value)}
                className="bg-white text-xs font-black text-slate-900 py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs font-sans min-w-[200px] max-w-[320px] truncate"
                title="Select candidate to view skill set domain and competency graph"
              >
                {resumes.map((r, idx) => (
                  <option key={r.id || idx} value={r.id}>
                    {r.candidateName ? `${r.candidateName} — ` : ''}{r.targetRole || r.fileName} ({r.atsScore}% ATS)
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentResume && (
            <div className="flex items-center gap-2 bg-teal-50/80 py-1.5 px-3 rounded-2xl border border-teal-200/80 shadow-2xs">
              <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                <span className="text-teal-700 font-extrabold text-[11px]">Active: </span>
                <strong className="text-slate-900">{currentResume.candidateName || currentResume.fileName}</strong>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-teal-600 text-white text-[10px] font-black">
                {currentResume.atsScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Presentation */}
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
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as PersonalSkillCategoryData;
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
                {strongestCategory.category}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Average Fit</span>
              <span className="text-sm font-black text-blue-700">
                {averageMatch}% Overall
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Skill Focus Gap</span>
              <span className="text-sm font-black text-amber-700">
                {weakestCategory.category}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Skill Chips & Recommendations (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-600" />
                Target Skill Roster
              </h4>
              <span className="text-[11px] font-extrabold text-slate-500 truncate max-w-[150px]">
                {currentResume?.candidateName || currentResume?.fileName || 'Recent Scan'}
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
  );
};
