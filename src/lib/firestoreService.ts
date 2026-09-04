import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ResumeRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Database Folder Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Database folder constants
export const DATABASE_FOLDERS = {
  PERSONAL_PORTAL: 'personal_portal',
  RECRUITERS_PORTAL: 'recruiters_portal',
} as const;

export type PortalFolder = typeof DATABASE_FOLDERS[keyof typeof DATABASE_FOLDERS];

/**
 * Save resume or applicant screening record to designated database folder
 */
export async function saveToDatabaseFolder(
  folder: PortalFolder,
  userEmail: string,
  record: ResumeRecord
): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${folder}/${record.id}`;
  try {
    const docRef = doc(db, folder, record.id);
    const dataToSave = {
      ...record,
      userId: userEmail,
      recruiterId: userEmail,
      portalType: folder === DATABASE_FOLDERS.PERSONAL_PORTAL ? 'personal' : 'recruiter',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch records for current portal user from designated database folder
 */
export async function fetchFromDatabaseFolder(
  folder: PortalFolder,
  userEmail: string
): Promise<ResumeRecord[]> {
  if (!auth.currentUser) {
    return [];
  }
  const path = folder;
  try {
    const colRef = collection(db, folder);
    const idKey = folder === DATABASE_FOLDERS.PERSONAL_PORTAL ? 'userId' : 'recruiterId';
    const q = query(colRef, where(idKey, '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    const results: ResumeRecord[] = [];
    querySnapshot.forEach((documentSnap) => {
      const data = documentSnap.data();
      results.push({
        id: documentSnap.id,
        candidateName: data.candidateName || 'Candidate',
        fileName: data.fileName || 'Document.pdf',
        fileSize: data.fileSize || '250 KB',
        targetRole: data.targetRole || data.jobTitle || 'Role',
        uploadDate: data.uploadDate || new Date().toLocaleDateString(),
        atsScore: data.atsScore || 0,
        matchScore: data.matchScore || data.atsScore || 0,
        confidence: data.confidence,
        category: data.category,
        status: data.status || 'Completed',
        missingSkills: data.missingSkills || [],
        matchedKeywords: data.matchedKeywords || [],
        missingSections: data.missingSections || [],
        sectionScores: data.sectionScores,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
        recommendations: data.recommendations || [],
        recommendedRoles: data.recommendedRoles || [],
        recommendedCertifications: data.recommendedCertifications || [],
        recommendedProjects: data.recommendedProjects || [],
        nextSteps: data.nextSteps || [],
        jobDescription: data.jobDescription || '',
        recruiterEvaluation: data.recruiterEvaluation,
      });
    });
    return results;
  } catch (err) {
    // If Firestore fails or user is offline, log handled error and return empty array
    try {
      handleFirestoreError(err, OperationType.LIST, path);
    } catch {
      // Return fallback
    }
    return [];
  }
}

/**
 * Save resume or applicant screening record to BOTH personal and recruiter database folders
 * to guarantee real-time two-way synchronization between Personal & Recruiter views.
 */
export async function saveResumeToBothPortals(
  userEmail: string,
  record: ResumeRecord
): Promise<void> {
  if (!auth.currentUser) return;
  const promises: Promise<void>[] = [];
  
  try {
    promises.push(saveToDatabaseFolder(DATABASE_FOLDERS.PERSONAL_PORTAL, userEmail, record));
  } catch (e) {
    console.warn('Could not sync to personal folder:', e);
  }

  try {
    promises.push(saveToDatabaseFolder(DATABASE_FOLDERS.RECRUITERS_PORTAL, userEmail, record));
  } catch (e) {
    console.warn('Could not sync to recruiter folder:', e);
  }

  await Promise.allSettled(promises);
}

/**
 * Fetch and merge records across both folders to ensure synchronized personal and recruiter views.
 */
export async function fetchAllSyncedResumes(userEmail: string): Promise<ResumeRecord[]> {
  if (!auth.currentUser) return [];
  const [personalResumes, recruiterResumes] = await Promise.all([
    fetchFromDatabaseFolder(DATABASE_FOLDERS.PERSONAL_PORTAL, userEmail),
    fetchFromDatabaseFolder(DATABASE_FOLDERS.RECRUITERS_PORTAL, userEmail),
  ]);

  const map = new Map<string, ResumeRecord>();
  // Personal first
  personalResumes.forEach((r) => map.set(r.id, r));
  // Recruiter overrides/merges with recruiter evaluation & notes
  recruiterResumes.forEach((r) => {
    const existing = map.get(r.id);
    if (existing) {
      map.set(r.id, {
        ...existing,
        ...r,
        recruiterEvaluation: r.recruiterEvaluation || existing.recruiterEvaluation,
      });
    } else {
      map.set(r.id, r);
    }
  });

  return Array.from(map.values());
}

/**
 * Delete a document from a specific database folder
 */
export async function deleteFromDatabaseFolder(
  folder: PortalFolder,
  recordId: string
): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${folder}/${recordId}`;
  try {
    const docRef = doc(db, folder, recordId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Delete a record from both folders simultaneously to preserve sync
 */
export async function deleteResumeFromBothPortals(recordId: string): Promise<void> {
  if (!auth.currentUser) return;
  await Promise.allSettled([
    deleteFromDatabaseFolder(DATABASE_FOLDERS.PERSONAL_PORTAL, recordId),
    deleteFromDatabaseFolder(DATABASE_FOLDERS.RECRUITERS_PORTAL, recordId),
  ]);
}
