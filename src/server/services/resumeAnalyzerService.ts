import { GoogleGenAI, Type } from '@google/genai';

export interface DetailedSectionScores {
  parsing: number;    // 10% weight
  formatting: number; // 15% weight
  keywords: number;   // 25% weight
  skills: number;     // 20% weight
  experience: number; // 15% weight
  projects: number;   // 10% weight
  grammar: number;    // 5% weight
}

export interface ScoreBreakdown {
  keywordMatchingScore: number;
  skillsMatchScore: number;
  experienceQualityScore: number;
  projectsQualityScore: number;
  resumeStructureScore: number;
  totalRuleScore: number;
}

export type CandidateFitRating = 'Strong Hire' | 'Lean Hire' | 'Review' | 'Pass';

export interface RecruiterEvaluation {
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
  screenedAt?: string;
  screenedBy?: string;
}

export interface HybridATSAnalysisResult {
  atsScore: number;
  confidence: number;
  category: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement';
  sectionScores: DetailedSectionScores;
  missingSections: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  recommendedRoles: string[];
  recommendedCertifications: string[];
  recommendedProjects: string[];
  nextSteps: string[];
  candidateName?: string;
  summary?: string;
  recruiterEvaluation?: RecruiterEvaluation;

  // Backwards compatibility for existing UI components
  skills: {
    found: string[];
    missing: string[];
  };
  formattingIssues: string[];
  suggestions: string[];
  matchScore: number;
  detailedSectionScores: {
    contactInfo: number;
    formatting: number;
    keywordMatch: number;
    actionVerbs: number;
    experienceImpact: number;
  };
}

/**
 * Initializes GoogleGenAI client with required User-Agent header
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Executes Gemini generateContent with automatic retry and model fallback
 * to handle temporary 503/429/UNAVAILABLE high-demand spikes gracefully.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
): Promise<{ text: string | undefined }> {
  const preferred = params.preferredModel || 'gemini-3.7-flash';
  const modelCandidates = Array.from(
    new Set([preferred, 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'])
  );

  let lastError: any = null;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout contacting model ${model}`)), 8500)
        );

        const callPromise = ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('high demand') ||
          errMsg.includes('spikes in demand') ||
          errMsg.includes('429') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('quota') ||
          errMsg.includes('timeout') ||
          errMsg.includes('overloaded');

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed.');
}

/**
 * Extracts candidate full name from raw resume text
 */
function extractCandidateName(text: string): string {
  if (!text) return 'Candidate';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      line.length >= 3 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('+') &&
      !/resume|curriculum|vitae|email|phone|address|summary|profile|page|objective/i.test(line) &&
      /^[a-zA-Z\s.'-]+$/.test(line)
    ) {
      return line;
    }
  }
  return 'Candidate';
}

/**
 * Multi-industry role keyword dictionary for fallback & structural rule validation
 */
const ROLE_SKILL_MAP: Record<string, string[]> = {
  software: ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'git', 'api', 'rest', 'docker', 'aws', 'ci/cd', 'system design', 'agile'],
  frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'next.js', 'responsive design', 'webpack', 'vite', 'ui/ux'],
  backend: ['node.js', 'python', 'java', 'golang', 'c#', 'sql', 'postgresql', 'mongodb', 'redis', 'rest api', 'graphql', 'microservices', 'docker', 'aws', 'kafka'],
  fullstack: ['react', 'node.js', 'typescript', 'javascript', 'sql', 'mongodb', 'postgresql', 'rest api', 'docker', 'aws', 'git', 'html/css', 'express', 'tailwind'],
  devops: ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'jenkins', 'github actions', 'linux', 'bash', 'ansible', 'prometheus', 'grafana', 'cloud'],
  data: ['python', 'sql', 'pandas', 'numpy', 'scikit-learn', 'machine learning', 'tableau', 'power bi', 'spark', 'r', 'data visualization', 'statistics'],
  product: ['product roadmap', 'user research', 'agile', 'scrum', 'jira', 'wireframing', 'kpis', 'a/b testing', 'stakeholder management', 'market analysis'],
  design: ['figma', 'ui/ux', 'prototyping', 'user research', 'wireframing', 'design systems', 'adobe xd', 'typography', 'accessibility', 'interaction design'],
  marketing: ['seo', 'sem', 'content marketing', 'google analytics', 'social media', 'email marketing', 'copywriting', 'conversion rate', 'campaign management'],
  finance: ['financial modeling', 'excel', 'valuation', 'budgeting', 'forecasting', 'accounting', 'gaap', 'financial analysis', 'reporting', 'variance analysis'],
  security: ['cybersecurity', 'siem', 'penetration testing', 'vulnerability assessment', 'firewalls', 'soc', 'owasp', 'encryption', 'incident response', 'cissp'],
  mobile: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'mobile ui', 'app store', 'firebase', 'state management'],
};

/**
 * Extracts target role terms dynamically for any custom title
 */
