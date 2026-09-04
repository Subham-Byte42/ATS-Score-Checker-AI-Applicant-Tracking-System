import mongoose, { Schema, Document } from 'mongoose';

export type ResumeProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface IResumeAnalysis {
  skillsFound: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface IResume extends Document {
  userId: string;
  fileName: string;
  fileUrl: string;
  resumeText: string;
  atsScore: number;
  analysis: IResumeAnalysis;
  status: ResumeProcessingStatus;
  createdAt: Date;
  updatedAt: Date;

  // Additional helper fields
  candidateName?: string;
  targetRole?: string;
  jobDescription?: string;
  confidence?: number;
  category?: string;
  sectionScores?: {
    parsing: number;
    formatting: number;
    keywords: number;
    skills: number;
    experience: number;
    projects: number;
    grammar: number;
    education: number;
  };
  missingSections?: string[];
  recommendations?: string[];
  recommendedCertifications?: string[];
  recommendedProjects?: string[];
  nextSteps?: string[];
  fileSize?: number;
  extractedText?: string;
  matchScore?: number;
  summary?: string;
  skills?: {
    found: string[];
    missing: string[];
  };
  strengths?: string[];
  weaknesses?: string[];
  missingKeywords?: string[];
  formattingIssues?: string[];
  improvementSuggestions?: string[];
  suggestions?: string[];
  recommendedRoles?: string[];
  detailedSectionScores?: {
    contactInfo: number;
    formatting: number;
    keywordMatch: number;
    actionVerbs: number;
    experienceImpact: number;
  };
  aiSuggestions?: {
    skillsToLearn: string[];
    missingTechnologies: string[];
    resumeImprovementTips: string[];
    suitableJobRoles: string[];
    interviewPreparationSuggestions: string[];
  };
  fileBuffer?: Buffer;
  uploadDate?: Date;
}

const ResumeSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      default: 'anonymous',
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    resumeText: {
      type: String,
      default: '',
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    analysis: {
      skillsFound: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    candidateName: {
      type: String,
      default: 'Candidate',
    },
    targetRole: {
      type: String,
      default: 'General Software Role',
    },
    jobDescription: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 95,
    },
    category: {
      type: String,
      default: 'Good',
    },
    sectionScores: {
      parsing: { type: Number, default: 85 },
      formatting: { type: Number, default: 85 },
      keywords: { type: Number, default: 80 },
      skills: { type: Number, default: 80 },
      experience: { type: Number, default: 80 },
      projects: { type: Number, default: 80 },
      grammar: { type: Number, default: 90 },
      education: { type: Number, default: 90 },
    },
    missingSections: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    recommendedCertifications: { type: [String], default: [] },
    recommendedProjects: { type: [String], default: [] },
    nextSteps: { type: [String], default: [] },
    fileSize: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      default: '',
    },
    skills: {
      found: { type: [String], default: [] },
      missing: { type: [String], default: [] },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    formattingIssues: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    recommendedRoles: { type: [String], default: [] },
    detailedSectionScores: {
      contactInfo: { type: Number, default: 85 },
      formatting: { type: Number, default: 80 },
      keywordMatch: { type: Number, default: 75 },
      actionVerbs: { type: Number, default: 70 },
      experienceImpact: { type: Number, default: 75 },
    },
    aiSuggestions: {
      skillsToLearn: { type: [String], default: [] },
      missingTechnologies: { type: [String], default: [] },
      resumeImprovementTips: { type: [String], default: [] },
      suitableJobRoles: { type: [String], default: [] },
      interviewPreparationSuggestions: { type: [String], default: [] },
    },
    fileBuffer: {
      type: Buffer,
      select: false,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
