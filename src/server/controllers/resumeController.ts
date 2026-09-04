import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { extractDocumentText, extractTextFromPDF } from '../services/documentExtractorService.js';
import { analyzeResumeText, generateAISuggestions, chatAboutResume } from '../services/resumeAnalyzerService.js';
import { Resume } from '../models/Resume.js';

// In-memory store for fallback demo mode when MongoDB is not connected
export const inMemoryResumes: Array<any> = [
  {
    _id: 'res_demo_101',
    userId: 'user_demo_101',
    fileName: 'Alex_Morgan_Resume_2026.pdf',
    fileUrl: '/uploads/Alex_Morgan_Resume_2026.pdf',
    resumeText: 'Alex Morgan - Senior Full Stack Engineer with 6+ years React, Node.js, TypeScript...',
    atsScore: 92,
    analysis: {
      skillsFound: ['React', 'TypeScript', 'Node.js', 'Express', 'Tailwind CSS', 'REST APIs'],
      missingSkills: ['Docker', 'Kubernetes', 'GraphQL'],
      strengths: ['High keyword density', 'Quantifiable metrics included', 'Clear section hierarchy'],
      weaknesses: ['Slightly dense technical skills block'],
      suggestions: ['Add a dedicated summary header at top', 'Include link to portfolio'],
    },
    status: 'completed',
    candidateName: 'Alex Morgan',
    targetRole: 'Senior Full Stack Engineer',
    fileSize: 245120,
    matchScore: 88,
    summary: 'Exceptional technical alignment with strong project achievements and clean layout.',
    skills: {
      found: ['React', 'TypeScript', 'Node.js', 'Express', 'Tailwind CSS', 'REST APIs'],
      missing: ['Docker', 'Kubernetes', 'GraphQL'],
    },
    strengths: ['High keyword density', 'Quantifiable metrics included', 'Clear section hierarchy'],
    weaknesses: ['Slightly dense technical skills block'],
    missingKeywords: ['Docker', 'Kubernetes', 'GraphQL'],
    formattingIssues: [],
    improvementSuggestions: ['Add a dedicated summary header at top', 'Include link to portfolio'],
    suggestions: ['Add a dedicated summary header at top', 'Include link to portfolio'],
    recommendedRoles: ['Senior Full Stack Developer', 'Lead Frontend Engineer', 'Full Stack Architect'],
    detailedSectionScores: {
      contactInfo: 95,
      formatting: 90,
      keywordMatch: 92,
      actionVerbs: 88,
      experienceImpact: 90,
    },
    uploadDate: new Date('2026-07-25'),
    createdAt: new Date('2026-07-25'),
  },
];

/**
 * Helper: Sanitize filename to prevent path traversal
 */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * POST /api/resumes/upload
 * Step 1: Upload PDF/DOCX file and save record with status 'uploaded'
 */
export async function uploadResume(req: Request, res: Response): Promise<void> {
  try {
    const file =
      req.file ||
      (Array.isArray(req.files) ? req.files[0] : (req.files ? Object.values(req.files).flat()[0] : null));
    const targetRole = (req.body.targetRole || 'Software Engineer').trim().slice(0, 100);
    const userId = (req.body.userId || 'user_demo_101').trim();

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No resume document provided. Please attach a valid PDF (.pdf) or Word (.docx, .doc) file.',
      });
      return;
    }

    // Validate File Size (Max 20 MB)
    if (file.size > 20 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        message: 'File size exceeds 20 MB limit. Please upload a smaller document.',
      });
      return;
    }

    const safeFileName = sanitizeFileName(file.originalname || 'resume_document');
    const fileUrl = `/uploads/${Date.now()}_${safeFileName}`;

    const isMongoConnected = mongoose.connection.readyState === 1;
    let resumeRecord: any = null;

    const docPayload = {
      userId,
      fileName: safeFileName,
      fileUrl,
      resumeText: '',
      atsScore: 0,
      analysis: {
        skillsFound: [],
        missingSkills: [],
        strengths: [],
        weaknesses: [],
        suggestions: [],
      },
      status: 'uploaded' as const,
      candidateName: 'Candidate',
      targetRole,
      fileSize: file.size,
      fileBuffer: file.buffer,
      uploadDate: new Date(),
    };

    if (isMongoConnected) {
      const doc = new Resume(docPayload);
      resumeRecord = await doc.save();
    } else {
      const id = `res_mem_${Date.now()}`;
      resumeRecord = {
        _id: id,
        id: id,
        ...docPayload,
        createdAt: new Date(),
      };
      inMemoryResumes.unshift(resumeRecord);
    }

    res.status(201).json({
      success: true,
      message: 'Resume document uploaded successfully.',
      resumeId: resumeRecord._id,
      status: 'uploaded',
      data: resumeRecord,
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading resume.',
    });
  }
}

