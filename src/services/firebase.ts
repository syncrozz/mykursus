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
  where,
  onSnapshot 
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
    if (
      error?.code === 'unavailable' || 
      error?.message?.includes('the client is offline') ||
      error?.message?.includes('Could not reach') ||
      error?.message?.includes('unavailable')
    ) {
      console.warn('⚠️ Firebase: client is offline or network restricted, operating in offline cache mode');
      return { success: false, message: 'Pelayan di luar talian (mod cache aktif)' };
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
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('unavailable')) {
      console.warn('Firestore offline, queued locally for course:', course.id);
      return;
    }
    console.warn('Firestore sync course error:', error);
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
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('unavailable')) {
      console.warn('Firestore offline, queued locally for session:', session.id);
      return;
    }
    console.warn('Firestore sync session error:', error);
  }
}

export async function deleteSessionFromFirestore(courseId: string, sessionId: string): Promise<void> {
  const path = `courses/${courseId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'sessions', sessionId));
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('unavailable')) {
      return;
    }
    console.warn('Firestore delete session error:', error);
  }
}

export async function syncScheduleDayToFirestore(day: any): Promise<void> {
  if (!day?.id || !day?.courseId) return;
  const path = `courses/${day.courseId}/scheduleDays/${day.id}`;
  try {
    await setDoc(doc(db, 'courses', day.courseId, 'scheduleDays', day.id), {
      ...day,
    }, { merge: true });
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('unavailable')) {
      console.warn('Firestore offline, queued locally for scheduleDay:', day.id);
      return;
    }
    console.warn('Firestore sync scheduleDay error:', error);
  }
}

export async function deleteScheduleDayFromFirestore(courseId: string, dayId: string): Promise<void> {
  const path = `courses/${courseId}/scheduleDays/${dayId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'scheduleDays', dayId));
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('unavailable')) {
      return;
    }
    console.warn('Firestore delete scheduleDay error:', error);
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

export async function deleteAttendanceFromFirestore(courseId: string, attendanceId: string): Promise<void> {
  if (!courseId || !attendanceId) return;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'attendances', attendanceId));
  } catch (error) {
    console.warn('Firestore delete attendance error:', error);
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

export async function syncSourceDocumentToFirestore(sourceDoc: any): Promise<void> {
  if (!sourceDoc?.id || !sourceDoc?.courseId) return;
  try {
    await setDoc(doc(db, 'courses', sourceDoc.courseId, 'sourceDocuments', sourceDoc.id), {
      ...sourceDoc,
      updatedAt: sourceDoc.updatedAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync source document error:', error);
  }
}

export async function deleteSourceDocumentFromFirestore(courseId: string, docId: string): Promise<void> {
  if (!courseId || !docId) return;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'sourceDocuments', docId));
  } catch (error) {
    console.warn('Firestore delete source document error:', error);
  }
}

export async function syncOrganizerToFirestore(organizer: any): Promise<void> {
  if (!organizer?.id) return;
  try {
    await setDoc(doc(db, 'organizers', organizer.id), {
      ...organizer,
      updatedAt: organizer.updatedAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync organizer error:', error);
  }
}

export async function deleteOrganizerFromFirestore(organizerId: string): Promise<void> {
  if (!organizerId) return;
  try {
    await deleteDoc(doc(db, 'organizers', organizerId));
  } catch (error) {
    console.warn('Firestore delete organizer error:', error);
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

export async function deleteParticipantFromFirestore(participantId: string): Promise<void> {
  if (!participantId) return;
  const path = `participants/${participantId}`;
  try {
    await deleteDoc(doc(db, 'participants', participantId));
  } catch (error) {
    console.warn('Firestore delete participant error:', error);
  }
}

export async function deleteCourseFromFirestore(courseId: string): Promise<void> {
  if (!courseId) return;
  try {
    // Clean all subcollections belonging to this course
    const subcollections = ['sessions', 'scheduleDays', 'announcements', 'resources', 'enrollments', 'attendances', 'sourceDocuments'];
    for (const subName of subcollections) {
      try {
        const subSnap = await getDocs(collection(db, 'courses', courseId, subName));
        const deletePromises = subSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (err) {
        console.warn(`Error deleting subcollection ${subName} for course ${courseId}:`, err);
      }
    }

    // Delete the root course document
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    console.warn('Firestore delete course error:', error);
  }
}

export async function clearAllFirestoreData(): Promise<void> {
  try {
    // 1. Delete all courses and nested subcollections
    const coursesSnap = await getDocs(collection(db, 'courses'));
    for (const courseDoc of coursesSnap.docs) {
      await deleteCourseFromFirestore(courseDoc.id);
    }

    // 2. Delete all participants
    const participantsSnap = await getDocs(collection(db, 'participants'));
    const partDeletes = participantsSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(partDeletes);
  } catch (error) {
    console.warn('Firestore clearAllFirestoreData error:', error);
  }
}


// ==========================================
// Cloud Firestore Pull & Query Functions
// ==========================================

export async function pullCoursesFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const courses: any[] = [];
    snap.forEach(d => courses.push({ id: d.id, ...d.data() }));
    return courses;
  } catch (error) {
    console.warn('Firestore pull courses error:', error);
    return [];
  }
}

export async function pullParticipantsFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'participants'));
    const parts: any[] = [];
    snap.forEach(d => parts.push({ id: d.id, ...d.data() }));
    return parts;
  } catch (error) {
    console.warn('Firestore pull participants error:', error);
    return [];
  }
}

