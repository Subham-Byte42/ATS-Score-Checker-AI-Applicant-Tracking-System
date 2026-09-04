/**
 * Decoupled Role Schemas for Personal (Job Seeker) and Recruiter Portals
 * 
 * In accordance with strict development rules:
 * - Personal and Recruiter schemas remain completely independent.
 * - Modifications to Personal schemas do NOT bleed into Recruiter schemas.
 */

import { DetailedSectionScores, CandidateFitRating, RecruiterEvaluation } from '../types';

// ==========================================
// 1. PERSONAL (JOB SEEKER) PORTAL SCHEMAS
// ==========================================

export interface PersonalResumeRecord {
  id: string;
  candidateName: string;
  fileName: string;
  fileSize: string | number;
  targetRole: string;
  uploadDate: string;
  atsScore: number;
  matchScore: number;
  confidence?: number;
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

export interface PersonalAnalysisSchema {
  atsScore: number;
  confidence: number;
  category: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement';
  sectionScores: DetailedSectionScores;
  missingSections: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recommendations: string[];
  recommendedRoles: string[];
  recommendedCertifications: string[];
  recommendedProjects: string[];
  nextSteps: string[];
}

export const personalPromptConfig = {
  systemPrompt: `You are an expert ATS (Applicant Tracking System) resume analyzer helping a job seeker optimize their resume for applicant tracking algorithms, recruiter readability, and career advancement.`,
  analysisFocus: ['keyword_match', 'formatting', 'quantifiable_impact', 'action_verbs', 'skills_gap'] as const,
};

// ==========================================
// 2. RECRUITER PORTAL SCHEMAS
// ==========================================

export interface RecruiterCandidateRecord {
  id: string;
  candidateName: string;
  fileName: string;
  fileSize: string | number;
  targetRole: string;
  uploadDate: string;
  folderName: string;
  atsScore: number;
  matchScore: number;
  confidence?: number;
  category?: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement' | 'Pending';
  status: 'Excellent' | 'Good' | 'Needs Improvement' | 'Pending';
  recruiterEvaluation: RecruiterEvaluation;
  missingSkills: string[];
  matchedKeywords: string[];
  sectionScores?: DetailedSectionScores;
  jobDescription?: string;
  notes?: string;
}

export interface RecruiterEvaluationSchema {
  fitRating: CandidateFitRating;
  candidateFitScore: number;
  hiringRecommendation: string;
  keyStrengths: string[];
  redFlags: string[];
  skillGaps: string[];
  tailoredInterviewQuestions: {
    technical: string[];
    behavioral: string[];
  };
  candidateNotes?: string;
}

export const recruiterPromptConfig = {
  systemPrompt: `You are a Senior Technical Recruiter and Hiring Committee Evaluator assessing candidates for organizational fit, red flags, technical competencies, and tailored interview questions.`,
  evaluationFocus: ['hiring_decision', 'interview_shortlist', 'red_flags', 'technical_gaps', 'cohort_ranking'] as const,
};