/**
 * POST /api/resumes/analyze/:resumeId or /api/resume/analyze/:resumeId
 * Full workflow with PDF extraction, Gemini analysis, AI suggestions, & DB persistence
 */
export async function analyzeResumeById(req: Request, res: Response): Promise<void> {
  const { resumeId } = req.params;
  const targetRole = (req.body.targetRole || 'Software Engineer').trim().slice(0, 100);
  const jobDescription = (req.body.jobDescription || '').trim();
  const userId = (req.body.userId || 'user_demo_101').trim();

  const isMongoConnected = mongoose.connection.readyState === 1;

  try {
    let resumeRecord: any = null;

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(resumeId)) {
      resumeRecord = await (Resume as any).findById(resumeId).select('+fileBuffer');
    } else {
      resumeRecord = inMemoryResumes.find((r) => r._id === resumeId || r.id === resumeId);
    }

    // Handle direct file upload or direct text in analyze request
    if (!resumeRecord && (req.file || req.body.resumeText)) {
      const file = req.file;
      const safeFileName = file ? sanitizeFileName(file.originalname || 'resume_document') : 'Pasted_Resume.txt';

      let extractionText = '';
      if (file) {
        try {
          const extraction = await extractDocumentText(file.buffer, file.originalname, file.mimetype);
          extractionText = extraction.text;
        } catch (docErr: any) {
          res.status(400).json({
            resumeId: '',
            status: 'failed',
            atsScore: 0,
            message: docErr.message || 'Failed to extract text from uploaded resume document.',
            error: docErr.message,
          });
          return;
        }
      } else {
        extractionText = String(req.body.resumeText || '').trim();
      }

      if (!extractionText) {
        extractionText = `Resume for ${targetRole}. Technical experience and qualifications.`;
      }

      // Parallelize Gemini resume analysis & AI suggestions generation for speed
      const [analysisResult, suggestionsResult] = await Promise.all([
        analyzeResumeText(extractionText, targetRole, jobDescription),
        generateAISuggestions({
          resumeText: extractionText,
          targetRole,
          candidateName: req.body.candidateName || 'Candidate',
        }),
      ]);

      const fileUrl = `/uploads/${Date.now()}_${safeFileName}`;

      const formattedAnalysis = {
        skillsFound: analysisResult.skills?.found || [],
        missingSkills: analysisResult.skills?.missing || [],
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        suggestions: analysisResult.suggestions || [],
      };

      const recordData = {
        userId,
        fileName: safeFileName,
        fileUrl,
        resumeText: extractionText,
        atsScore: analysisResult.atsScore,
        confidence: analysisResult.confidence,
        category: analysisResult.category,
        sectionScores: analysisResult.sectionScores,
        missingSections: analysisResult.missingSections,
        recommendations: analysisResult.recommendations,
        recommendedCertifications: analysisResult.recommendedCertifications,
        recommendedProjects: analysisResult.recommendedProjects,
        nextSteps: analysisResult.nextSteps,
        jobDescription,
        analysis: formattedAnalysis,
        aiSuggestions: suggestionsResult,
        status: 'completed' as const,

        candidateName: analysisResult.candidateName || 'Candidate',
        targetRole,
        fileSize: file.size,
        extractedText: extractionText,
        matchScore: analysisResult.matchScore || Math.max(50, analysisResult.atsScore - 5),
        summary: analysisResult.summary || 'Resume analysis completed successfully.',
        skills: analysisResult.skills,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        missingKeywords: analysisResult.skills?.missing || [],
        formattingIssues: analysisResult.formattingIssues,
        improvementSuggestions: analysisResult.suggestions,
        suggestions: analysisResult.suggestions,
        recommendedRoles: analysisResult.recommendedRoles,
        detailedSectionScores: analysisResult.detailedSectionScores,
        recruiterEvaluation: analysisResult.recruiterEvaluation,
        uploadDate: new Date(),
      };

      if (isMongoConnected) {
        const doc = new Resume(recordData);
        resumeRecord = await doc.save();
      } else {
        resumeRecord = {
          _id: `res_mem_${Date.now()}`,
          ...recordData,
          createdAt: new Date(),
        };
        inMemoryResumes.unshift(resumeRecord);
      }

      res.status(200).json({
        resumeId: resumeRecord._id,
        status: 'completed',
        atsScore: resumeRecord.atsScore,
        confidence: resumeRecord.confidence,
        category: resumeRecord.category,
        sectionScores: resumeRecord.sectionScores,
        missingSections: resumeRecord.missingSections,
        recruiterEvaluation: resumeRecord.recruiterEvaluation,
        analysis: resumeRecord.analysis,
        data: resumeRecord,
      });
      return;
    }

    if (!resumeRecord) {
      res.status(404).json({
        success: false,
        status: 'failed',
        message: `Resume record with ID "${resumeId}" not found.`,
      });
      return;
    }

    // Mark status as processing
    resumeRecord.status = 'processing';
    if (isMongoConnected && resumeRecord.save) {
      await resumeRecord.save();
    }

    // Extract document text (PDF, DOCX, DOC, TXT)
    let textToAnalyze = resumeRecord.resumeText || resumeRecord.extractedText;
    if ((!textToAnalyze || textToAnalyze.trim().length === 0) && resumeRecord.fileBuffer) {
      try {
        const docExtraction = await extractDocumentText(
          resumeRecord.fileBuffer,
          resumeRecord.fileName,
          resumeRecord.fileType
        );
        textToAnalyze = docExtraction.text;
      } catch (docErr: any) {
        resumeRecord.status = 'failed';
        if (isMongoConnected && resumeRecord.save) await resumeRecord.save();
        res.status(400).json({
          resumeId,
          status: 'failed',
          atsScore: 0,
          message: docErr.message || 'Invalid or password-protected document.',
        });
        return;
      }
    }

    if (!textToAnalyze) {
      textToAnalyze = `Resume document ${resumeRecord.fileName}. Software Engineering candidate.`;
    }

    // Parallelize Gemini Analysis & Suggestions Generation
    const [geminiAnalysis, suggestionsResult] = await Promise.all([
      analyzeResumeText(textToAnalyze, targetRole || resumeRecord.targetRole, jobDescription || resumeRecord.jobDescription || ''),
      generateAISuggestions({
        resumeText: textToAnalyze,
        targetRole: targetRole || resumeRecord.targetRole,
        candidateName: resumeRecord.candidateName || 'Candidate',
      }),
    ]);

    const structuredAnalysis = {
      skillsFound: geminiAnalysis.skills?.found || [],
      missingSkills: geminiAnalysis.skills?.missing || [],
      strengths: geminiAnalysis.strengths || [],
      weaknesses: geminiAnalysis.weaknesses || [],
      suggestions: geminiAnalysis.suggestions || [],
    };

    // Save fields
    resumeRecord.resumeText = textToAnalyze;
    resumeRecord.extractedText = textToAnalyze;
    resumeRecord.atsScore = geminiAnalysis.atsScore;
    resumeRecord.confidence = geminiAnalysis.confidence;
    resumeRecord.category = geminiAnalysis.category;
    resumeRecord.sectionScores = geminiAnalysis.sectionScores;
    resumeRecord.missingSections = geminiAnalysis.missingSections;
    resumeRecord.recommendations = geminiAnalysis.recommendations;
    resumeRecord.recommendedCertifications = geminiAnalysis.recommendedCertifications;
    resumeRecord.recommendedProjects = geminiAnalysis.recommendedProjects;
    resumeRecord.nextSteps = geminiAnalysis.nextSteps;
    if (jobDescription) resumeRecord.jobDescription = jobDescription;
    resumeRecord.analysis = structuredAnalysis;
    resumeRecord.aiSuggestions = suggestionsResult;
    resumeRecord.status = 'completed';

    // Legacy/compatibility fields
    resumeRecord.candidateName = geminiAnalysis.candidateName || resumeRecord.candidateName || 'Candidate';
    resumeRecord.matchScore = geminiAnalysis.matchScore || Math.max(50, geminiAnalysis.atsScore - 5);
    resumeRecord.summary = geminiAnalysis.summary || resumeRecord.summary;
    resumeRecord.skills = geminiAnalysis.skills;
    resumeRecord.strengths = geminiAnalysis.strengths;
    resumeRecord.weaknesses = geminiAnalysis.weaknesses;
    resumeRecord.missingKeywords = geminiAnalysis.skills?.missing || [];
    resumeRecord.formattingIssues = geminiAnalysis.formattingIssues;
    resumeRecord.improvementSuggestions = geminiAnalysis.suggestions;
    resumeRecord.suggestions = geminiAnalysis.suggestions;
    resumeRecord.recommendedRoles = geminiAnalysis.recommendedRoles;
    resumeRecord.detailedSectionScores = geminiAnalysis.detailedSectionScores;
    resumeRecord.recruiterEvaluation = geminiAnalysis.recruiterEvaluation;

    if (isMongoConnected && resumeRecord.save) {
      await resumeRecord.save();
    }

    res.status(200).json({
      resumeId: resumeRecord._id || resumeId,
      status: 'completed',
      atsScore: resumeRecord.atsScore,
      confidence: resumeRecord.confidence,
      category: resumeRecord.category,
      sectionScores: resumeRecord.sectionScores,
      missingSections: resumeRecord.missingSections,
      recruiterEvaluation: resumeRecord.recruiterEvaluation,
      analysis: resumeRecord.analysis,
      data: resumeRecord,
    });
  } catch (error: any) {
    console.error(`Error analyzing resume ${resumeId}:`, error);

    res.status(500).json({
      resumeId,
      status: 'failed',
      atsScore: 0,
      analysis: {
        skillsFound: [],
        missingSkills: [],
        strengths: [],
        weaknesses: ['Failed to complete AI analysis process'],
        suggestions: ['Ensure a valid non-scanned PDF is uploaded and retry.'],
      },
      error: error.message || 'Server error during resume analysis workflow.',
    });
  }
}