export async function pullOrganizersFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'organizers'));
    const orgs: any[] = [];
    snap.forEach(d => orgs.push({ id: d.id, ...d.data() }));
    return orgs;
  } catch (error) {
    console.warn('Firestore pull organizers error:', error);
    return [];
  }
}

export async function pullCourseSubcollections(courseId: string): Promise<{
  scheduleDays: any[];
  sessions: any[];
  announcements: any[];
  resources: any[];
  enrollments: any[];
  attendances: any[];
}> {
  try {
    const [daysSnap, sessionsSnap, annSnap, resSnap, enrSnap, attSnap] = await Promise.all([
      getDocs(collection(db, 'courses', courseId, 'scheduleDays')),
      getDocs(collection(db, 'courses', courseId, 'sessions')),
      getDocs(collection(db, 'courses', courseId, 'announcements')),
      getDocs(collection(db, 'courses', courseId, 'resources')),
      getDocs(collection(db, 'courses', courseId, 'enrollments')),
      getDocs(collection(db, 'courses', courseId, 'attendances')),
    ]);

    const scheduleDays: any[] = [];
    daysSnap.forEach(d => scheduleDays.push({ id: d.id, ...d.data() }));

    const sessions: any[] = [];
    sessionsSnap.forEach(d => sessions.push({ id: d.id, ...d.data() }));

    const announcements: any[] = [];
    annSnap.forEach(d => announcements.push({ id: d.id, ...d.data() }));

    const resources: any[] = [];
    resSnap.forEach(d => resources.push({ id: d.id, ...d.data() }));

    const enrollments: any[] = [];
    enrSnap.forEach(d => enrollments.push({ id: d.id, ...d.data() }));

    const attendances: any[] = [];
    attSnap.forEach(d => attendances.push({ id: d.id, ...d.data() }));

    return { scheduleDays, sessions, announcements, resources, enrollments, attendances };
  } catch (error) {
    console.warn('Firestore pull course subcollections error:', error);
    return { scheduleDays: [], sessions: [], announcements: [], resources: [], enrollments: [], attendances: [] };
  }
}

export async function queryParticipantByPhoneInFirestore(
  courseId: string, 
  rawInputPhone: string
): Promise<{ participant: any; enrollment: any } | null> {
  try {
    const cleanInput = (rawInputPhone || '').trim().toLowerCase();
    if (!cleanInput || cleanInput.length < 2) return null;
    const normInput = rawInputPhone.replace(/\D/g, '').replace(/^6/, '');

    const partsSnap = await getDocs(collection(db, 'participants'));
    let matchedParticipant: any = null;

    partsSnap.forEach(d => {
      const data = d.data();
      const pPhone = String(data.phone || '').replace(/\D/g, '').replace(/^6/, '');
      const pSalary = String(data.salaryNumber || '').trim().toLowerCase();

      const phoneMatch = Boolean(
        pPhone && normInput && normInput.length >= 7 && 
        (pPhone === normInput || (pPhone.length >= 8 && normInput.length >= 8 && (pPhone.endsWith(normInput) || normInput.endsWith(pPhone))))
      );
      const salaryMatch = Boolean(pSalary && pSalary === cleanInput);

      if (phoneMatch || salaryMatch) {
        matchedParticipant = { id: d.id, ...data };
      }
    });

    if (!matchedParticipant) return null;

    const enrSnap = await getDocs(collection(db, 'courses', courseId, 'enrollments'));
    let matchedEnrollment: any = null;
    enrSnap.forEach(d => {
      const data = d.data();
      if (data.participantId === matchedParticipant.id) {
        matchedEnrollment = { id: d.id, ...data };
      }
    });

    if (matchedEnrollment) {
      return { participant: matchedParticipant, enrollment: matchedEnrollment };
    }

    return null;
  } catch (error) {
    console.warn('Firestore queryParticipantByPhone error:', error);
    return null;
  }
}