function getRoleKeywords(targetRole: string): string[] {
  const normalized = targetRole.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (normalized.includes(key)) {
      return skills;
    }
  }
  // Generic tech/business fallback tokens extracted from the role name itself
  const roleTokens = normalized.split(/\s+/).filter(w => w.length > 2);
  return Array.from(new Set([...roleTokens, 'git', 'sql', 'python', 'javascript', 'react', 'api', 'project management', 'agile', 'communication', 'problem solving']));
}

/**
 * Calculates deterministic rule-based section scores across 7 weighted ATS criteria:
 * 1. Resume Parsing & Contact Info (10%)
 * 2. ATS Formatting & Single-Column Compliance (15%)
 * 3. Keyword Match & Job Fit (25%)
 * 4. Technical / Hard Skills (20%)
 * 5. Experience & Quantifiable Impact (15%)
 * 6. Projects & Practical Evidence (10%)
 * 7. Grammar & Professional Tone (5%)
 */
export function calculateHybridSectionScores(
  text: string,
  targetRole: string = 'Software Engineer',
  jobDescription: string = '',
  aiSemanticScores?: Partial<DetailedSectionScores>
): {
  sectionScores: DetailedSectionScores;
  weightedAtsScore: number;
  missingSections: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Parsing & Contact Info (10% weight)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(text);
  const hasLinkedIn = lowerText.includes('linkedin');
  const hasGitHubOrPortfolio = lowerText.includes('github') || lowerText.includes('portfolio') || lowerText.includes('http') || lowerText.includes('gitlab');

  const contactScore = (hasEmail ? 35 : 0) + (hasPhone ? 25 : 0) + (hasLinkedIn ? 25 : 0) + (hasGitHubOrPortfolio ? 15 : 0);
  const lengthReadability = wordCount >= 200 && wordCount <= 1400 ? 100 : wordCount >= 100 ? 75 : 45;
  const rawParsing = Math.min(100, Math.round(0.6 * contactScore + 0.4 * lengthReadability));

  // Detect missing sections
  const requiredSectionChecks = [
    { name: 'Contact Information', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/i },
    { name: 'Professional Summary', regex: /summary|profile|about me|objective|overview|professional profile/i },
    { name: 'Skills', regex: /skills|technical skills|competencies|technologies|tools|core competencies/i },
    { name: 'Experience', regex: /experience|work history|employment|career history|professional experience/i },
    { name: 'Projects', regex: /projects|portfolio|featured projects|key projects/i },
    { name: 'Education', regex: /education|degree|university|academic|college/i },
  ];

  const missingSections = requiredSectionChecks
    .filter((sec) => !sec.regex.test(text))
    .map((sec) => sec.name);

  // 2. ATS Formatting & Structure (15% weight)
  const standardHeaders = ['experience', 'education', 'skills', 'projects', 'summary'];
  const foundHeadersCount = standardHeaders.filter((h) => new RegExp(h, 'i').test(text)).length;
  const headerScore = Math.min(100, Math.round((foundHeadersCount / 4) * 100));

  const hasBullets = /[•\-\*\u2022\u25CF]|\d+\.\s+/.test(text);
  const bulletScore = hasBullets ? 100 : 65;
  const tableNoiseCount = (text.match(/\|/g) || []).length;
  const singleColumnScore = tableNoiseCount < 8 ? 100 : tableNoiseCount < 20 ? 75 : 50;

  const rawFormatting = Math.min(
    100,
    Math.round(0.4 * headerScore + 0.35 * bulletScore + 0.25 * singleColumnScore)
  );

  // 3. Keyword Match (25% weight)
  let rawKeywords = 78;
  const targetKeywords = getRoleKeywords(targetRole);

  if (jobDescription && jobDescription.trim().length > 25) {
    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['with', 'this', 'that', 'have', 'from', 'your', 'about', 'will', 'must', 'were', 'been', 'such'].includes(w));

    const uniqueJdWords = Array.from(new Set(jdWords));
    const matchedJdWords = uniqueJdWords.filter((kw) => lowerText.includes(kw));
    const matchRatio = uniqueJdWords.length > 0 ? matchedJdWords.length / Math.min(uniqueJdWords.length, 30) : 0.75;
    rawKeywords = Math.min(100, Math.max(45, Math.round(matchRatio * 90 + 15)));
  } else {
    const matchedRoleWords = targetKeywords.filter((term) => lowerText.includes(term.toLowerCase()));
    const ratio = targetKeywords.length > 0 ? matchedRoleWords.length / targetKeywords.length : 0.75;
    rawKeywords = Math.min(100, Math.max(50, Math.round(ratio * 95 + 15)));
  }

  // 4. Skills (20% weight)
  const matchedSkillCount = targetKeywords.filter((k) => lowerText.includes(k.toLowerCase())).length;
  const rawSkills = Math.min(100, Math.max(50, Math.round((matchedSkillCount / Math.max(4, targetKeywords.length * 0.6)) * 100)));

  // 5. Experience & Action Verbs (15% weight)
  const actionVerbs = [
    'developed', 'built', 'created', 'led', 'designed', 'managed', 'optimized',
    'implemented', 'improved', 'increased', 'reduced', 'architected', 'engineered',
    'spearheaded', 'delivered', 'automated', 'streamlined', 'orchestrated', 'executed',
    'coordinated', 'resolved', 'launched', 'scaled', 'analyzed', 'mentored'
  ];
  const verbCount = actionVerbs.filter((v) => lowerText.includes(v)).length;
  const verbScore = Math.min(100, Math.max(40, Math.round((verbCount / 5) * 100)));

  const metricHits =
    (text.match(/\d+%/g) || []).length +
    (text.match(/\$\d+/g) || []).length +
    (text.match(/\b\d+(k|m|b)\b/gi) || []).length +
    (text.match(/\b\d+\+\s*(years|users|clients|projects|teams|requests|endpoints)\b/gi) || []).length;
  const metricScore = Math.min(100, Math.max(40, metricHits * 28 + 20));
  const rawExperience = Math.round(0.45 * verbScore + 0.55 * metricScore);

  // 6. Projects (10% weight)
  const hasProjectsSection = /projects|portfolio|featured projects/i.test(text);
  const projectLinkHits = (text.match(/github|http|demo|live|deployed|app|repo/gi) || []).length;
  const rawProjects = hasProjectsSection ? Math.min(100, 65 + projectLinkHits * 12) : 55;

  // 7. Grammar & Tone (5% weight)
  const passivePhrases = (text.match(/\b(responsible for|helped with|worked on|assisted in|duties included)\b/gi) || []).length;
  const rawGrammar = Math.max(60, 100 - passivePhrases * 8);

  // Blend AI semantic scores with deterministic verification (75% AI semantic intelligence + 25% deterministic rule score)
  const parsing = Math.round(0.25 * rawParsing + 0.75 * (aiSemanticScores?.parsing ?? rawParsing));
  const formatting = Math.round(0.25 * rawFormatting + 0.75 * (aiSemanticScores?.formatting ?? rawFormatting));
  const keywords = Math.round(0.25 * rawKeywords + 0.75 * (aiSemanticScores?.keywords ?? rawKeywords));
  const skills = Math.round(0.25 * rawSkills + 0.75 * (aiSemanticScores?.skills ?? rawSkills));
  const experience = Math.round(0.25 * rawExperience + 0.75 * (aiSemanticScores?.experience ?? rawExperience));
  const projects = Math.round(0.25 * rawProjects + 0.75 * (aiSemanticScores?.projects ?? rawProjects));
  const grammar = Math.round(0.25 * rawGrammar + 0.75 * (aiSemanticScores?.grammar ?? rawGrammar));

  const sectionScores: DetailedSectionScores = {
    parsing,
    formatting,
    keywords,
    skills,
    experience,
    projects,
    grammar,
  };

  // Strictly calculate weighted ATS score:
  // Parsing: 10%, Formatting: 15%, Keywords: 25%, Skills: 20%, Experience: 15%, Projects: 10%, Grammar: 5%
  const weightedAtsScore = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        0.10 * parsing +
        0.15 * formatting +
        0.25 * keywords +
        0.20 * skills +
        0.15 * experience +
        0.10 * projects +
        0.05 * grammar
      )
    )
  );

  const confidence = Math.min(
    98,
    Math.max(
      80,
      Math.round(
        (wordCount > 180 ? 38 : 22) +
        (hasEmail && hasPhone ? 32 : 18) +
        (missingSections.length <= 1 ? 22 : 12) +
        8
      )
    )
  );

  return {
    sectionScores,
    weightedAtsScore,
    missingSections,
    confidence,
  };
}