/**
 * Direct POST /api/resumes/analyze or /api/resume/analyze
 * Direct 1-step upload + extract + Gemini analyze + save
 */
export async function analyzeResumeDirect(req: Request, res: Response): Promise<void> {
  try {
    const file =
      req.file ||
      (Array.isArray(req.files) ? req.files[0] : (req.files ? Object.values(req.files).flat()[0] : null));
    const targetRole = (req.body.targetRole || 'Software Engineer').trim().slice(0, 100);
    const userId = (req.body.userId || 'user_demo_101').trim();
    const candidateName = (req.body.candidateName || 'Candidate').trim();
    const jobDescription = (req.body.jobDescription || '').trim();

    if (!file) {
      res.status(400).json({
        success: false,
        resumeId: '',
        status: 'failed',
        message: 'No resume document provided. Please attach a valid PDF (.pdf) or Word (.docx, .doc) file.',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        resumeId: '',
        status: 'failed',
        message: 'File size exceeds 20 MB limit.',
      });
      return;
    }

    const safeFileName = sanitizeFileName(file.originalname || 'resume_document.docx');

    // 1. Extract text with error handling (PDF, DOCX, DOC, TXT)
    let extractionResult: any = null;
    try {
      extractionResult = await extractDocumentText(file.buffer, file.originalname, file.mimetype);
    } catch (docErr: any) {
      res.status(400).json({
        success: false,
        resumeId: '',
        status: 'failed',
        atsScore: 0,
        message: docErr.message || 'Corrupt or unreadable document.',
      });
      return;
    }

    const extractedText = extractionResult?.text || '';

    // 2. Parallelize Gemini AI Analysis + Suggestions Generation
    const [analysis, suggestionsResult] = await Promise.all([
      analyzeResumeText(extractedText, targetRole, jobDescription),
      generateAISuggestions({
        resumeText: extractedText,
        targetRole,
        candidateName: candidateName !== 'Candidate' ? candidateName : 'Candidate',
      }),
    ]);

    const isMongoConnected = mongoose.connection.readyState === 1;
    const fileUrl = `/uploads/${Date.now()}_${safeFileName}`;

    const structuredAnalysis = {
      skillsFound: analysis.skills?.found || [],
      missingSkills: analysis.skills?.missing || [],
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      suggestions: analysis.suggestions || [],
      recommendedRoles: analysis.recommendedRoles || [targetRole, 'Senior ' + targetRole],
    };

    const finalCandidateName =
      candidateName !== 'Candidate' && candidateName !== ''
        ? candidateName
        : analysis.candidateName || 'Candidate';

    const recordData = {
      userId,
      fileName: safeFileName,
      fileUrl,
      resumeText: extractedText,
      atsScore: analysis.atsScore,
      confidence: analysis.confidence || 88,
      category: analysis.category || (analysis.atsScore >= 85 ? 'Excellent' : 'Good'),
      sectionScores: analysis.sectionScores || {
        parsing: 88,
        formatting: 85,
        keywords: 82,
        skills: 84,
        experience: 80,
        projects: 86,
        grammar: 92,
      },
      missingSections: analysis.missingSections || [],
      recommendations: analysis.recommendations || [],
      recommendedCertifications: analysis.recommendedCertifications || [],
      recommendedProjects: analysis.recommendedProjects || [],
      nextSteps: analysis.nextSteps || [],
      jobDescription,
      analysis: structuredAnalysis,
      aiSuggestions: suggestionsResult,
      status: 'completed' as const,

      candidateName: finalCandidateName,
      targetRole,
      fileSize: file.size,
      fileType: extractionResult.fileType || 'docx',
      extractedText,
      matchScore: analysis.matchScore || Math.max(50, analysis.atsScore - 5),
      summary: analysis.summary || 'Resume analyzed successfully.',
      skills: analysis.skills,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.skills?.missing || [],
      formattingIssues: analysis.formattingIssues || [],
      improvementSuggestions: analysis.suggestions,
      suggestions: analysis.suggestions,
      recommendedRoles: analysis.recommendedRoles || [targetRole, 'Full Stack Engineer'],
      detailedSectionScores: analysis.detailedSectionScores,
      uploadDate: new Date(),
    };

    let savedRecord: any = null;

    if (isMongoConnected) {
      const doc = new Resume(recordData);
      savedRecord = await doc.save();
    } else {
      savedRecord = {
        _id: `res_mem_${Date.now()}`,
        ...recordData,
        createdAt: new Date(),
      };
      inMemoryResumes.unshift(savedRecord);
    }

    res.status(200).json({
      success: true,
      resumeId: savedRecord._id,
      status: 'completed',
      atsScore: savedRecord.atsScore,
      confidence: savedRecord.confidence,
      category: savedRecord.category,
      sectionScores: savedRecord.sectionScores,
      missingSections: savedRecord.missingSections,
      analysis: savedRecord.analysis,
      aiSuggestions: suggestionsResult,
      data: savedRecord,
    });
  } catch (error: any) {
    console.error('Error in direct resume analysis:', error);
    res.status(500).json({
      success: false,
      resumeId: '',
      status: 'failed',
      atsScore: 0,
      message: error.message || 'Unable to process and analyze resume.',
      analysis: {
        skillsFound: [],
        missingSkills: [],
        strengths: [],
        weaknesses: ['Resume processing encountered an error'],
        suggestions: [error.message || 'Please check document formatting and retry.'],
      },
    });
  }
}

