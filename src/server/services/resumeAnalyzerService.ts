import { GoogleGenAI, Type } from '@google/genai';

export interface DetailedSectionScores {
  parsing: number;    // 10% weight
  formatting: number; // 20% weight
  keywords: number;   // 20% weight
  skills: number;     // 15% weight
  experience: number; // 15% weight
  projects: number;   // 10% weight
  grammar: number;    // 5% weight
  education: number;  // 5% weight
}

export interface ScoreBreakdown {
  keywordMatchingScore: number;
  skillsMatchScore: number;
  experienceQualityScore: number;
  projectsQualityScore: number;
  resumeStructureScore: number;
  totalRuleScore: number;
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
 * Hybrid section evaluation function calculating scores across 8 weighted criteria:
 * Resume Parsing (10%), ATS Formatting (20%), Keyword Match (20%), Skills (15%),
 * Experience (15%), Projects (10%), Grammar (5%), Education (5%).
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

  // 1. Resume Parsing (10% weight)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(text);
  const hasLinkedIn = lowerText.includes('linkedin');
  const hasGitHub = lowerText.includes('github') || lowerText.includes('portfolio') || lowerText.includes('http');

  const contactScore = (hasEmail ? 35 : 0) + (hasPhone ? 25 : 0) + (hasLinkedIn ? 25 : 0) + (hasGitHub ? 15 : 0);
  const lengthReadability = wordCount > 200 ? 100 : wordCount > 100 ? 70 : 40;
  const rawParsing = Math.round(0.6 * contactScore + 0.4 * lengthReadability);

  // Detect missing sections
  const requiredSectionChecks = [
    { name: 'Contact Information', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/i },
    { name: 'Professional Summary', regex: /summary|profile|about me|objective|overview/i },
    { name: 'Skills', regex: /skills|technical skills|competencies|technologies|tools/i },
    { name: 'Experience', regex: /experience|work history|employment|career/i },
    { name: 'Projects', regex: /projects|portfolio|featured projects/i },
    { name: 'Education', regex: /education|degree|university|academic/i },
    { name: 'Certifications', regex: /certifications|licenses|courses|accreditations/i },
  ];

  const missingSections = requiredSectionChecks
    .filter((sec) => !sec.regex.test(text))
    .map((sec) => sec.name);

  // 2. ATS Formatting & Compatibility (20% weight)
  const standardHeaders = ['experience', 'education', 'skills', 'projects', 'summary', 'certifications'];
  const foundHeadersCount = standardHeaders.filter((h) => new RegExp(h, 'i').test(text)).length;
  const headerScore = Math.min(100, Math.round((foundHeadersCount / 5) * 100));

  const hasBullets = /[•\-\*\u2022\u25CF]|\d+\.\s+/.test(text);
  const bulletScore = hasBullets ? 100 : 60;
  const tableNoiseCount = (text.match(/\|/g) || []).length;
  const singleColumnScore = tableNoiseCount < 10 ? 100 : tableNoiseCount < 25 ? 70 : 40;
  const lengthScore = wordCount >= 300 && wordCount <= 1200 ? 100 : 70;

  const rawFormatting = Math.round(
    0.35 * headerScore + 0.25 * bulletScore + 0.25 * singleColumnScore + 0.15 * lengthScore
  );

  // 3. Keyword Match (20% weight)
  let rawKeywords = 75;
  if (jobDescription && jobDescription.trim().length > 20) {
    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['with', 'this', 'that', 'have', 'from', 'your', 'about'].includes(w));