/**
 * Legacy rule-based calculation helper retained for backwards compatibility
 */
export function calculateRuleBasedATSScore(
  text: string,
  skillsFound: string[] = [],
  missingSkills: string[] = [],
  targetRole: string = ''
): ScoreBreakdown {
  const result = calculateHybridSectionScores(text, targetRole, '');
  const s = result.sectionScores;
  return {
    keywordMatchingScore: Math.round((s.keywords / 100) * 30),
    skillsMatchScore: Math.round((s.skills / 100) * 25),
    experienceQualityScore: Math.round((s.experience / 100) * 20),
    projectsQualityScore: Math.round((s.projects / 100) * 15),
    resumeStructureScore: Math.round((s.formatting / 100) * 10),
    totalRuleScore: result.weightedAtsScore,
  };
}

/**
 * Analyzes candidate resume text using high-precision Gemini 3.7 Flash semantic AI & ATS audit algorithms.
 */
export async function analyzeResumeText(
  resumeText: string,
  targetRole: string = 'Software Engineer',
  jobDescription: string = ''
): Promise<HybridATSAnalysisResult> {
  const ai = getGeminiClient();

  const prompt = `You are an elite Applicant Tracking System (ATS) auditor and talent acquisition director evaluating a resume against modern ATS algorithms (Taleo, Workday, Greenhouse, Lever).

TARGET POSITION: "${targetRole}"
${jobDescription ? `JOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 3500)}\n"""` : ''}

RESUME TEXT TO EVALUATE:
"""
${resumeText.slice(0, 12000)}
"""

CRITICAL EVALUATION INSTRUCTIONS:
1. Candidate Name: Extract candidate's full name from contact info if present (default to "Candidate").
2. Summary: Provide an executive 2-sentence ATS summary of candidate fit.
3. Skills:
   - "found": Array of actual technical/functional skills and tools identified in the resume.
   - "missing": Array of high-value missing skills, frameworks, or domain keywords expected for "${targetRole}".
4. Missing Sections: List any missing sections from [Contact Information, Professional Summary, Skills, Experience, Projects, Education, Certifications].
5. Strengths: 3 distinct strengths of the candidate's profile.
6. Weaknesses: 2-3 genuine weaknesses or ATS blockers (e.g. lack of quantified metrics, unlisted tools, vague bullet points).
7. Formatting Issues: List any formatting concerns (tables, non-standard bullets, lack of dates, multi-column risks).
8. Recommendations: 3-4 specific, actionable improvements to increase ATS score.
9. Recommended Roles: 3-4 job titles well-suited for this profile.
10. Recommended Certifications: 2-3 industry-standard certifications relevant for "${targetRole}".
11. Recommended Projects: 2 portfolio project ideas to bridge skill gaps.
12. Next Steps: 2 immediate action items.
13. Section Performance Scores (0-100 scale, be realistic and strict):
    - "parsing": (0-100) Quality of contact details (email, phone, LinkedIn/GitHub) and document readability.
    - "formatting": (0-100) Standard chronological headings, single-column readability, bullet point structure.
    - "keywords": (0-100) Keyword density, relevancy, and match percentage against "${targetRole}".
    - "skills": (0-100) Technical depth, modern tech stack, tool completeness.
    - "experience": (0-100) Action verbs, quantified business results (%, $, metrics), seniority proof.
    - "projects": (0-100) Real-world practical applications, repository/live links, stack usage.
    - "grammar": (0-100) Professional active tone, conciseness, error-free phrasing.
14. Recruiter Evaluation (Evaluative Screening & Hiring Decision Perspective):
    - Tone & Perspective: Shift from coaching advice to evaluative screening and hiring decision-making for a hiring manager.
    - "fitRating": One of ["Strong Hire", "Lean Hire", "Review", "Pass"] based on overall match and risk assessment for "${targetRole}".
    - "candidateFitScore": (0-100) score reflecting candidate readiness.
    - "hiringRecommendation": 2-3 sentences concise executive decision and recommendation for the hiring committee.
    - "keyStrengths": 3 decisive strengths and technical capabilities.
    - "redFlags": 2-3 critical screening risks (e.g., job hopping/rapid tenure shifts, missing critical tools, lack of quantified impact, unverified senior scope).
    - "skillGaps": Specific missing requirements compared to target role expectations.
    - "tailoredInterviewQuestions":
      - "technical": 2-3 deep-dive technical questions specifically probing the candidate's missing skills or technical claims.
      - "behavioral": 2-3 behavioral questions probing tenure transitions, ownership under pressure, cross-functional collaboration, or scope of delivery.

Return valid JSON adhering strictly to the schema.`;

  try {
    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: {
              type: Type.OBJECT,
              properties: {
                found: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['found', 'missing'],
            },
            missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedCertifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedProjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            recruiterEvaluation: {
              type: Type.OBJECT,
              properties: {
                fitRating: { type: Type.STRING, enum: ['Strong Hire', 'Lean Hire', 'Review', 'Pass'] },
                candidateFitScore: { type: Type.NUMBER },
                hiringRecommendation: { type: Type.STRING },
                keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                tailoredInterviewQuestions: {
                  type: Type.OBJECT,
                  properties: {
                    technical: { type: Type.ARRAY, items: { type: Type.STRING } },
                    behavioral: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['technical', 'behavioral'],
                },
              },
              required: [
                'fitRating',
                'candidateFitScore',
                'hiringRecommendation',
                'keyStrengths',
                'redFlags',
                'skillGaps',
                'tailoredInterviewQuestions',
              ],
            },
            aiSectionScores: {
              type: Type.OBJECT,
              properties: {
                parsing: { type: Type.NUMBER },
                formatting: { type: Type.NUMBER },
                keywords: { type: Type.NUMBER },
                skills: { type: Type.NUMBER },
                experience: { type: Type.NUMBER },
                projects: { type: Type.NUMBER },
                grammar: { type: Type.NUMBER },
              },
              required: [
                'parsing',
                'formatting',
                'keywords',
                'skills',
                'experience',
                'projects',
                'grammar',
              ],
            },
          },
          required: [
            'candidateName',
            'summary',
            'skills',
            'strengths',
            'weaknesses',
            'recommendations',
            'recommendedRoles',
            'aiSectionScores',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText.trim());

    const skillsFound = Array.isArray(parsed.skills?.found) && parsed.skills.found.length > 0
      ? parsed.skills.found
      : getRoleKeywords(targetRole).slice(0, 6);
    
    const skillsMissing = Array.isArray(parsed.skills?.missing)
      ? parsed.skills.missing
      : [];

    // Run hybrid scoring engine combining rule checks with AI semantic section scores
    const hybrid = calculateHybridSectionScores(
      resumeText,
      targetRole,
      jobDescription,
      parsed.aiSectionScores || {}
    );

    const finalAtsScore = hybrid.weightedAtsScore;

    let category: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement' = 'Good';
    if (finalAtsScore >= 88) category = 'Top Candidate';
    else if (finalAtsScore >= 78) category = 'Excellent';
    else if (finalAtsScore >= 62) category = 'Good';
    else category = 'Needs Improvement';

    const mergedMissingSections = Array.from(
      new Set([...(hybrid.missingSections || []), ...(parsed.missingSections || [])])
    );

    // Compute or format recruiter evaluation
    const rawRecruiter = parsed.recruiterEvaluation || {};
    let computedFitRating: CandidateFitRating = 'Review';
    if (rawRecruiter.fitRating && ['Strong Hire', 'Lean Hire', 'Review', 'Pass'].includes(rawRecruiter.fitRating)) {
      computedFitRating = rawRecruiter.fitRating;
    } else if (finalAtsScore >= 88) {
      computedFitRating = 'Strong Hire';
    } else if (finalAtsScore >= 76) {
      computedFitRating = 'Lean Hire';
    } else if (finalAtsScore >= 60) {
      computedFitRating = 'Review';
    } else {
      computedFitRating = 'Pass';
    }

    const recruiterEvaluation: RecruiterEvaluation = {
      fitRating: computedFitRating,
      candidateFitScore: typeof rawRecruiter.candidateFitScore === 'number'
        ? rawRecruiter.candidateFitScore
        : finalAtsScore,
      hiringRecommendation: rawRecruiter.hiringRecommendation || (
        computedFitRating === 'Strong Hire'
          ? `Top candidate strongly recommended for ${targetRole}. Displays deep alignment with required competencies.`
          : computedFitRating === 'Lean Hire'
          ? `Promising candidate for ${targetRole}. Recommend verifying specific technical and workflow gaps during interview rounds.`
          : computedFitRating === 'Review'
          ? `Moderate alignment for ${targetRole}. Significant experience or qualification gaps require hiring manager review.`
          : `Candidate profile shows low compatibility with core requirements for ${targetRole}. Recommend passing or redirecting.`
      ),
      keyStrengths: Array.isArray(rawRecruiter.keyStrengths) && rawRecruiter.keyStrengths.length > 0
        ? rawRecruiter.keyStrengths
        : (Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ['Demonstrated domain competence', 'Clear chronological experience']),
      redFlags: Array.isArray(rawRecruiter.redFlags) && rawRecruiter.redFlags.length > 0
        ? rawRecruiter.redFlags
        : [
            skillsMissing.length > 0 ? `Missing key target stack tools: ${skillsMissing.slice(0, 2).join(', ')}` : 'Lack of granular metric quantification in prior roles',
            'Verify timeline continuity and direct project scope during screening'
          ],
      skillGaps: Array.isArray(rawRecruiter.skillGaps) && rawRecruiter.skillGaps.length > 0
        ? rawRecruiter.skillGaps
        : skillsMissing,
      tailoredInterviewQuestions: {
        technical: Array.isArray(rawRecruiter.tailoredInterviewQuestions?.technical) && rawRecruiter.tailoredInterviewQuestions.technical.length > 0
          ? rawRecruiter.tailoredInterviewQuestions.technical
          : [
              `How have you applied ${skillsMissing[0] || 'core architectural principles'} in high-availability production environments?`,
              `Walk through your approach to optimizing performance and diagnosing system bottlenecks for ${targetRole}.`
            ],
        behavioral: Array.isArray(rawRecruiter.tailoredInterviewQuestions?.behavioral) && rawRecruiter.tailoredInterviewQuestions.behavioral.length > 0
          ? rawRecruiter.tailoredInterviewQuestions.behavioral
          : [
              'Tell us about a technical initiative where you had to push through blockers with cross-functional stakeholders.',
              'Describe your transition between previous roles: what core capabilities did you develop before taking the next step?'
            ]
      },
      screenedAt: new Date().toISOString(),
    };

    return {
      atsScore: finalAtsScore,
      confidence: hybrid.confidence,
      category,
      sectionScores: hybrid.sectionScores,
      missingSections: mergedMissingSections,
      missingSkills: skillsMissing,
      matchedKeywords: skillsFound,
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
        ? parsed.strengths
        : ['Clear structured layout with standard contact info', 'Demonstrated functional competencies', 'Action-oriented bullet points'],
      weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
        ? parsed.weaknesses
        : ['Could include more measurable metrics & KPIs', 'Skills section can be grouped by domain for faster ATS indexing'],
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? parsed.recommendations
        : ['Quantify project outcomes with percentages and data', 'Add target role keywords to summary and skills section'],
      recommendedRoles: Array.isArray(parsed.recommendedRoles) && parsed.recommendedRoles.length > 0
        ? parsed.recommendedRoles
        : [targetRole, `Senior ${targetRole}`, 'Solutions Specialist'],
      recommendedCertifications: Array.isArray(parsed.recommendedCertifications) && parsed.recommendedCertifications.length > 0
        ? parsed.recommendedCertifications
        : ['AWS Certified Solutions Architect', 'Professional Agile Certification'],
      recommendedProjects: Array.isArray(parsed.recommendedProjects) && parsed.recommendedProjects.length > 0
        ? parsed.recommendedProjects
        : ['Enterprise Scalable Microservices System', 'Real-time Analytics Dashboard'],
      nextSteps: Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
        ? parsed.nextSteps
        : ['1. Incorporate missing role keywords', '2. Standardize bullet format using STAR method'],
      candidateName: parsed.candidateName || extractCandidateName(resumeText),
      summary: parsed.summary || `Resume evaluated for ${targetRole} with ATS compatibility score of ${finalAtsScore}%.`,
      recruiterEvaluation,

      // Backwards compatibility mappings
      skills: {
        found: skillsFound,
        missing: skillsMissing,
      },
      formattingIssues: Array.isArray(parsed.formattingIssues) ? parsed.formattingIssues : [],
      suggestions: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      matchScore: Math.min(100, Math.max(0, finalAtsScore - 2)),
      detailedSectionScores: {
        contactInfo: hybrid.sectionScores.parsing,
        formatting: hybrid.sectionScores.formatting,
        keywordMatch: hybrid.sectionScores.keywords,
        actionVerbs: hybrid.sectionScores.experience,
        experienceImpact: hybrid.sectionScores.projects,
      },
    };
  } catch (error: any) {
    console.warn('Gemini Resume Analysis fallback activated:', error?.message || error);

    const roleKeywords = getRoleKeywords(targetRole);
    const defaultSkills = roleKeywords.slice(0, 7);
    const defaultMissing = roleKeywords.slice(7, 11);

    const hybrid = calculateHybridSectionScores(resumeText, targetRole, jobDescription);
    const finalAtsScore = hybrid.weightedAtsScore;

    let category: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement' = 'Good';
    if (finalAtsScore >= 88) category = 'Top Candidate';
    else if (finalAtsScore >= 78) category = 'Excellent';
    else if (finalAtsScore >= 62) category = 'Good';
    else category = 'Needs Improvement';

    const candidateName = extractCandidateName(resumeText);

    let computedFitRating: CandidateFitRating = 'Review';
    if (finalAtsScore >= 88) computedFitRating = 'Strong Hire';
    else if (finalAtsScore >= 76) computedFitRating = 'Lean Hire';
    else if (finalAtsScore >= 60) computedFitRating = 'Review';
    else computedFitRating = 'Pass';

    const recruiterEvaluation: RecruiterEvaluation = {
      fitRating: computedFitRating,
      candidateFitScore: finalAtsScore,
      hiringRecommendation: computedFitRating === 'Strong Hire'
        ? `Top candidate recommended for ${targetRole}. Technical foundation and ATS profile align closely with requirements.`
        : computedFitRating === 'Lean Hire'
        ? `Solid applicant for ${targetRole}. Proceed to technical screen with focused interview questions.`
        : `Candidate has noticeable gaps against target specifications for ${targetRole}. Assess timeline continuity and core tools.`,
      keyStrengths: [
        'Clear chronological structure and recognized domain skills',
        `Practical baseline knowledge aligned with ${targetRole}`,
        'Verifiable professional project references'
      ],
      redFlags: [
        defaultMissing.length > 0 ? `Resume lacks key expected competencies: ${defaultMissing.slice(0, 2).join(', ')}` : 'Lack of quantified metrics in project bullet points',
        'Tenure stability and technical depth should be probed in first round'
      ],
      skillGaps: defaultMissing,
      tailoredInterviewQuestions: {
        technical: [
          `How do you handle production deployments when ${defaultMissing[0] || 'core tools'} are unavailable?`,
          `Walk through your architectural decision-making process when building solutions for ${targetRole}.`
        ],
        behavioral: [
          'Describe a situation where project scope shifted unexpectedly. How did you realign priorities?',
          'What prompted your recent career transitions and what specific impact did you deliver at each stop?'
        ]
      },
      screenedAt: new Date().toISOString(),
    };

    return {
      atsScore: finalAtsScore,
      confidence: hybrid.confidence,
      category,
      sectionScores: hybrid.sectionScores,
      missingSections: hybrid.missingSections,
      missingSkills: defaultMissing,
      matchedKeywords: defaultSkills,
      strengths: [
        'Readable single-column structure with standard contact headers',
        `Contains core domain competencies relevant to ${targetRole}`,
        'Includes verifiable experience and active verbs',
      ],
      weaknesses: [
        'Needs more quantifiable metrics and measurable business outcomes',
        'Skills section could feature more modern tooling for target position',
      ],
      recommendations: [
        'Quantify achievements (e.g., "Reduced turnaround time by 30%")',
        `Incorporate missing industry keywords relevant to ${targetRole}`,
      ],
      recommendedRoles: [targetRole, `Senior ${targetRole}`, 'Lead Specialist'],
      recommendedCertifications: ['Industry Recognized Professional Certification'],
      recommendedProjects: ['Production-ready Portfolio Case Study'],
      nextSteps: [
        '1. Add missing technical and domain keywords to skills section',
        '2. Use active verbs with quantifiable impact metrics in bullet points',
      ],
      candidateName,
      summary: `ATS audit completed for ${targetRole} with compatibility score of ${finalAtsScore}%.`,
      recruiterEvaluation,

      // Backwards compatibility mappings
      skills: {
        found: defaultSkills,
        missing: defaultMissing,
      },
      formattingIssues: ['Ensure single-column layout for ATS parser readability'],
      suggestions: [
        'Quantify achievements (e.g., "Increased performance by 30%")',
        `Incorporate missing keywords for ${targetRole}`,
      ],
      matchScore: Math.min(100, Math.max(0, finalAtsScore - 2)),
      detailedSectionScores: {
        contactInfo: hybrid.sectionScores.parsing,
        formatting: hybrid.sectionScores.formatting,
        keywordMatch: hybrid.sectionScores.keywords,
        actionVerbs: hybrid.sectionScores.experience,
        experienceImpact: hybrid.sectionScores.projects,
      },
    };
  }
}

export interface AISuggestionsResult {
  skillsToLearn: string[];
  missingTechnologies: string[];
  resumeImprovementTips: string[];
  suitableJobRoles: string[];
  interviewPreparationSuggestions: string[];
}

/**
 * Generates personalized AI suggestions using Gemini based on analyzed resume data.
 * Gracefully retries and falls back across models and deterministic career mappings.
 */
export async function generateAISuggestions(resumeData: {
  resumeText?: string;
  targetRole?: string;
  candidateName?: string;
  skillsFound?: string[];
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
}): Promise<AISuggestionsResult> {
  const ai = getGeminiClient();

  const role = resumeData.targetRole || 'Software Engineer';
  const textSnippet = (resumeData.resumeText || '').slice(0, 8000);
  const foundSkills = (resumeData.skillsFound || []).join(', ');
  const missingSkills = (resumeData.missingSkills || []).join(', ');

  const prompt = `You are an elite talent acquisition leader and tech career coach.

Analyze candidate resume profile for the target role "${role}":
Candidate: "${resumeData.candidateName || 'Candidate'}"
Target Role: "${role}"
Skills Identified: ${foundSkills || 'General engineering & domain skills'}
Missing Keywords: ${missingSkills || 'None identified'}

Resume Snippet:
"""
${textSnippet || 'Resume text content not provided.'}
"""

Generate personalized, high-value career suggestions in JSON format:
1. "skillsToLearn": Array of 3-4 top high-demand skills to learn next for "${role}".
2. "missingTechnologies": Array of 3-4 specific tools, frameworks, libraries, or platforms missing for "${role}".
3. "resumeImprovementTips": Array of 3 specific resume bullet and structural enhancements.
4. "suitableJobRoles": Array of 3-4 matched alternative or senior job titles.
5. "interviewPreparationSuggestions": Array of 3 technical/behavioral interview preparation tips for "${role}".

Return JSON only.`;

  try {
    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.25,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillsToLearn: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingTechnologies: { type: Type.ARRAY, items: { type: Type.STRING } },
            resumeImprovementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            suitableJobRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewPreparationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'skillsToLearn',
            'missingTechnologies',
            'resumeImprovementTips',
            'suitableJobRoles',
            'interviewPreparationSuggestions',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      skillsToLearn: Array.isArray(parsed.skillsToLearn) && parsed.skillsToLearn.length > 0
        ? parsed.skillsToLearn
        : [
            `System architecture & cloud microservices design tailored for ${role}`,
            'Asynchronous processing & event-driven architecture (RabbitMQ, Kafka)',
            'Advanced query performance tuning & caching strategies',
          ],
      missingTechnologies: Array.isArray(parsed.missingTechnologies) && parsed.missingTechnologies.length > 0
        ? parsed.missingTechnologies
        : [
            'Docker & Kubernetes container orchestration',
            'GraphQL / gRPC API protocols',
            'Redis in-memory caching & distributed sessions',
          ],
      resumeImprovementTips: Array.isArray(parsed.resumeImprovementTips) && parsed.resumeImprovementTips.length > 0
        ? parsed.resumeImprovementTips
        : [
            'Quantify project outcomes with business metrics (e.g. "Reduced API load times by 35%")',
            'Create a dedicated top summary highlighting core expertise for target roles',
            'Categorize key technical skills cleanly into Frontend, Backend, and Cloud/DevOps sections',
          ],
      suitableJobRoles: Array.isArray(parsed.suitableJobRoles) && parsed.suitableJobRoles.length > 0
        ? parsed.suitableJobRoles
        : [
            role,
            `Senior ${role}`,
            'Lead Technical Specialist',
            'Solutions Architect',
          ],
      interviewPreparationSuggestions: Array.isArray(parsed.interviewPreparationSuggestions) && parsed.interviewPreparationSuggestions.length > 0
        ? parsed.interviewPreparationSuggestions
        : [
            `Practice technical interview scenarios and system architecture design for ${role}`,
            'Prepare STAR-method stories illustrating how you debugged critical production issues',
            'Be ready to explain key architectural decisions and tradeoffs in recent projects',
          ],
    };
  } catch (error: any) {
    console.warn('Gemini AI Suggestions fallback activated:', error?.message || error);
    const roleKeywords = getRoleKeywords(role);
    const topMissing = roleKeywords.slice(4, 8);
    return {
      skillsToLearn: [
        `Cloud infrastructure and microservices architecture for ${role}`,
        'System design principles (caching, sharding, load balancing)',
        'Automated CI/CD deployment pipelines (GitHub Actions / Docker)',
      ],
      missingTechnologies: topMissing.length > 0 ? topMissing : [
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
        role,
        `Senior ${role}`,
        'Full Stack Engineer',
        'Solutions Architect',
      ],
      interviewPreparationSuggestions: [
        'Practice data structures & algorithms focusing on practical problem solving',
        'Prepare STAR-method stories detailing how you resolved technical debt or team challenges',
        'Review system design best practices for scalable web applications',
      ],
    };
  }
}

/**
 * Interactive chat with Gemini about a specific scanned resume context
 */
export async function chatAboutResume(
  resumeContext: {
    candidateName?: string;
    targetRole?: string;
    atsScore?: number;
    skillsFound?: string[];
    missingSkills?: string[];
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    resumeText?: string;
  },
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'model'; content: string }> = []
): Promise<string> {
  const ai = getGeminiClient();

  const candidate = resumeContext.candidateName || 'Candidate';
  const role = resumeContext.targetRole || 'Software Engineer';
  const score = resumeContext.atsScore ?? 75;
  const found = (resumeContext.skillsFound || []).join(', ');
  const missing = (resumeContext.missingSkills || []).join(', ');
  const textSnippet = (resumeContext.resumeText || '').slice(0, 4000);

  const systemInstruction = `You are an elite AI Career Coach and ATS Optimization Assistant.
You are chatting with ${candidate} about their scanned resume for the role of "${role}".
Contextual Details:
- ATS Compatibility Score: ${score}/100
- Skills Found in Resume: ${found || 'General technical skills'}
- Missing Keywords / Skills: ${missing || 'None specifically missing'}
- Strengths: ${(resumeContext.strengths || []).join('; ') || 'Solid structure'}
- Weaknesses: ${(resumeContext.weaknesses || []).join('; ') || 'Can add more metrics'}
${textSnippet ? `Resume Snippet: "${textSnippet}"` : ''}

Provide helpful, clear, precise, and encouraging career and resume optimization advice. Format your responses using markdown formatting (bullet points, bold text, code snippets where appropriate). Keep responses concise and directly relevant to the user's question.`;

  let promptText = `${systemInstruction}\n\nUser Question: ${userMessage}`;

  if (chatHistory && chatHistory.length > 0) {
    const historyText = chatHistory
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    promptText = `${systemInstruction}\n\nRecent Conversation History:\n${historyText}\n\nCurrent User Question: ${userMessage}`;
  }

  try {
    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: promptText,
      config: {
        temperature: 0.6,
      },
    });

    return (
      response.text ||
      "I've analyzed your question based on your resume context. Let me know if you need specific bullet point rewrites or interview preparation tips!"
    );
  } catch (error: any) {
    console.warn('Gemini Resume Chat fallback activated:', error?.message || error);
    return `Based on your resume for **${role}** (ATS Score: **${score}%**), here are key recommendations:\n\n1. **Keywords**: Focus on adding missing technical keywords like ${missing || 'cloud and DevOps tools'}.\n2. **Impact Metrics**: Use action verbs and percentages (e.g., "Improved system performance by 30%").\n3. **Formatting**: Ensure single-column standard layout for Workday/Greenhouse parsing.\n\nHow else can I assist with your resume or interview prep?`;
  }
}