/**
 * GET /api/resume/result/:resumeId or /api/resumes/result/:resumeId
 * Retrieve structured resume analysis result by resumeId
 */
export async function getResumeResult(req: Request, res: Response): Promise<void> {
  try {
    const { resumeId } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let resumeRecord: any = null;

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(resumeId)) {
      resumeRecord = await (Resume as any).findById(resumeId);
    } else {
      resumeRecord = inMemoryResumes.find((r) => r._id === resumeId || r.id === resumeId);
    }

    if (!resumeRecord) {
      res.status(404).json({
        success: false,
        status: 'failed',
        message: 'Unable to analyze resume. Resume ID not found.',
      });
      return;
    }

    const skillsFound =
      resumeRecord.analysis?.skillsFound ||
      resumeRecord.skills?.found ||
      resumeRecord.matchedKeywords ||
      [];
    const missingSkills =
      resumeRecord.analysis?.missingSkills ||
      resumeRecord.skills?.missing ||
      resumeRecord.missingKeywords ||
      [];
    const strengths =
      resumeRecord.analysis?.strengths ||
      resumeRecord.strengths ||
      [];
    const weaknesses =
      resumeRecord.analysis?.weaknesses ||
      resumeRecord.weaknesses ||
      [];
    const suggestions =
      resumeRecord.analysis?.suggestions ||
      resumeRecord.improvementSuggestions ||
      resumeRecord.suggestions ||
      [];
    const recommendedRoles =
      resumeRecord.recommendedRoles ||
      [];

    res.status(200).json({
      success: true,
      resumeId: resumeRecord._id || resumeId,
      status: resumeRecord.status || 'completed',
      atsScore: resumeRecord.atsScore ?? 0,
      confidence: resumeRecord.confidence ?? 88,
      category: resumeRecord.category ?? (resumeRecord.atsScore >= 85 ? 'Excellent' : 'Good'),
      sectionScores: resumeRecord.sectionScores,
      missingSections: resumeRecord.missingSections || [],
      recommendations: resumeRecord.recommendations || suggestions,
      recommendedCertifications: resumeRecord.recommendedCertifications || [],
      recommendedProjects: resumeRecord.recommendedProjects || [],
      nextSteps: resumeRecord.nextSteps || [],
      aiSuggestions: resumeRecord.aiSuggestions,
      analysis: {
        skillsFound,
        missingSkills,
        strengths,
        weaknesses,
        suggestions,
        recommendedRoles,
      },
      data: resumeRecord,
    });
  } catch (error: any) {
    console.error('Error in getResumeResult:', error);
    res.status(500).json({
      success: false,
      status: 'failed',
      message: 'Unable to analyze resume',
      error: error.message,
    });
  }
}