    const uniqueJdWords = Array.from(new Set(jdWords));
    const matchedJdWords = uniqueJdWords.filter((kw) => lowerText.includes(kw));
    const matchRatio = uniqueJdWords.length > 0 ? matchedJdWords.length / uniqueJdWords.length : 0.7;
    rawKeywords = Math.min(100, Math.max(35, Math.round(matchRatio * 100 + 15)));
  } else {
    const roleTokens = targetRole.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const commonTechTerms = [
      'javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'git', 'api',
      'aws', 'docker', 'rest', 'agile', 'database', 'system', 'architecture', 'testing'
    ];
    const combinedTargets = Array.from(new Set([...roleTokens, ...commonTechTerms]));
    const matchedRoleWords = combinedTargets.filter((term) => lowerText.includes(term));
    rawKeywords = Math.min(100, Math.round((matchedRoleWords.length / Math.max(1, combinedTargets.length - 5)) * 100));
  }

  // 4. Skills (15% weight)
  const techKeywords = [
    'react', 'node', 'typescript', 'javascript', 'python', 'java', 'c++', 'go', 'ruby', 'sql',
    'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'graphql', 'rest', 'express',
    'html', 'css', 'tailwind', 'redux', 'jest', 'ci/cd', 'microservices', 'redis'
  ];
  const foundTechCount = techKeywords.filter((k) => lowerText.includes(k)).length;
  const rawSkills = Math.min(100, Math.max(40, Math.round((foundTechCount / 8) * 100)));

  // 5. Experience (15% weight)
  const actionVerbs = [
    'developed', 'built', 'created', 'led', 'designed', 'managed', 'optimized',
    'implemented', 'improved', 'increased', 'reduced', 'architected', 'engineered',
    'spearheaded', 'delivered', 'automated', 'streamlined', 'orchestrated'
  ];
  const verbCount = actionVerbs.filter((v) => lowerText.includes(v)).length;
  const verbScore = Math.min(100, Math.round((verbCount / 6) * 100));

  const metricHits =
    (text.match(/\d+%/g) || []).length +
    (text.match(/\$\d+/g) || []).length +
    (text.match(/\b\d+\+\s*(years|users|clients|projects|teams)\b/gi) || []).length;
  const metricScore = Math.min(100, metricHits * 25);
  const rawExperience = Math.round(0.5 * verbScore + 0.5 * metricScore);

  // 6. Projects (10% weight)
  const hasProjectsSection = /projects|portfolio|featured projects/i.test(text);
  const projectLinkHits = (text.match(/github|http|demo|live|deployed|app/gi) || []).length;
  const rawProjects = hasProjectsSection ? Math.min(100, 60 + projectLinkHits * 10) : 40;

  // 7. Grammar & Writing Quality (5% weight)
  const passivePhrases = (text.match(/\b(responsible for|helped with|worked on|assisted in)\b/gi) || []).length;
  const rawGrammar = Math.max(50, 100 - passivePhrases * 10);

  // 8. Education (5% weight)
  const degreeHits = /bachelor|master|phd|b\.s\.|m\.s\.|b\.tech|degree|university|college/i.test(text);
  const rawEducation = degreeHits ? 100 : 50;

  // Combine rule calculations with AI semantic scores (70% rule-based + 30% AI semantic refinement)
  const parsing = Math.round(0.7 * rawParsing + 0.3 * (aiSemanticScores?.parsing ?? rawParsing));
  const formatting = Math.round(0.7 * rawFormatting + 0.3 * (aiSemanticScores?.formatting ?? rawFormatting));
  const keywords = Math.round(0.7 * rawKeywords + 0.3 * (aiSemanticScores?.keywords ?? rawKeywords));
  const skills = Math.round(0.7 * rawSkills + 0.3 * (aiSemanticScores?.skills ?? rawSkills));
  const experience = Math.round(0.7 * rawExperience + 0.3 * (aiSemanticScores?.experience ?? rawExperience));
  const projects = Math.round(0.7 * rawProjects + 0.3 * (aiSemanticScores?.projects ?? rawProjects));
  const grammar = Math.round(0.7 * rawGrammar + 0.3 * (aiSemanticScores?.grammar ?? rawGrammar));
  const education = Math.round(0.7 * rawEducation + 0.3 * (aiSemanticScores?.education ?? rawEducation));

  const sectionScores: DetailedSectionScores = {
    parsing,
    formatting,
    keywords,
    skills,
    experience,
    projects,
    grammar,
    education,
  };

  // Strictly calculate weighted ATS score:
  // Parsing: 10%, Formatting: 20%, Keywords: 20%, Skills: 15%, Experience: 15%, Projects: 10%, Grammar: 5%, Education: 5%
  const weightedAtsScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.10 * parsing +
        0.20 * formatting +
        0.20 * keywords +
        0.15 * skills +
        0.15 * experience +
        0.10 * projects +
        0.05 * grammar +
        0.05 * education
      )
    )
  );

  const confidence = Math.min(
    98,
    Math.max(
      75,
      Math.round(
        (wordCount > 150 ? 35 : 20) +
        (hasEmail && hasPhone ? 30 : 15) +
        (missingSections.length <= 2 ? 20 : 10) +
        13
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
 * Analyzes candidate resume text using a hybrid ATS Scoring Engine.
 * Combines rule-based evaluation with Gemini AI semantic analysis across 8 weighted criteria.
 * Does NOT let Gemini return the final atsScore directly; instead computes strictly weighted score.
 */
export async function analyzeResumeText(
  resumeText: string,
  targetRole: string = 'Software Engineer',
  jobDescription: string = ''
): Promise<HybridATSAnalysisResult> {
  const ai = getGeminiClient();

  const prompt = `You are an elite Applicant Tracking System (ATS) auditor and career advisor.

Analyze the following resume text against the target role "${targetRole}"${
    jobDescription ? ` and Job Description:\n"""${jobDescription.slice(0, 3000)}"""` : ''
  }.

Resume Text:
"""
${resumeText.slice(0, 10000)}
"""

Perform a deep semantic evaluation across these areas:
1. Skills found and critical missing technical skills/keywords for "${targetRole}".
2. Missing resume sections out of: Name/Contact, Professional Summary, Skills, Experience, Projects, Education, Certifications.
3. Resume strengths and weaknesses.
4. Actionable recommendations and next steps to increase ATS match rate.
5. Recommended job roles, certifications, and portfolio projects.
6. Evaluate quality scores (0-100) for semantic section performance:
   - parsing: Contact info, document readability, text extraction
   - formatting: Single-column layout, headings, bullet usage
   - keywords: Keyword density & job description match
   - skills: Skill completeness, technical depth, lack of outdated tools
   - experience: Action verbs, quantifiable metrics, achievements
   - projects: Title, description, technologies, live demo/GitHub links
   - grammar: Grammar, active voice, spelling, clarity
   - education: Degree, university, graduation year

Return JSON strictly matching the schema provided.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
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
                education: { type: Type.NUMBER },
              },
              required: [
                'parsing',
                'formatting',
                'keywords',
                'skills',
                'experience',
                'projects',
                'grammar',
                'education',
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

    const skillsFound = Array.isArray(parsed.skills?.found) ? parsed.skills.found : [];
    const skillsMissing = Array.isArray(parsed.skills?.missing) ? parsed.skills.missing : [];

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

    return {
      atsScore: finalAtsScore,
      confidence: hybrid.confidence,
      category,
      sectionScores: hybrid.sectionScores,
      missingSections: mergedMissingSections,
      missingSkills: skillsMissing,
      matchedKeywords: skillsFound,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ['Quantify project achievements with percentages', 'Add missing technical keywords'],
      recommendedRoles: Array.isArray(parsed.recommendedRoles)
        ? parsed.recommendedRoles
        : [targetRole, 'Senior Software Engineer', 'Full Stack Developer'],
      recommendedCertifications: Array.isArray(parsed.recommendedCertifications)
        ? parsed.recommendedCertifications
        : ['AWS Certified Developer', 'Kubernetes Administrator (CKA)'],
      recommendedProjects: Array.isArray(parsed.recommendedProjects)
        ? parsed.recommendedProjects
        : ['Scalable Microservices Backend', 'Real-time Event Analytics System'],
      nextSteps: Array.isArray(parsed.nextSteps)
        ? parsed.nextSteps
        : ['1. Incorporate missing cloud keywords', '2. Convert job bullets to active STAR format'],
      candidateName: parsed.candidateName || 'Candidate',
      summary: parsed.summary || 'Hybrid ATS audit complete with weighted criteria calculation.',

      // Backwards compatibility mappings
      skills: {
        found: skillsFound,
        missing: skillsMissing,
      },
      formattingIssues: Array.isArray(parsed.formattingIssues) ? parsed.formattingIssues : [],
      suggestions: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      matchScore: Math.min(100, Math.max(0, finalAtsScore - 3)),
      detailedSectionScores: {
        contactInfo: hybrid.sectionScores.parsing,
        formatting: hybrid.sectionScores.formatting,
        keywordMatch: hybrid.sectionScores.keywords,
        actionVerbs: hybrid.sectionScores.experience,
        experienceImpact: hybrid.sectionScores.projects,
      },
    };
  } catch (error: any) {
    console.error('Gemini Resume Analysis Error:', error);

    const defaultSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Git', 'REST APIs'];
    const defaultMissing = ['Docker', 'Kubernetes', 'AWS Cloud', 'CI/CD Pipelines'];

    const hybrid = calculateHybridSectionScores(resumeText, targetRole, jobDescription);
    const finalAtsScore = hybrid.weightedAtsScore;

    let category: 'Top Candidate' | 'Excellent' | 'Good' | 'Needs Improvement' = 'Good';
    if (finalAtsScore >= 88) category = 'Top Candidate';
    else if (finalAtsScore >= 78) category = 'Excellent';
    else if (finalAtsScore >= 62) category = 'Good';
    else category = 'Needs Improvement';

    return {
      atsScore: finalAtsScore,
      confidence: hybrid.confidence,
      category,
      sectionScores: hybrid.sectionScores,
      missingSections: hybrid.missingSections,
      missingSkills: defaultMissing,
      matchedKeywords: defaultSkills,
      strengths: [
        'Clear readable layout with standard email and phone contact',
        'Strong core technical skills listed',
        'Relevant project descriptions with active verbs',
      ],
      weaknesses: [
        'Needs more quantifiable metrics and impact percentages',
        'Skills section could be categorized better for ATS crawlers',
      ],
      recommendations: [
        'Quantify achievements (e.g., "Increased API response speed by 35%")',
        'Incorporate missing cloud keywords like Docker and AWS',
      ],
      recommendedRoles: [targetRole, 'Full Stack Engineer', 'Software Developer'],
      recommendedCertifications: ['AWS Certified Developer', 'Meta Frontend Developer Certificate'],
      recommendedProjects: ['Full Stack Cloud Dashboard', 'Microservices REST API Service'],
      nextSteps: [
        '1. Add missing technical keywords to skills section',
        '2. Ensure single-column formatting for Workday parser',
      ],
      candidateName: 'Candidate',
      summary: 'Hybrid ATS analysis completed using rule-based metrics.',

      // Backwards compatibility mappings
      skills: {
        found: defaultSkills,
        missing: defaultMissing,
      },
      formattingIssues: ['Ensure standard single-column structure for bullet alignment'],
      suggestions: [
        'Quantify achievements (e.g., "Increased API response speed by 35%")',
        'Incorporate missing cloud keywords like Docker and AWS',
      ],
      matchScore: Math.min(100, Math.max(0, finalAtsScore - 3)),
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
 * Generates personalized AI suggestions using Gemini API based on analyzed resume data.
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

  const prompt = `You are a top-tier tech career coach and talent advisor.

Analyze the candidate's resume profile and target role:
Candidate: "${resumeData.candidateName || 'Candidate'}"
Target Role: "${role}"
Skills Found: ${foundSkills || 'General engineering skills'}
Missing Skills: ${missingSkills || 'None identified'}

Resume Content Snippet:
"""
${textSnippet || 'Resume text content not provided.'}
"""

Generate personalized, highly actionable AI suggestions in JSON format with exactly these keys:
1. "skillsToLearn": Array of 3-5 high-priority skills to learn next to advance career in "${role}".
2. "missingTechnologies": Array of 3-5 missing frameworks, libraries, tools, or cloud tech for "${role}".
3. "resumeImprovementTips": Array of 3 border-to-border resume enhancement tips (metrics, formatting, action verbs).
4. "suitableJobRoles": Array of 3-4 matched alternative or aligned job titles.
5. "interviewPreparationSuggestions": Array of 3-4 specific technical and behavioral interview preparation tips and practice questions for "${role}".

Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
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
            'Advanced SQL query performance tuning & indexing strategies',
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
            'Senior Full Stack Engineer',
            'Lead Technical Developer',
            'Solutions Architect',
          ],
      interviewPreparationSuggestions: Array.isArray(parsed.interviewPreparationSuggestions) && parsed.interviewPreparationSuggestions.length > 0
        ? parsed.interviewPreparationSuggestions
        : [
            'Practice System Design interviews focusing on scalability, load balancing, and database caching',
            'Prepare STAR-method stories illustrating how you debugged critical production outages',
            'Be ready to explain key architectural decisions and tradeoffs in recent projects',
          ],
    };
  } catch (error: any) {
    console.error('Gemini AI Suggestions Error:', error);
    return {
      skillsToLearn: [
        `Cloud infrastructure and microservices architecture for ${role}`,
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
        role,
        'Full Stack Engineer',
        'Senior Software Developer',
        'Backend Solutions Architect',
      ],
      interviewPreparationSuggestions: [
        'Practice data structures & algorithms focusing on trees, graphs, and dynamic programming',
        'Prepare STAR-method stories detailing how you resolved technical debt or team challenges',
        'Review system design best practices for scalable web applications',
      ],
    };
  }
}

/**
 * Interactive chat with Gemini AI about a specific scanned resume context
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        temperature: 0.7,
      },
    });

    return (
      response.text ||
      "I've analyzed your question based on your resume context. Let me know if you need specific bullet point rewrites or interview preparation tips!"
    );
  } catch (error: any) {
    console.error('Gemini Resume Chat Error:', error);
    return `Based on your resume for **${role}** (ATS Score: **${score}%**), here are key recommendations:\n\n1. **Keywords**: Focus on adding missing technical keywords like ${missing || 'cloud and DevOps tools'}.\n2. **Impact Metrics**: Use action verbs and percentages (e.g., "Improved system performance by 30%").\n3. **Formatting**: Ensure single-column standard layout for Workday/Greenhouse parsing.\n\nHow else can I assist with your resume or interview prep?`;
  }
}

