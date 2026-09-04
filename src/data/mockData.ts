import { ResumeRecord, StatItem, Recommendation } from '../types';

export const initialResumes: ResumeRecord[] = [
  {
    id: 'res-1',
    candidateName: 'Alex Morgan',
    fileName: 'Alex_Morgan_Senior_Frontend.pdf',
    fileSize: '1.2 MB',
    targetRole: 'Senior Frontend Engineer',
    uploadDate: '2026-07-22',
    atsScore: 92,
    matchScore: 88,
    status: 'Excellent',
    missingSkills: ['GraphQL', 'Web Vitals Optimization', 'CI/CD Pipelines'],
    matchedKeywords: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'State Management', 'Jest', 'REST APIs'],
    recruiterEvaluation: {
      fitRating: 'Strong Hire',
      candidateFitScore: 93,
      hiringRecommendation: 'Top-tier senior frontend candidate with comprehensive React/TypeScript architecture experience. Demonstrates quantifiable performance gains and team leadership.',
      keyStrengths: [
        'Advanced architectural ownership in React 18+ and TypeScript',
        'Proven history of improving Core Web Vitals and frontend latency',
        'Strong automated testing discipline with Jest and React Testing Library'
      ],
      redFlags: [
        'Minor gap in cloud CI/CD automated deployment pipelines',
        'Short 1-year stint at previous startup requires quick tenure check'
      ],
      skillGaps: ['GraphQL client/schema design', 'CI/CD pipeline automation'],
      tailoredInterviewQuestions: {
        technical: [
          'How do you diagnose and debug subtle hydration and re-render bottlenecks in large Next.js applications?',
          'Walk through your experience migrating a REST-heavy client architecture towards GraphQL or server actions.'
        ],
        behavioral: [
          'Tell me about your transition out of your previous startup: what technical goals did you accomplish before moving on?',
          'How do you negotiate code quality standards versus aggressive sprint deadlines with product managers?'
        ]
      },
      candidateNotes: 'Fast-track to technical screening round. Strong culture fit candidate.'
    }
  },
  {
    id: 'res-2',
    candidateName: 'Sarah Chen',
    fileName: 'Sarah_Chen_Product_Manager_2026.docx',
    fileSize: '840 KB',
    targetRole: 'Lead Product Manager',
    uploadDate: '2026-07-21',
    atsScore: 85,
    matchScore: 82,
    status: 'Good',
    missingSkills: ['SQL Data Queries', 'A/B Testing Frameworks'],
    matchedKeywords: ['Agile Roadmap', 'User Journey', 'Product Strategy', 'Jira', 'Cross-functional Leadership'],
    recruiterEvaluation: {
      fitRating: 'Lean Hire',
      candidateFitScore: 84,
      hiringRecommendation: 'Solid product strategist with clear cross-functional leadership and agile roadmap delivery. Needs probing on direct quantitative data analytics autonomy.',
      keyStrengths: [
        'Strong cross-functional leadership across engineering, design, and executive stakeholders',
        'Clearly defined user journey mapping and customer discovery methodologies',
        'Proven track record delivering 0-to-1 SaaS feature roadmaps on schedule'
      ],
      redFlags: [
        'Absence of direct SQL querying or self-serve telemetry analysis on resume',
        'High-level metrics listed without granular sample size or statistically significant confidence intervals'
      ],
      skillGaps: ['Self-serve SQL extraction', 'Advanced multivariate A/B testing frameworks'],
      tailoredInterviewQuestions: {
        technical: [
          'Describe an A/B experiment where the test result was inconclusive or conflicting with user research. How did you make the call?',
          'Without dedicated data engineering support, how do you extract, validate, and analyze customer behavioral funnels?'
        ],
        behavioral: [
          'Describe a situation where engineering pushed back strongly against your product requirement. How did you resolve the deadlock?',
          'How do you prioritize high-friction tech debt tickets against customer-facing revenue features?'
        ]
      },
      candidateNotes: 'Schedule hiring manager screen focusing on data literacy and experimental rigor.'
    }
  },
  {
    id: 'res-3',
    candidateName: 'David Kim',
    fileName: 'David_Kim_Data_Engineer_Resume.pdf',
    fileSize: '2.1 MB',
    targetRole: 'Staff Data Engineer',
    uploadDate: '2026-07-20',
    atsScore: 68,
    matchScore: 64,
    status: 'Needs Improvement',
    missingSkills: ['Apache Spark', 'Kubernetes', 'Snowflake Architecture', 'dbt'],
    matchedKeywords: ['Python', 'SQL', 'ETL Pipelines', 'AWS S3', 'PostgreSQL'],
    recruiterEvaluation: {
      fitRating: 'Pass',
      candidateFitScore: 65,
      hiringRecommendation: 'Candidate experience is geared towards mid-level relational database maintenance rather than Staff-level distributed data engineering and streaming architectures.',
      keyStrengths: [
        'Solid foundation in traditional relational PostgreSQL databases and SQL queries',
        'Hands-on experience maintaining baseline Python ETL scripts and AWS S3 storage'
      ],
      redFlags: [
        'Applying for Staff role but lacks distributed systems (Spark/Flink) and modern lakehouse architecture (Snowflake/Databricks)',
        '3 job switches in the last 2.5 years without sustained project lifecycle ownership',
        'No mention of data governance, SLA monitoring, or Kubernetes orchestration'
      ],
      skillGaps: ['Distributed compute (Apache Spark)', 'Modern data transformation (dbt)', 'Data warehousing (Snowflake)', 'Container orchestration (Kubernetes)'],
      tailoredInterviewQuestions: {
        technical: [
          'How do you manage schema evolution and backfilling when processing terabyte-scale distributed streaming datasets?',
          'What architecture patterns have you implemented to guarantee exactly-once processing in event streams?'
        ],
        behavioral: [
          'You have held 3 positions across the past 2.5 years. What prompted each transition and what long-term team environment are you seeking?',
          'Give an example of cross-team engineering leadership where you set company-wide data architecture standards.'
        ]
      },
      candidateNotes: 'Underqualified for Staff level. Consider redirecting to Mid-Level Data Analyst/Engineer pipeline.'
    }
  },
  {
    id: 'res-4',
    candidateName: 'Emily Watson',
    fileName: 'Emily_Watson_UX_Designer.pdf',
    fileSize: '3.4 MB',
    targetRole: 'Principal Product Designer',
    uploadDate: '2026-07-19',
    atsScore: 89,
    matchScore: 90,
    status: 'Excellent',
    missingSkills: ['Design System Tokens', 'Figma Variables'],
    matchedKeywords: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Accessibility (WCAG)', 'Design Systems'],
    recruiterEvaluation: {
      fitRating: 'Strong Hire',
      candidateFitScore: 91,
      hiringRecommendation: 'Exceptional UX specialist with proven design system governance, deep accessibility empathy, and rigorous user testing methodologies.',
      keyStrengths: [
        'Exemplary WCAG AA/AAA accessibility compliance knowledge and inclusive design practices',
        'Extensive experience orchestrating multi-brand enterprise design systems',
        'High business acumen connecting UX improvements to conversion lift'
      ],
      redFlags: [
        'Has primarily operated in agency/consulting settings; needs verification on deep product lifecycle iteration'
      ],
      skillGaps: ['Figma automated design token workflows', 'Developer handoff automation'],
      tailoredInterviewQuestions: {
        technical: [
          'Walk us through how you architect and maintain design tokens across multi-platform web and mobile codebases.',
          'Describe how you audited and resolved complex keyboard accessibility and screen-reader traps in an enterprise UI.'
        ],
        behavioral: [
          'In agency consulting, projects often wrap upon launch. How do you approach long-term post-launch qualitative iteration?',
          'How do you handle strong executive feedback that violates foundational user research data?'
        ]
      },
      candidateNotes: 'Excellent candidate. Move immediately to portfolio walkthrough with Design Director.'
    }
  },
  {
    id: 'res-5',
    candidateName: 'Marcus Vance',
    fileName: 'Marcus_Vance_DevOps_Specialist.pdf',
    fileSize: '1.5 MB',
    targetRole: 'Cloud Infrastructure Lead',
    uploadDate: '2026-07-18',
    atsScore: 76,
    matchScore: 78,
    status: 'Good',
    missingSkills: ['Terraform Modules', 'ArgoCD'],
    matchedKeywords: ['Docker', 'AWS', 'Linux', 'Bash Scripting', 'Prometheus', 'Grafana'],
    recruiterEvaluation: {
      fitRating: 'Review',
      candidateFitScore: 78,
      hiringRecommendation: 'Capable systems engineer with solid Linux/Docker container foundation. Needs validation on GitOps declarative infrastructure and multi-region failover.',
      keyStrengths: [
        'Robust Linux systems administration and proactive Prometheus/Grafana monitoring',
        'Proven on-call incident response and root-cause analysis capability'
      ],
      redFlags: [
        'Lacks declarative Infrastructure as Code (Terraform) module authoring on resume',
        'Experience is centered around single-cluster manual deployment scripts'
      ],
      skillGaps: ['Terraform IaC modules', 'GitOps deployment automation (ArgoCD)', 'Multi-region disaster recovery'],
      tailoredInterviewQuestions: {
        technical: [
          'How do you structure reusable, version-controlled Terraform modules with remote state locking and drift detection?',
          'How would you design a zero-downtime rollback strategy across a Kubernetes cluster using ArgoCD?'
        ],
        behavioral: [
          'Walk through the most critical production outage you managed as incident commander: what was the root cause and post-mortem takeaway?',
          'How do you foster a culture of blameless post-mortems when developer error causes an outage?'
        ]
      },
      candidateNotes: 'Recommend technical phone screen with Senior DevOps Engineer before on-site.'
    }
  }
];

