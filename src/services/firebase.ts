import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inisialisasi Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Database ID eksplisit dari config Firestore Enterprise/Standard
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Inisialisasi Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Uji sambungan ke Firestore semasa aplikasi mula berjalan
export async function testFirebaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Firebase Firestore connection verified successfully');
    return { success: true, message: 'Sambungan Firebase Firestore berjaya' };
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('⚠️ Firebase: client is offline or network restricted');
      return { success: false, message: 'Pelayan luar talian' };
    }
    // Jika dokumen test tidak wujud atau permission granted, ia tetap sah bahawa sambungan hidup
    console.log('ℹ️ Firebase Firestore responding:', error?.code || error?.message);
    return { success: true, message: 'Firebase Firestore sedia digunakan' };
  }
}

// Log masuk menggunakan Google Popup
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// ==========================================
// Cloud Firestore Synchronizers for MyKursus
// ==========================================

export async function syncCourseToFirestore(course: any): Promise<void> {
  if (!course?.id) return;
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), {
      ...course,
      updatedAt: course.updatedAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSessionToFirestore(session: any): Promise<void> {
  if (!session?.id || !session?.courseId) return;
  const path = `courses/${session.courseId}/sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'courses', session.courseId, 'sessions', session.id), {
      ...session,
      updatedAt: session.updatedAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSessionFromFirestore(courseId: string, sessionId: string): Promise<void> {
  const path = `courses/${courseId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncScheduleDayToFirestore(day: any): Promise<void> {
  if (!day?.id || !day?.courseId) return;
  const path = `courses/${day.courseId}/scheduleDays/${day.id}`;
  try {
    await setDoc(doc(db, 'courses', day.courseId, 'scheduleDays', day.id), {
      ...day,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteScheduleDayFromFirestore(courseId: string, dayId: string): Promise<void> {
  const path = `courses/${courseId}/scheduleDays/${dayId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'scheduleDays', dayId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAnnouncementToFirestore(announcement: any): Promise<void> {
  if (!announcement?.id || !announcement?.courseId) return;
  const path = `courses/${announcement.courseId}/announcements/${announcement.id}`;
  try {
    await setDoc(doc(db, 'courses', announcement.courseId, 'announcements', announcement.id), {
      ...announcement,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync announcement error:', error);
  }
}

export async function deleteAnnouncementFromFirestore(courseId: string, announcementId: string): Promise<void> {
  const path = `courses/${courseId}/announcements/${announcementId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'announcements', announcementId));
  } catch (error) {
    console.warn('Firestore delete announcement error:', error);
  }
}

export async function syncAttendanceToFirestore(attendance: any): Promise<void> {
  if (!attendance?.id || !attendance?.courseId) return;
  const path = `courses/${attendance.courseId}/attendances/${attendance.id}`;
  try {
    await setDoc(doc(db, 'courses', attendance.courseId, 'attendances', attendance.id), {
      ...attendance,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync attendance error:', error);
  }
}

export async function syncResourceToFirestore(resource: any): Promise<void> {
  if (!resource?.id || !resource?.courseId) return;
  const path = `courses/${resource.courseId}/resources/${resource.id}`;
  try {
    await setDoc(doc(db, 'courses', resource.courseId, 'resources', resource.id), {
      ...resource,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync resource error:', error);
  }
}

export async function deleteResourceFromFirestore(courseId: string, resourceId: string): Promise<void> {
  const path = `courses/${courseId}/resources/${resourceId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'resources', resourceId));
  } catch (error) {
    console.warn('Firestore delete resource error:', error);
  }
}

export async function syncParticipantToFirestore(participant: any): Promise<void> {
  if (!participant?.id) return;
  try {
    await setDoc(doc(db, 'participants', participant.id), {
      ...participant,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync participant error:', error);
  }
}

export async function syncEnrollmentToFirestore(enrollment: any): Promise<void> {
  if (!enrollment?.id || !enrollment?.courseId) return;
  const path = `courses/${enrollment.courseId}/enrollments/${enrollment.id}`;
  try {
    await setDoc(doc(db, 'courses', enrollment.courseId, 'enrollments', enrollment.id), {
      ...enrollment,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync enrollment error:', error);
  }
}

export async function deleteEnrollmentFromFirestore(courseId: string, enrollmentId: string): Promise<void> {
  const path = `courses/${courseId}/enrollments/${enrollmentId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'enrollments', enrollmentId));
  } catch (error) {
    console.warn('Firestore delete enrollment error:', error);
  }
}