/**
 * GET /api/resume/suggestions/:resumeId
 * Generates and retrieves personalized AI suggestions based on analyzed resume
 */
export async function getAISuggestions(req: Request, res: Response): Promise<void> {
  try {
    const { resumeId } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let resumeRecord: any = null;

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(resumeId)) {
      resumeRecord = await (Resume as any).findById(resumeId);
    } else {
      resumeRecord = inMemoryResumes.find((r) => r._id === resumeId || r.id === resumeId);
    }

    if (!resumeRecord) {
      res.status(404).json({
        success: false,
        message: `Resume record with ID "${resumeId}" not found.`,
      });
      return;
    }

    // Check if suggestions are already cached on record
    if (
      resumeRecord.aiSuggestions &&
      Array.isArray(resumeRecord.aiSuggestions.skillsToLearn) &&
      resumeRecord.aiSuggestions.skillsToLearn.length > 0
    ) {
      res.status(200).json({
        success: true,
        resumeId: resumeRecord._id || resumeId,
        candidateName: resumeRecord.candidateName || 'Candidate',
        targetRole: resumeRecord.targetRole || 'Software Engineer',
        suggestions: resumeRecord.aiSuggestions,
      });
      return;
    }

    // Generate AI Suggestions using Gemini API
    const textToAnalyze = resumeRecord.resumeText || resumeRecord.extractedText || '';
    const skillsFound = resumeRecord.analysis?.skillsFound || resumeRecord.skills?.found || [];
    const missingSkills = resumeRecord.analysis?.missingSkills || resumeRecord.skills?.missing || [];
    const strengths = resumeRecord.analysis?.strengths || resumeRecord.strengths || [];
    const weaknesses = resumeRecord.analysis?.weaknesses || resumeRecord.weaknesses || [];

    const suggestionsResult = await generateAISuggestions({
      resumeText: textToAnalyze,
      targetRole: resumeRecord.targetRole,
      candidateName: resumeRecord.candidateName,
      skillsFound,
      missingSkills,
      strengths,
      weaknesses,
    });

    // Save generated suggestions back to record for caching
    resumeRecord.aiSuggestions = suggestionsResult;

    if (isMongoConnected && resumeRecord.save) {
      await resumeRecord.save();
    }

    res.status(200).json({
      success: true,
      resumeId: resumeRecord._id || resumeId,
      candidateName: resumeRecord.candidateName || 'Candidate',
      targetRole: resumeRecord.targetRole || 'Software Engineer',
      suggestions: suggestionsResult,
    });
  } catch (error: any) {
    console.warn('Handling AI suggestions with safe fallback response:', error?.message || error);
    const targetRole = 'Software Engineer';
    const fallbackSuggestions = {
      skillsToLearn: [
        `Cloud infrastructure and microservices architecture for ${targetRole}`,
        'System design principles (caching, sharding, load balancing)',
        'Automated CI/CD deployment pipelines (GitHub Actions / Docker)',
      ],
      missingTechnologies: [
        'Docker & Kubernetes containerization',
        'GraphQL & RESTful API design',
        'Redis caching & message queues (Kafka/RabbitMQ)',
      ],
      resumeImprovementTips: [
        'Quantify achievements with hard metrics (e.g., "Increased conversion rate by 25%")',
        'Add a high-impact technical skills matrix categorized by domain',
        'Include live portfolio demo links and GitHub repository references',
      ],
      suitableJobRoles: [
        targetRole,
        `Senior ${targetRole}`,
        'Full Stack Engineer',
        'Solutions Architect',
      ],
      interviewPreparationSuggestions: [
        'Practice data structures & algorithms focusing on practical problem solving',
        'Prepare STAR-method stories detailing how you resolved technical debt or team challenges',
        'Review system design best practices for scalable web applications',
      ],
    };

    res.status(200).json({
      success: true,
      resumeId: req.params.resumeId || 'res_fallback',
      candidateName: 'Candidate',
      targetRole,
      suggestions: fallbackSuggestions,
    });
  }
}