export async function syncAllLocalDataToFirestore(data: {
  courses?: any[];
  organizers?: any[];
  scheduleDays?: any[];
  sessions?: any[];
  announcements?: any[];
  resources?: any[];
  participants?: any[];
  enrollments?: any[];
  attendances?: any[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;
    for (const org of data.organizers || []) {
      if (org.id) {
        await syncOrganizerToFirestore(org);
        count++;
      }
    }
    for (const p of data.participants || []) {
      if (p.id) {
        await syncParticipantToFirestore(p);
        count++;
      }
    }
    for (const c of data.courses || []) {
      if (c.id) {
        await syncCourseToFirestore(c);
        count++;
      }
    }
    for (const e of data.enrollments || []) {
      if (e.id && e.courseId) {
        await syncEnrollmentToFirestore(e);
        count++;
      }
    }
    for (const d of data.scheduleDays || []) {
      if (d.id && d.courseId) {
        await syncScheduleDayToFirestore(d);
        count++;
      }
    }
    for (const s of data.sessions || []) {
      if (s.id && s.courseId) {
        await syncSessionToFirestore(s);
        count++;
      }
    }
    for (const a of data.announcements || []) {
      if (a.id && a.courseId) {
        await syncAnnouncementToFirestore(a);
        count++;
      }
    }
    for (const r of data.resources || []) {
      if (r.id && r.courseId) {
        await syncResourceToFirestore(r);
        count++;
      }
    }
    for (const att of data.attendances || []) {
      if (att.id && att.courseId) {
        await syncAttendanceToFirestore(att);
        count++;
      }
    }
    return { success: true, count };
  } catch (error: any) {
    console.error('syncAllLocalDataToFirestore failed:', error);
    return { success: false, count: 0, error: error?.message || String(error) };
  }
}

export async function syncAllCloudDataToLocal(): Promise<{
  courses: any[];
  organizers: any[];
  participants: any[];
  enrollments: any[];
  scheduleDays: any[];
  sessions: any[];
  announcements: any[];
  resources: any[];
  attendances: any[];
}> {
  try {
    const [cloudCourses, cloudParticipants, cloudOrganizers] = await Promise.all([
      pullCoursesFromFirestore(),
      pullParticipantsFromFirestore(),
      pullOrganizersFromFirestore(),
    ]);

    const allDays: any[] = [];
    const allSessions: any[] = [];
    const allAnnouncements: any[] = [];
    const allResources: any[] = [];
    const allEnrollments: any[] = [];
    const allAttendances: any[] = [];

    for (const c of cloudCourses) {
      const sub = await pullCourseSubcollections(c.id);
      allDays.push(...sub.scheduleDays);
      allSessions.push(...sub.sessions);
      allAnnouncements.push(...sub.announcements);
      allResources.push(...sub.resources);
      allEnrollments.push(...sub.enrollments);
      allAttendances.push(...sub.attendances);
    }

    return {
      courses: cloudCourses,
      organizers: cloudOrganizers,
      participants: cloudParticipants,
      enrollments: allEnrollments,
      scheduleDays: allDays,
      sessions: allSessions,
      announcements: allAnnouncements,
      resources: allResources,
      attendances: allAttendances,
    };
  } catch (error) {
    console.error('syncAllCloudDataToLocal failed:', error);
    return {
      courses: [],
      organizers: [],
      participants: [],
      enrollments: [],
      scheduleDays: [],
      sessions: [],
      announcements: [],
      resources: [],
      attendances: [],
    };
  }
}

/**
 * Real-time subscription to Cloud Firestore collections
 */
export function setupFirestoreRealtimeSync(
  onUpdate: (type: 'organizers' | 'courses', data: any[]) => void
): () => void {
  try {
    const unsubOrganizers = onSnapshot(collection(db, 'organizers'), (snapshot) => {
      const orgs: any[] = [];
      snapshot.forEach(d => orgs.push({ id: d.id, ...d.data() }));
      onUpdate('organizers', orgs);
    }, (error) => {
      console.warn('Firestore organizers onSnapshot notice:', error?.message || error);
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const courses: any[] = [];
      snapshot.forEach(d => courses.push({ id: d.id, ...d.data() }));
      onUpdate('courses', courses);
    }, (error) => {
      console.warn('Firestore courses onSnapshot notice:', error?.message || error);
    });

    return () => {
      unsubOrganizers();
      unsubCourses();
    };
  } catch (err) {
    console.warn('setupFirestoreRealtimeSync initialization error:', err);
    return () => {};
  }
}


