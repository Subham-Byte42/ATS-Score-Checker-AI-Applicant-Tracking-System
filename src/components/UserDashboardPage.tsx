import React from 'react';
import { ResumeRecord } from '../types';
import { PersonalDashboard } from './personal/PersonalDashboard';
import { RecruiterDashboard } from './recruiter/RecruiterDashboard';

export interface UserDashboardPageProps {
  user: { name: string; email: string };
  resumes: ResumeRecord[];
  userRole?: 'personal' | 'recruiter';
  onSwitchRole?: () => void;
  onBack?: () => void;
  onAnalyzeNewResume: (record: ResumeRecord) => void;
  onAnalyzeBatch?: (records: ResumeRecord[]) => void;
  onSelectResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onLogout: () => void;
}

/**
 * UserDashboardPage
 * 
 * Strict Role Routing Layer:
 * Decouples the Personal (Job Seeker) and Recruiter portals into completely
 * isolated views with their own state, components, and workflows.
 * 
 * - Personal portal -> <PersonalDashboard />
 * - Recruiter portal -> <RecruiterDashboard />
 * 
 * In accordance with strict development rules:
 * Any change to one portal does NOT bleed or propagate to the other.
 */
export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  user,
  resumes = [],
  userRole = 'personal',
  onBack,
  onAnalyzeNewResume,
  onAnalyzeBatch,
  onSelectResume,
  onDeleteResume,
  onLogout
}) => {
  if (userRole === 'recruiter') {
    return (
      <RecruiterDashboard
        user={user}
        resumes={resumes}
        onBack={onBack}
        onAnalyzeNewResume={onAnalyzeNewResume}
        onAnalyzeBatch={onAnalyzeBatch}
        onSelectResume={onSelectResume}
        onDeleteResume={onDeleteResume}
        onLogout={onLogout}
      />
    );
  }

  return (
    <PersonalDashboard
      user={user}
      resumes={resumes}
      onBack={onBack}
      onAnalyzeNewResume={onAnalyzeNewResume}
      onSelectResume={onSelectResume}
      onDeleteResume={onDeleteResume}
      onLogout={onLogout}
    />
  );
};
