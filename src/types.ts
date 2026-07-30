export interface DetailedSectionScores {
  parsing: number;
  formatting: number;
  keywords: number;
  skills: number;
  experience: number;
  projects: number;
  grammar: number;
  education: number;
}

export interface ResumeRecord {
  id: string;
  candidateName: string;
  fileName: string;
  fileSize: string;
  targetRole: string;
  uploadDate: string;
  atsScore: number;
  matchScore: number;
  confidence?: number;
  category?: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement' | 'Pending';
  status: 'Excellent' | 'Good' | 'Needs Improvement' | 'Pending';
  missingSkills: string[];
  matchedKeywords: string[];
  missingSections?: string[];
  sectionScores?: DetailedSectionScores;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  recommendations?: string[];
  recommendedRoles?: string[];
  recommendedCertifications?: string[];
  recommendedProjects?: string[];
  nextSteps?: string[];
  jobDescription?: string;
}

export interface AnalysisResponseData {
  success: boolean;
  resumeId: string;
  status: 'completed' | 'uploaded' | 'processing' | 'failed';
  atsScore: number;
  confidence?: number;
  category?: string;
  sectionScores?: DetailedSectionScores;
  missingSections?: string[];
  analysis: {
    skillsFound: string[];
    missingSkills: string[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    recommendedRoles: string[];
    recommendations?: string[];
    recommendedCertifications?: string[];
    recommendedProjects?: string[];
    nextSteps?: string[];
  };
  data?: any;
}

export interface StatItem {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  description: string;
  iconName: string;
}

export interface Recommendation {
  id: string;
  type: 'critical' | 'warning' | 'success';
  title: string;
  description: string;
  impact: string;
}
