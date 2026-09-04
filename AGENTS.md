# Resume Analyzer - Multi-Role Architectural Guidelines

## Core Principles

This application features two completely decoupled portals:
1. **Personal Portal** (Job Seeker ATS Optimization & Resume Scoring)
2. **Recruiter Portal** (Talent Acquisition, Cohort Management, Bulk Candidate Screening & Side-by-Side Comparison)

Even if both portals share visual motifs or design language, their logic, components, state management, and data schemas **MUST REMAIN 100% DECOUPLED AND INDEPENDENT**.

---

## Strict Development Rules

### 1. Zero Unintended Syncing
- Any feature addition, styling tweak, state change, or schema adjustment made to the **Personal portal** must **NOT** automatically propagate, bleed into, or sync with the **Recruiter portal** (and vice versa).
- Do not make shared global modifications to component files that serve both portals unless explicitly instructed for both.

### 2. Component & Logic Separation
- Maintain dedicated view components:
  - `src/components/personal/PersonalDashboard.tsx` for Job Seeker workflows
  - `src/components/recruiter/RecruiterDashboard.tsx` for Recruiter / Talent workflows
- Keep API calls, LLM prompt templates, and response schemas separated by role:
  - Personal: `personalAnalysisSchema`, job seeker ATS scoring, keyword optimization, individual score history.
  - Recruiter: `recruiterEvaluationSchema`, cohort folders, fit rating (Strong Hire / Lean Hire / Pass), side-by-side candidate comparison, interview question generators.

### 3. Role-Based Context & Independent State
- Treat each portal as an independent workflow.
- Do not share mutable state or cross-pollinate caches between personal and recruiter sessions.
- Keep Firestore collections and local storage namespaces separated (e.g., `ats_user_resumes_personal_*` vs `ats_user_resumes_recruiter_*`).

### 4. Scoped Changes
- When generating or modifying code for the Personal section, ensure all changes are strictly scoped to its own files and state, leaving the Recruiter portal entirely untouched.
- When generating or modifying code for the Recruiter section, ensure all changes are strictly scoped to its own files and state, leaving the Personal portal entirely untouched.