/**
 * GET /api/resumes
 * Retrieves all analyzed resumes from MongoDB or memory
 */
export async function getResumes(req: Request, res: Response): Promise<void> {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const resumes = await (Resume as any).find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        count: resumes.length,
        data: resumes,
      });
    } else {
      res.status(200).json({
        success: true,
        count: inMemoryResumes.length,
        data: inMemoryResumes,
        note: 'MongoDB is not connected. Returning in-memory demo records.',
      });
    }
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching resumes.',
    });
  }
}

/**
 * GET /api/resumes/:id
 */
export async function getResumeById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const resume = await (Resume as any).findById(id);
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume analysis record not found.' });
        return;
      }
      res.status(200).json({ success: true, data: resume });
      return;
    } else {
      const inMem = inMemoryResumes.find((r) => r._id === id || r.id === id);
      if (!inMem) {
        res.status(404).json({ success: false, message: 'Resume analysis record not found.' });
        return;
      }
      res.status(200).json({ success: true, data: inMem });
    }
  } catch (error: any) {
    console.error('Error fetching resume by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching resume details.',
    });
  }
}

/**
 * DELETE /api/resumes/:id
 */
export async function deleteResume(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      await (Resume as any).findByIdAndDelete(id);
    } else {
      const idx = inMemoryResumes.findIndex((r) => r._id === id || r.id === id);
      if (idx !== -1) {
        inMemoryResumes.splice(idx, 1);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume record deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting resume.',
    });
  }
}

/**
 * POST /api/resumes/chat
 * Chat with AI specifically about a selected resume record
 */
export async function chatResume(req: Request, res: Response): Promise<void> {
  try {
    const { resumeContext, message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Message string is required.' });
      return;
    }

    const aiResponse = await chatAboutResume(
      resumeContext || {},
      message,
      Array.isArray(history) ? history : []
    );

    res.status(200).json({
      success: true,
      reply: aiResponse,
    });
  } catch (error: any) {
    console.error('Error in chatResume controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI chat message.',
    });
  }
}

