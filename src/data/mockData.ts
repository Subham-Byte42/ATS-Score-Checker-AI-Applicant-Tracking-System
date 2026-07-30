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