export const statItems: StatItem[] = [
  {
    title: 'Resumes Analyzed',
    value: '1,428',
    change: '+14.2%',
    isPositive: true,
    description: 'vs last month',
    iconName: 'FileText'
  },
  {
    title: 'Avg. ATS Compatibility',
    value: '86.4%',
    change: '+5.8%',
    isPositive: true,
    description: 'parser benchmark score',
    iconName: 'CheckCircle2'
  },
  {
    title: 'Job Match Rate',
    value: '82.1%',
    change: '+3.1%',
    isPositive: true,
    description: 'alignment with requirements',
    iconName: 'Target'
  },
  {
    title: 'Critical Fixes Flagged',
    value: '34',
    change: '-18%',
    isPositive: true,
    description: 'formatting & keyword gaps',
    iconName: 'AlertTriangle'
  }
];

export const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    type: 'critical',
    title: 'Unparseable Multi-Column Layout Detected',
    description: 'Your current resume layout uses double columns which cause standard ATS scanners to merge unrelated job dates and titles.',
    impact: '+12 Score Boost if fixed'
  },
  {
    id: 'rec-2',
    type: 'warning',
    title: 'Missing Core Keywords for Senior Role',
    description: 'Found high correlation keywords in target job descriptions that are absent: "System Architecture", "Mentorship", and "Budgeting".',
    impact: '+8% Match Increase'
  },
  {
    id: 'rec-3',
    type: 'success',
    title: 'Strong Action Verb Usage in Experience Section',
    description: '94% of bullet points begin with high-impact power verbs like "Architected", "Engineered", "Spearheaded", and "Optimized".',
    impact: 'Passes Impact Filter'
  }
];
