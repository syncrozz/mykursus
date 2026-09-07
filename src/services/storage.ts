import { 
  Course, 
  Organizer, 
  Participant, 
  CourseEnrollment, 
  ScheduleDay, 
  SessionItem, 
  CourseStatus, 
  ApprovalStatus, 
  AuditLog, 
  ApprovalChangeRequest, 
  UserRole, 
  Announcement, 
  CourseModuleKey,
  VerifiedParticipantData,
  ResourceMaterial,
  SourceDocument,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceLevel,
  CourseAttendanceConfig,
  ParticipantLifecycleStatus
} from '../types';
import { normalizePhoneNumber, maskPhoneNumber } from '../utils/phoneUtils';
import { 
  KIAR_PILOT_ORGANIZER, 
  KIAR_PILOT_COURSE, 
  KIAR_PILOT_SCHEDULE_DAYS, 
  KIAR_PILOT_SESSIONS, 
  KIAR_PILOT_PARTICIPANTS, 
  KIAR_PILOT_CHANGE_REQUEST,
  KIAR_PILOT_ANNOUNCEMENTS,
  KIAR_PILOT_RESOURCES,
  KIAR_PILOT_SOURCE_DOCUMENTS
} from './kiarPilotData';
import { ExtractionEngine } from './extractionEngine';
import {
  syncCourseToFirestore,
  syncSessionToFirestore,
  deleteSessionFromFirestore,
  syncScheduleDayToFirestore,
  deleteScheduleDayFromFirestore,
  syncAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  syncAttendanceToFirestore,
  syncResourceToFirestore,
  deleteResourceFromFirestore,
  syncParticipantToFirestore,
  syncEnrollmentToFirestore,
  deleteEnrollmentFromFirestore,
} from './firebase';

export interface UserAuthContext {
  id: string;
  name?: string;
  role: UserRole;
  organizerId?: string;
}

const STORAGE_KEYS = {
  COURSES: 'mykursus_courses_v1',
  ORGANIZERS: 'mykursus_organizers_v1',
  PARTICIPANTS: 'mykursus_participants_v1',
  ENROLLMENTS: 'mykursus_enrollments_v1',
  SCHEDULE_DAYS: 'mykursus_schedule_days_v1',
  SESSIONS: 'mykursus_sessions_v1',
  CHANGE_REQUESTS: 'mykursus_change_requests_v1',
  AUDIT_LOGS: 'mykursus_audit_logs_v1',
  ANNOUNCEMENTS: 'mykursus_announcements_v1',
  RESOURCES: 'mykursus_resources_v1',
  SOURCE_DOCUMENTS: 'mykursus_source_documents_v1',
  ATTENDANCE_RECORDS: 'mykursus_attendance_records_v1',
  INITIALIZED: 'mykursus_initialized_v1',
};

// Safe localStorage access
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mykursus_data_changed', { detail: { key } }));
    }
  } catch (err) {
    console.error('Storage write error for key:', key, err);
  }
}

class PlatformStorageRepository {
  private initialized = false;

  constructor() {
    this.checkInitialization();
  }

  private checkInitialization() {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const wasManuallyCleared = localStorage.getItem('mykursus_manually_cleared') === 'true';
    const existingCourses = this.getCourses();

    if (!wasManuallyCleared && (!isInit || existingCourses.length === 0)) {
      this.loadKiarPilot();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
    this.initialized = true;
  }

  // --- Audit Logging ---
  public getAuditLogs(): AuditLog[] {
    return getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public addAuditLog(
    action: string, 
    details: string, 
    courseId?: string, 
    courseTitle?: string, 
    role: UserRole = UserRole.MASTER_ADMIN
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId,
      courseTitle,
      action,
      details,
      performedByRole: role,
      timestamp: new Date().toISOString(),
    };
    // Keep most recent first, capped at 100 entries
    const updated = [newLog, ...logs].slice(0, 100);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, updated);
  }

  // --- Organizers ---
  public getOrganizers(): Organizer[] {
    return getFromStorage<Organizer[]>(STORAGE_KEYS.ORGANIZERS, []);
  }

  public getOrganizerById(id: string): Organizer | undefined {
    return this.getOrganizers().find(o => o.id === id);
  }

  public saveOrganizer(organizer: Organizer): void {
    const organizers = this.getOrganizers();
    const index = organizers.findIndex(o => o.id === organizer.id);
    if (index >= 0) {
      organizers[index] = { ...organizer, updatedAt: new Date().toISOString() };
    } else {
      organizers.push({ 
        ...organizer, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    }
    saveToStorage(STORAGE_KEYS.ORGANIZERS, organizers);
    this.addAuditLog('ORGANIZER_SAVED', `Organizer "${organizer.name}" (${organizer.code}) dikemaskini/dicipta.`);
  }

  public deleteOrganizer(id: string): boolean {
    const organizers = this.getOrganizers();
    const target = organizers.find(o => o.id === id);
    if (!target) return false;

    // Check if courses are linked
    const courses = this.getCourses();
    const linkedCourses = courses.filter(c => c.organizerId === id);
    if (linkedCourses.length > 0) {
      throw new Error(`Tidak boleh memadam organizer "${target.name}" kerana mempunyai ${linkedCourses.length} kursus aktif.`);
    }

    const filtered = organizers.filter(o => o.id !== id);
    saveToStorage(STORAGE_KEYS.ORGANIZERS, filtered);
    this.addAuditLog('ORGANIZER_DELETED', `Organizer "${target.name}" dipadam secara kekal.`);
    return true;
  }

  // --- Courses ---
  public getCourses(): Course[] {
    return getFromStorage<Course[]>(STORAGE_KEYS.COURSES, []);
  }

  public getCourseById(id: string): Course | undefined {
    return this.getCourses().find(c => c.id === id);
  }

  public getCourseBySlug(slug: string): Course | undefined {
    if (!slug) return undefined;
    const cleanSlug = slug.trim().toLowerCase().replace(/^#?\/?course\/?/, '').replace(/\/+$/, '').split('?')[0];
    if (!cleanSlug) return undefined;

    let courses = this.getCourses();
    
    // 1. Direct exact match
    let found = courses.find(c => c.slug.toLowerCase().trim() === cleanSlug);
    if (found) return found;

    // 2. Recognized aliases for KIAR Pilot Course
    const kiarAliases = [
      'kursus-transformasi-kiar-2026',
      'transformasi-pedagogi-kiar-2026',
      'transformasi-kiar-2026',
      'kursus-transformasi-pedagogi-kiar-2026',
      'kiar-2026',
      'kiar'
    ];

    const isKiarTarget = kiarAliases.includes(cleanSlug) || 
      (cleanSlug.includes('kiar') && (cleanSlug.includes('transformasi') || cleanSlug.includes('pedagogi')));

    if (isKiarTarget) {
      const existingKiar = courses.find(c => c.id === KIAR_PILOT_COURSE.id);
      if (existingKiar) {
        // Ensure slug is synced to the canonical or requested
        if (existingKiar.slug !== 'kursus-transformasi-kiar-2026') {
          existingKiar.slug = 'kursus-transformasi-kiar-2026';
          this.saveCourse(existingKiar);
        }
        return existingKiar;
      } else {
        this.loadKiarPilot();
        courses = this.getCourses();
        return courses.find(c => c.id === KIAR_PILOT_COURSE.id) || KIAR_PILOT_COURSE;
      }
    }

    // 3. Fallback: If no courses are loaded yet, load pilot
    if (courses.length === 0) {
      this.loadKiarPilot();
      courses = this.getCourses();
      found = courses.find(c => c.slug.toLowerCase().trim() === cleanSlug);
      if (found) return found;
      if (cleanSlug.includes('kiar')) {
        return courses.find(c => c.id === KIAR_PILOT_COURSE.id) || KIAR_PILOT_COURSE;
      }
    }

    // 4. Fuzzy / partial match across any existing courses
    const partial = courses.find(c => {
      const s = c.slug.toLowerCase();
      return s.includes(cleanSlug) || cleanSlug.includes(s);
    });
    if (partial) return partial;

    return undefined;
  }

  public saveCourse(course: Course): void {
    const courses = this.getCourses();
    
    // Validate slug uniqueness
    const slugCollision = courses.find(c => c.slug === course.slug && c.id !== course.id);
    if (slugCollision) {
      throw new Error(`Slug "${course.slug}" telah digunakan oleh kursus lain.`);
    }

    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = { ...course, updatedAt: new Date().toISOString() };
    } else {
      courses.push({ 
        ...course, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    }
    saveToStorage(STORAGE_KEYS.COURSES, courses);
    syncCourseToFirestore(course).catch(err => console.warn('Firestore sync course error:', err));
  }

  public deleteCourse(id: string): boolean {
    const courses = this.getCourses();
    const target = courses.find(c => c.id === id);
    if (!target) return false;

    // Permanent hard delete per DCOREV1 (Cascades to enrollments, change requests)
    const filtered = courses.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.COURSES, filtered);

    // Clean enrollments
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments.filter(e => e.courseId !== id));

    // Clean change requests
    const crs = this.getChangeRequests();
    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, crs.filter(cr => cr.courseId !== id));

    this.addAuditLog('COURSE_DELETED', `Kursus "${target.title}" dipadam secara kekal.`, id, target.title);
    return true;
  }

  // --- Governance & Approval Actions ---
  public approveCourse(courseId: string, reviewNotes?: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    course.approvalStatus = ApprovalStatus.APPROVED;
    course.status = CourseStatus.ACTIVE;
    course.approvedAt = new Date().toISOString();
    course.publishedAt = new Date().toISOString();
    course.reviewNotes = reviewNotes || 'Diluluskan oleh Master Admin.';
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'COURSE_APPROVED', 
      `Kursus diluluskan & diterbitkan. Slug: /course/${course.slug}`, 
      course.id, 
      course.title
    );
    return course;
  }

  public requestChanges(courseId: string, reviewNotes: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    course.approvalStatus = ApprovalStatus.CHANGES_REQUIRED;
    course.reviewNotes = reviewNotes;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'CHANGES_REQUESTED', 
      `Permintaan pindaan dihantar kepada penganjur. Catatan: ${reviewNotes}`, 
      course.id, 
      course.title
    );
    return course;
  }

  public rejectCourse(courseId: string, reviewNotes: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    course.approvalStatus = ApprovalStatus.REJECTED;
    course.reviewNotes = reviewNotes;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'COURSE_REJECTED', 
      `Permohonan kursus ditolak. Sebab: ${reviewNotes}`, 
      course.id, 
      course.title
    );
    return course;
  }

  public updateCourseStatus(courseId: string, newStatus: CourseStatus): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    const oldStatus = course.status;
    course.status = newStatus;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'STATUS_CHANGED', 
      `Status operasi ditukar dari ${oldStatus} kepada ${newStatus}.`, 
      course.id, 
      course.title
    );
    return course;
  }

  public toggleFeaturedActive(courseId: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    course.isFeaturedActive = !course.isFeaturedActive;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'ACTIVE_FEATURED_TOGGLED', 
      `Status paparan utama (Featured Active) ditetapkan kepada: ${course.isFeaturedActive ? 'AKTIF' : 'BIASA'}.`, 
      course.id, 
      course.title
    );
    return course;
  }

  public updateOfficialDates(courseId: string, startDate: string, endDate: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    const oldRange = `${course.startDate} - ${course.endDate}`;
    course.startDate = startDate;
    course.endDate = endDate;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'OFFICIAL_DATES_CHANGED', 
      `Tarikh rasmi dikemaskini oleh Master Admin dari [${oldRange}] ke [${startDate} - ${endDate}].`, 
      course.id, 
      course.title
    );
    return course;
  }

  public updateOfficialVenue(courseId: string, venueName: string, venueAddress?: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    const oldVenue = course.venueName;
    course.venueName = venueName;
    if (venueAddress !== undefined) course.venueAddress = venueAddress;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'OFFICIAL_VENUE_CHANGED', 
      `Lokasi rasmi dikemaskini dari "${oldVenue}" ke "${venueName}".`, 
      course.id, 
      course.title
    );
    return course;
  }

  public assignOrganizer(courseId: string, organizerId: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');
    const org = this.getOrganizerById(organizerId);
    if (!org) throw new Error('Penganjur tidak dijumpai.');

    const oldOrgId = course.organizerId;
    course.organizerId = organizerId;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'ORGANIZER_ASSIGNED', 
      `Pemilikan kursus diberikan kepada penganjur "${org.name}" (${org.code}).`, 
      course.id, 
      course.title
    );
    return course;
  }

  public updateSlug(courseId: string, newSlug: string): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    // Sanitize slug
    const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (!cleanSlug) throw new Error('Slug tidak sah.');

    const courses = this.getCourses();
    const collision = courses.find(c => c.slug === cleanSlug && c.id !== courseId);
    if (collision) {
      throw new Error(`Slug "${cleanSlug}" telah digunakan oleh kursus "${collision.title}".`);
    }

    const oldSlug = course.slug;
    course.slug = cleanSlug;
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'SLUG_UPDATED', 
      `Peringatan: Slug awam ditukar dari /course/${oldSlug} ke /course/${cleanSlug}.`, 
      course.id, 
      course.title
    );
    return course;
  }

  // --- Change Requests (Staged Modifications) ---
  public getChangeRequests(): ApprovalChangeRequest[] {
    return getFromStorage<ApprovalChangeRequest[]>(STORAGE_KEYS.CHANGE_REQUESTS, []);
  }

  public getPendingChangeRequests(): ApprovalChangeRequest[] {
    return this.getChangeRequests().filter(cr => cr.status === 'PENDING');
  }

  public saveChangeRequest(cr: ApprovalChangeRequest): void {
    const crs = this.getChangeRequests();
    const index = crs.findIndex(c => c.id === cr.id);
    if (index >= 0) {
      crs[index] = cr;
    } else {
      crs.push(cr);
    }
    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, crs);
  }

  public reviewChangeRequest(
    crId: string, 
    status: 'APPROVED' | 'REJECTED', 
    reviewComment?: string
  ): ApprovalChangeRequest {
    const crs = this.getChangeRequests();
    const cr = crs.find(c => c.id === crId);
    if (!cr) throw new Error('Permohonan pindaan tidak dijumpai.');

    cr.status = status;
    cr.reviewComment = reviewComment;
    cr.reviewedAt = new Date().toISOString();
    cr.reviewedByUserId = 'master-admin-01';

    // If approved, apply the proposed change to the official course record!
    if (status === 'APPROVED') {
      const course = this.getCourseById(cr.courseId);
      if (course) {
        if (cr.targetField === 'VENUE') {
          course.venueName = cr.proposedValue;
        } else if (cr.targetField === 'DATES') {
          const parts = cr.proposedValue.split(' to ');
          if (parts.length === 2) {
            course.startDate = parts[0];
            course.endDate = parts[1];
          }
        }
        course.hasPendingChanges = false;
        this.saveCourse(course);
      }
    }

    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, crs);
    this.addAuditLog(
      status === 'APPROVED' ? 'CHANGE_REQUEST_APPROVED' : 'CHANGE_REQUEST_REJECTED',
      `Pindaan medan [${cr.targetField}] ${status === 'APPROVED' ? 'diluluskan' : 'ditolak'}. Sebab/Ulasan: ${reviewComment || 'Tiada'}`,
      cr.courseId,
      cr.courseTitle
    );
    return cr;
  }

  // --- Participants & Enrollments ---
  public getEnrollmentsByCourseId(courseId: string): Array<{ participant: Participant; enrollment: CourseEnrollment }> {
    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []).filter(e => e.courseId === courseId);

    return enrollments.map(enr => {
      const p = participants.find(part => part.id === enr.participantId) || {
        id: enr.participantId,
        name: 'Peserta ' + enr.participantId,
        email: 'unknown@kptm.edu.my',
        phone: '010-0000000',
        institutionOrAgency: 'Agensi Luar',
        createdAt: new Date().toISOString()
      };
      return { participant: p, enrollment: enr };
    });
  }

  public getSessionsByCourseId(courseId: string): SessionItem[] {
    return getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, []).filter(s => s.courseId === courseId);
  }

  public getScheduleDaysByCourseId(courseId: string): ScheduleDay[] {
    return getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, []).filter(s => s.courseId === courseId);
  }

  public getPublishedCourses(): Course[] {
    return this.getCourses().filter(c => c.approvalStatus === ApprovalStatus.APPROVED);
  }

  /**
   * Section 08 & 09 — Participant Phone Verification (Lightweight MVP verification model)
   * Course-scoped authorization: validates registered phone against this course's enrollments.
   * Returns strictly sanitized, minimal necessary data (names, room, roommate, group).
   * Never leaks internal administrative IDs, salary numbers, or private secretariat notes.
   */
  public verifyParticipantPhoneForCourse(
    courseId: string, 
    rawInputPhone: string
  ): VerifiedParticipantData | null {
    const normInput = normalizePhoneNumber(rawInputPhone);
    if (!normInput || normInput.length < 8) return null;

    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, [])
      .filter(e => e.courseId === courseId);

    for (const enr of enrollments) {
      const p = participants.find(part => part.id === enr.participantId);
      if (!p || !p.phone) continue;

      const normPPhone = normalizePhoneNumber(p.phone);
      // Compare normalized formats (e.g. 60192345671 vs 60192345671)
      const isExactMatch = normPPhone === normInput;
      const isSuffixMatch = normPPhone.length >= 8 && normInput.length >= 8 && 
        (normPPhone.endsWith(normInput) || normInput.endsWith(normPPhone));

      if (isExactMatch || isSuffixMatch) {
        // Calculate participant-scoped attendance summary for self-view (PART 09)
        const course = this.getCourseById(courseId);
        const attendanceList = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, [])
          .filter(a => a.courseId === courseId && a.participantId === p.id);
        const scheduleDays = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, [])
          .filter(s => s.courseId === courseId)
          .sort((a, b) => a.dayNumber - b.dayNumber);
        const sessions = getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, [])
          .filter(s => s.courseId === courseId)
          .sort((a, b) => a.dayNumber - b.dayNumber || a.sessionNumber - b.sessionNumber);

        const attendanceLevel: AttendanceLevel = course?.attendanceConfig?.attendanceLevel || 'DAILY';
        const minReq = course?.attendanceConfig?.requireMinimumPercentage ?? 80;

        let totalExpected = 0;
        let presentCount = 0;
        const recordsSummary: Array<{ label: string; date?: string; status: AttendanceStatus; markedAt?: string }> = [];

        if (attendanceLevel === 'DAILY') {
          totalExpected = scheduleDays.length || 1;
          scheduleDays.forEach(day => {
            const att = attendanceList.find(a => a.attendanceLevel === 'DAILY' && a.dayNumber === day.dayNumber);
            if (att && (att.status === 'PRESENT' || att.status === 'LATE')) {
              presentCount++;
            }
            recordsSummary.push({
              label: `Hari ${day.dayNumber}${day.theme ? `: ${day.theme}` : ''}`,
              date: day.date,
              status: att ? att.status : ('ABSENT' as AttendanceStatus),
              markedAt: att?.markedAt
            });
          });
        } else if (attendanceLevel === 'SESSION') {
          totalExpected = sessions.length || 1;
          sessions.forEach(sess => {
            const att = attendanceList.find(a => a.attendanceLevel === 'SESSION' && a.sessionId === sess.id);
            if (att && (att.status === 'PRESENT' || att.status === 'LATE')) {
              presentCount++;
            }
            recordsSummary.push({
              label: `Hari ${sess.dayNumber} [Sesi ${sess.sessionNumber}]: ${sess.title}`,
              status: att ? att.status : ('ABSENT' as AttendanceStatus),
              markedAt: att?.markedAt
            });
          });
        } else {
          totalExpected = 1;
          const att = attendanceList.find(a => a.attendanceLevel === 'COURSE');
          if (att && (att.status === 'PRESENT' || att.status === 'LATE')) {
            presentCount = 1;
          }
          recordsSummary.push({
            label: 'Kehadiran Keseluruhan Kursus',
            status: att ? att.status : ('ABSENT' as AttendanceStatus),
            markedAt: att?.markedAt
          });
        }

        const percentage = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;
        let completionStatus = 'DALAM PROSES';
        if (enr.status === 'COMPLETED') {
          completionStatus = 'SELESAI';
        } else if (percentage >= minReq && totalExpected > 0) {
          completionStatus = 'LAYAK TAMAT';
        }

        return {
          participantId: p.id,
          name: p.name,
          institutionOrAgency: p.institutionOrAgency,
          designation: p.designation,
          phone: maskPhoneNumber(p.phone),
          enrollmentStatus: enr.status,
          attendanceConfirmed: enr.attendanceConfirmed,
          roomNumber: enr.roomNumber || undefined,
          roommateName: enr.roommateName || undefined,
          assignedGroup: enr.assignedGroup || undefined,
          specialRequirements: enr.specialRequirements || undefined,
          attendanceSummary: {
            totalContexts: totalExpected,
            presentCount,
            percentage,
            level: attendanceLevel,
            records: recordsSummary
          },
          courseCompletionStatus: completionStatus
        };
      }
    }

    return null;
  }

  /**
   * Browser tab session persistence for verified participant
   * Allows reload without losing authorized verification state
   */
  public getParticipantSession(courseId: string): VerifiedParticipantData | null {
    try {
      const raw = sessionStorage.getItem(`mykursus_session_${courseId}`);
      return raw ? (JSON.parse(raw) as VerifiedParticipantData) : null;
    } catch {
      return null;
    }
  }

  public setParticipantSession(courseId: string, data: VerifiedParticipantData): void {
    try {
      sessionStorage.setItem(`mykursus_session_${courseId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Session storage write error:', e);
    }
  }

  public clearParticipantSession(courseId: string): void {
    try {
      sessionStorage.removeItem(`mykursus_session_${courseId}`);
    } catch (e) {
      console.warn('Session storage clear error:', e);
    }
  }

  // --- Authorization & RBAC Enforcement (DCOREV1 Section 03 & 28) ---
  public checkOrganizerCourseAccess(
    user: UserAuthContext, 
    courseId: string
  ): { allowed: boolean; reason?: string; course?: Course } {
    const course = this.getCourseById(courseId);
    if (!course) {
      return { allowed: false, reason: 'Kursus tidak dijumpai dalam rekod platform.' };
    }

    if (user.role === UserRole.MASTER_ADMIN) {
      return { allowed: true, course };
    }

    if (user.role === UserRole.PARTICIPANT) {
      return { 
        allowed: false, 
        reason: 'Akses Ditolak: Peserta kursus tidak mempunyai kebenaran untuk memasuki Organizer Workspace.',
        course 
      };
    }

    if (user.role === UserRole.ORGANIZER_ADMIN) {
      // Ownership rule: course.organizerId must match user.organizerId or assignedUserIds includes user.id
      const isOwnerOrg = user.organizerId && course.organizerId === user.organizerId;
      const isAssigned = course.assignedUserIds && course.assignedUserIds.includes(user.id);

      if (isOwnerOrg || isAssigned) {
        return { allowed: true, course };
      }

      return {
        allowed: false,
        reason: `Akses Ditolak: Anda (${user.organizerId || user.id}) tiada hak milik atau penugasan untuk mengurus kursus "${course.title}". Hak milik terletak pada penganjur lain.`,
        course
      };
    }

    return { allowed: false, reason: 'Akses Ditolak: Peranan pengguna tidak sah.', course };
  }

  // --- Organizer Course Operations (DCOREV1 Section 05, 06, 08, 17, 18) ---
  public createCourse(
    courseData: Partial<Course>, 
    creator: UserAuthContext
  ): Course {
    if (creator.role === UserRole.PARTICIPANT) {
      throw new Error('Peserta tidak dibenarkan mencipta kursus.');
    }

    // Auto-bind to authenticated organizer
    const organizerId = creator.organizerId || courseData.organizerId || 'org-default';
    const rawTitle = courseData.title?.trim() || 'Kursus Baharu Tanpa Tajuk';
    
    // Generate unique slug
    let baseSlug = courseData.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'kursus-' + Date.now();

    const existingCourses = this.getCourses();
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingCourses.some(c => c.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const defaultModules = [
      { key: CourseModuleKey.OVERVIEW, enabled: true, order: 1 },
      { key: CourseModuleKey.SCHEDULE, enabled: true, order: 2 },
      { key: CourseModuleKey.SESSIONS, enabled: true, order: 3 },
      { key: CourseModuleKey.PARTICIPANTS, enabled: true, order: 4 },
      { key: CourseModuleKey.ANNOUNCEMENTS, enabled: true, order: 5 },
      { key: CourseModuleKey.ACCOMMODATION, enabled: true, order: 6, customLabel: 'Penginapan & Bilik' },
      { key: CourseModuleKey.VENUE_LOGISTICS, enabled: true, order: 7, customLabel: 'Lokasi & Kemudahan' },
      { key: CourseModuleKey.WIFI_ACCESS, enabled: true, order: 8, customLabel: 'Akses Wi-Fi' },
      { key: CourseModuleKey.SECRETARIAT, enabled: true, order: 9, customLabel: 'Urus Setia' },
    ];

    const newCourse: Course = {
      id: 'course-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      slug: finalSlug,
      title: rawTitle,
      subtitle: courseData.subtitle?.trim() || '',
      code: courseData.code?.trim() || '',
      description: courseData.description?.trim() || '',
      objectives: courseData.objectives || [],
      instructions: courseData.instructions?.trim() || '',
      organizerId,
      assignedUserIds: [creator.id],
      status: CourseStatus.UPCOMING,
      isFeaturedActive: false,
      approvalStatus: ApprovalStatus.DRAFT,
      startDate: courseData.startDate || new Date().toISOString().split('T')[0],
      endDate: courseData.endDate || new Date().toISOString().split('T')[0],
      venueName: courseData.venueName?.trim() || 'Lokasi Akan Ditentukan',
      venueAddress: courseData.venueAddress?.trim() || '',
      timezone: courseData.timezone || 'Asia/Kuala_Lumpur',
      modules: courseData.modules && courseData.modules.length > 0 ? courseData.modules : defaultModules,
      hasPendingChanges: false,
      venueDetails: courseData.venueDetails || {
        hallName: '',
        floor: '',
        wifiSsid: '',
        wifiPassword: '',
        parkingInfo: '',
        directions: ''
      },
      accommodationDetails: courseData.accommodationDetails || {
        providerName: '',
        checkInTime: '',
        checkOutTime: '',
        roomTypes: '',
        notes: ''
      },
      contacts: courseData.contacts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveCourse(newCourse);
    this.addAuditLog(
      'COURSE_CREATED', 
      `Draf kursus baharu dicipta: "${newCourse.title}" oleh ${creator.name || creator.id}.`,
      newCourse.id,
      newCourse.title,
      creator.role
    );
    return newCourse;
  }

  public updateCourseOperational(
    courseId: string, 
    updates: Partial<Course>, 
    user?: UserAuthContext
  ): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    // If already SUBMITTED or APPROVED, date and venue cannot be overwritten directly by organizer
    const isGoverned = course.approvalStatus === ApprovalStatus.SUBMITTED || course.approvalStatus === ApprovalStatus.APPROVED;
    const isOrganizerRole = user?.role === UserRole.ORGANIZER_ADMIN;

    if (isGoverned && isOrganizerRole) {
      if (updates.startDate && updates.startDate !== course.startDate) {
        throw new Error('Pindaan tarikh rasmi kursus yang telah diluluskan/dihantar memerlukan kelulusan Master Admin.');
      }
      if (updates.endDate && updates.endDate !== course.endDate) {
        throw new Error('Pindaan tarikh rasmi kursus memerlukan kelulusan Master Admin.');
      }
      if (updates.venueName && updates.venueName !== course.venueName) {
        throw new Error('Pindaan lokasi rasmi kursus memerlukan kelulusan Master Admin.');
      }
    }

    // Apply allowed updates
    Object.assign(course, updates, { updatedAt: new Date().toISOString() });
    this.saveCourse(course);

    if (user) {
      this.addAuditLog(
        'COURSE_OPERATIONAL_UPDATED',
        `Maklumat operasi kursus dikemaskini oleh ${user.name || user.id}.`,
        course.id,
        course.title,
        user.role
      );
    }
    return course;
  }

  public submitCourseForReview(courseId: string, user?: UserAuthContext): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    // Validation per DCOREV1 Section 18
    if (!course.title || course.title.trim().length < 3) {
      throw new Error('Tajuk kursus diperlukan sebelum menghantar untuk semakan.');
    }
    if (!course.startDate || !course.endDate) {
      throw new Error('Tarikh mula dan tamat kursus wajib diisi.');
    }
    if (!course.venueName || course.venueName.trim().length < 2) {
      throw new Error('Lokasi kursus wajib diisi.');
    }

    course.approvalStatus = ApprovalStatus.SUBMITTED;
    course.reviewNotes = 'Dihantar oleh penganjur untuk semakan dan kelulusan Master Admin.';
    course.updatedAt = new Date().toISOString();

    this.saveCourse(course);
    this.addAuditLog(
      'COURSE_SUBMITTED',
      `Kursus dihantar untuk semakan tadbir urus Master Admin.`,
      course.id,
      course.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );
    return course;
  }

  public proposeHighRiskChange(
    courseId: string, 
    targetField: 'DATES' | 'VENUE', 
    proposedValue: string, 
    reason: string, 
    user: UserAuthContext
  ): ApprovalChangeRequest {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    const access = this.checkOrganizerCourseAccess(user, courseId);
    if (!access.allowed) throw new Error(access.reason);

    const currentValue = targetField === 'DATES' 
      ? `${course.startDate} to ${course.endDate}` 
      : course.venueName;

    const cr: ApprovalChangeRequest = {
      id: 'cr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId: course.id,
      courseTitle: course.title,
      requestedByUserId: user.id,
      requestedByOrganizerName: user.name || user.organizerId || 'Penganjur',
      changeCategory: 'HIGH_RISK',
      targetField,
      currentValue,
      proposedValue,
      reason,
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };

    this.saveChangeRequest(cr);
    course.hasPendingChanges = true;
    this.saveCourse(course);

    this.addAuditLog(
      'CHANGE_REQUEST_SUBMITTED',
      `Cadangan pindaan rasmi [${targetField}] dikemukakan: "${proposedValue}". Sebab: ${reason}`,
      course.id,
      course.title,
      user.role
    );
    return cr;
  }

  // --- Schedule Days Management (DCOREV1 Section 09) ---
  public saveScheduleDay(day: ScheduleDay, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, day.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const days = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, []);
    const index = days.findIndex(d => d.id === day.id);
    if (index >= 0) {
      days[index] = day;
    } else {
      days.push(day);
    }
    saveToStorage(STORAGE_KEYS.SCHEDULE_DAYS, days);
    syncScheduleDayToFirestore(day).catch(err => console.warn('Firestore sync day error:', err));
  }

  public deleteScheduleDay(id: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const days = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, []);
    saveToStorage(STORAGE_KEYS.SCHEDULE_DAYS, days.filter(d => d.id !== id));
    deleteScheduleDayFromFirestore(courseId, id).catch(err => console.warn('Firestore delete day error:', err));
  }

  // --- Session Management (DCOREV1 Section 10 & 16) ---
  public saveSession(session: SessionItem, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, session.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const sessions = getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, []);
    const index = sessions.findIndex(s => s.id === session.id);
    const updatedSession: SessionItem = {
      ...session,
      updatedAt: new Date().toISOString()
    };

    const isNew = index < 0;
    if (index >= 0) {
      sessions[index] = updatedSession;
    } else {
      sessions.push(updatedSession);
    }
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
    syncSessionToFirestore(updatedSession).catch(err => console.warn('Firestore sync session error:', err));

    this.addAuditLog(
      isNew ? 'SESSION_CREATED' : 'SESSION_UPDATED',
      `Sesi "${updatedSession.title}" (Hari ${updatedSession.dayNumber}, Sesi ${updatedSession.sessionNumber}) ${isNew ? 'dicipta' : 'dikemaskini'}. Masa: ${updatedSession.startTime}-${updatedSession.endTime}, Lokasi: ${updatedSession.location || 'Dewan Utama'}`,
      updatedSession.courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );
  }

  public deleteSession(id: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const sessions = getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, []);
    const target = sessions.find(s => s.id === id);
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions.filter(s => s.id !== id));
    deleteSessionFromFirestore(courseId, id).catch(err => console.warn('Firestore delete session error:', err));

    if (target) {
      this.addAuditLog(
        'SESSION_DELETED',
        `Sesi "${target.title}" (Hari ${target.dayNumber}, Sesi ${target.sessionNumber}) dipadam.`,
        courseId,
        undefined,
        user?.role || UserRole.ORGANIZER_ADMIN
      );
    }
  }

  public bulkImportSessions(
    courseId: string,
    sessionsToImport: SessionItem[],
    newDaysToCreate?: ScheduleDay[],
    replaceDays?: number[],
    user?: UserAuthContext
  ): { importedCount: number; daysCreatedCount: number } {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    let daysCreatedCount = 0;
    if (newDaysToCreate && newDaysToCreate.length > 0) {
      const existingDays = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, []);
      newDaysToCreate.forEach(day => {
        if (!existingDays.some(d => d.courseId === courseId && d.dayNumber === day.dayNumber)) {
          existingDays.push(day);
          daysCreatedCount++;
        }
      });
      saveToStorage(STORAGE_KEYS.SCHEDULE_DAYS, existingDays);
    }

    let sessions = getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, []);

    if (replaceDays && replaceDays.length > 0) {
      const replaceSet = new Set(replaceDays);
      sessions = sessions.filter(s => !(s.courseId === courseId && replaceSet.has(s.dayNumber)));
    }

    sessionsToImport.forEach(newSess => {
      sessions.push({
        ...newSess,
        courseId,
        updatedAt: new Date().toISOString()
      });
    });

    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);

    this.addAuditLog(
      'IMPORT_CSV_SLOT',
      `Import CSV Slot Jadual selesai: ${sessionsToImport.length} slot dimasukkan (${daysCreatedCount} hari baharu dicipta).`,
      courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { importedCount: sessionsToImport.length, daysCreatedCount };
  }

  // --- Participant & Private Allocation Management (DCOREV1 Section 11 & 12) ---
  public saveParticipant(
    courseId: string, 
    participantData: Partial<Participant>, 
    enrollmentData: Partial<CourseEnrollment>, 
    user?: UserAuthContext
  ): { participant: Participant; enrollment: CourseEnrollment } {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);

    // Clean inputs (Smart Data Entry per Section 23 & SES 4.4)
    const cleanName = participantData.name?.trim() || 'Peserta Tanpa Nama';
    const cleanEmail = participantData.email?.trim().toLowerCase() || '';
    const cleanPhone = participantData.phone ? String(participantData.phone).trim() : '';
    const normPhone = normalizePhoneNumber(cleanPhone);
    const cleanInst = participantData.institutionOrAgency?.trim() || 'Kolej / Agensi';
    const cleanSalary = participantData.salaryNumber?.trim() || enrollmentData.salaryNumber?.trim() || '';

    // Find or create participant safely using ID or normalized phone or salary
    let pId = participantData.id;
    let existingP = pId ? participants.find(p => p.id === pId) : undefined;
    if (!existingP && normPhone) {
      existingP = participants.find(p => normalizePhoneNumber(p.phone) === normPhone);
      if (existingP) pId = existingP.id;
    }
    if (!existingP && cleanSalary) {
      existingP = participants.find(p => p.salaryNumber && p.salaryNumber.trim() === cleanSalary);
      if (existingP) pId = existingP.id;
    }

    let finalParticipant: Participant;
    if (existingP) {
      existingP.name = cleanName;
      existingP.email = cleanEmail || existingP.email;
      existingP.phone = cleanPhone || existingP.phone;
      existingP.institutionOrAgency = cleanInst;
      if (cleanSalary) existingP.salaryNumber = cleanSalary;
      if (participantData.designation) existingP.designation = participantData.designation.trim();
      finalParticipant = existingP;
    } else {
      finalParticipant = {
        id: pId || 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        institutionOrAgency: cleanInst,
        designation: participantData.designation?.trim(),
        salaryNumber: cleanSalary,
        gender: participantData.gender,
        createdAt: new Date().toISOString()
      };
      participants.push(finalParticipant);
    }
    saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);

    // Save enrollment
    let existingEnr = enrollments.find(e => e.courseId === courseId && e.participantId === finalParticipant.id);
    if (!existingEnr && enrollmentData.id) {
      existingEnr = enrollments.find(e => e.id === enrollmentData.id);
    }

    let finalEnrollment: CourseEnrollment;
    if (existingEnr) {
      existingEnr.status = enrollmentData.status || existingEnr.status;
      existingEnr.roomNumber = enrollmentData.roomNumber !== undefined ? enrollmentData.roomNumber.trim() : existingEnr.roomNumber;
      existingEnr.roommateName = enrollmentData.roommateName !== undefined ? enrollmentData.roommateName.trim() : existingEnr.roommateName;
      existingEnr.assignedGroup = enrollmentData.assignedGroup !== undefined ? enrollmentData.assignedGroup.trim() : existingEnr.assignedGroup;
      existingEnr.specialRequirements = enrollmentData.specialRequirements !== undefined ? enrollmentData.specialRequirements.trim() : existingEnr.specialRequirements;
      existingEnr.secretariatNotes = enrollmentData.secretariatNotes !== undefined ? enrollmentData.secretariatNotes.trim() : existingEnr.secretariatNotes;
      existingEnr.salaryNumber = cleanSalary || existingEnr.salaryNumber;
      existingEnr.updatedAt = new Date().toISOString();
      finalEnrollment = existingEnr;
    } else {
      finalEnrollment = {
        id: enrollmentData.id || 'enr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        courseId,
        participantId: finalParticipant.id,
        status: enrollmentData.status || 'CONFIRMED',
        attendanceConfirmed: enrollmentData.attendanceConfirmed ?? true,
        roomNumber: enrollmentData.roomNumber?.trim() || '',
        roommateName: enrollmentData.roommateName?.trim() || '',
        assignedGroup: enrollmentData.assignedGroup?.trim() || '',
        specialRequirements: enrollmentData.specialRequirements?.trim() || '',
        secretariatNotes: enrollmentData.secretariatNotes?.trim() || '',
        salaryNumber: cleanSalary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      enrollments.push(finalEnrollment);
    }
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);

    syncParticipantToFirestore(finalParticipant).catch(err => console.warn('Firestore sync participant error:', err));
    syncEnrollmentToFirestore(finalEnrollment).catch(err => console.warn('Firestore sync enrollment error:', err));

    return { participant: finalParticipant, enrollment: finalEnrollment };
  }

  public deleteParticipantFromCourse(
    courseId: string, 
    participantId: string, 
    user?: UserAuthContext
  ): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const targetEnr = enrollments.find(e => e.courseId === courseId && e.participantId === participantId);
    const filteredEnrs = enrollments.filter(e => !(e.courseId === courseId && e.participantId === participantId));
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, filteredEnrs);

    if (targetEnr) {
      deleteEnrollmentFromFirestore(courseId, targetEnr.id).catch(err => console.warn('Firestore delete enrollment error:', err));
    }

    // If this participant has no other courses, clean from participants list
    const otherCourses = filteredEnrs.filter(e => e.participantId === participantId);
    if (otherCourses.length === 0) {
      const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
      saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants.filter(p => p.id !== participantId));
    }
  }

  /**
   * SES 4.4 Bulk Import Participants with strict validation, deduplication and auditing
   */
  public bulkImportParticipants(
    courseId: string,
    rows: Array<{
      participant: Partial<Participant>;
      enrollment: Partial<CourseEnrollment>;
    }>,
    user?: UserAuthContext
  ): { importedCount: number; updatedCount: number } {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of rows) {
      const { participant: pData, enrollment: eData } = item;
      const cleanName = pData.name?.trim() || 'Peserta';
      const cleanPhone = pData.phone ? String(pData.phone).trim() : '';
      const normPhone = normalizePhoneNumber(cleanPhone);
      const cleanSalary = (pData.salaryNumber || eData.salaryNumber || '').trim();
      const cleanEmail = pData.email?.trim().toLowerCase() || '';
      const cleanInst = pData.institutionOrAgency?.trim() || 'Kolej / Agensi';

      // Match existing participant by normalized phone or salary number
      let existingP = participants.find(p => {
        const pNorm = normalizePhoneNumber(p.phone);
        const phoneMatch = Boolean(normPhone && pNorm && normPhone === pNorm);
        const salaryMatch = Boolean(cleanSalary && p.salaryNumber && p.salaryNumber.trim() === cleanSalary);
        return phoneMatch || salaryMatch;
      });

      let targetParticipant: Participant;
      if (existingP) {
        existingP.name = cleanName;
        if (cleanPhone) existingP.phone = cleanPhone;
        if (cleanEmail) existingP.email = cleanEmail;
        if (cleanInst) existingP.institutionOrAgency = cleanInst;
        if (cleanSalary) existingP.salaryNumber = cleanSalary;
        if (pData.designation) existingP.designation = pData.designation.trim();
        if (pData.gender) existingP.gender = pData.gender;
        targetParticipant = existingP;
      } else {
        targetParticipant = {
          id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          institutionOrAgency: cleanInst,
          designation: pData.designation?.trim(),
          salaryNumber: cleanSalary,
          gender: pData.gender,
          createdAt: new Date().toISOString()
        };
        participants.push(targetParticipant);
      }

      // Check course enrollment
      let existingEnr = enrollments.find(e => e.courseId === courseId && e.participantId === targetParticipant.id);
      if (existingEnr) {
        existingEnr.status = eData.status || existingEnr.status;
        if (eData.roomNumber !== undefined) existingEnr.roomNumber = eData.roomNumber.trim();
        if (eData.roommateName !== undefined) existingEnr.roommateName = eData.roommateName.trim();
        if (eData.assignedGroup !== undefined) existingEnr.assignedGroup = eData.assignedGroup.trim();
        if (eData.specialRequirements !== undefined) existingEnr.specialRequirements = eData.specialRequirements.trim();
        if (eData.secretariatNotes !== undefined) existingEnr.secretariatNotes = eData.secretariatNotes.trim();
        if (cleanSalary) existingEnr.salaryNumber = cleanSalary;
        existingEnr.updatedAt = new Date().toISOString();
        updatedCount++;
      } else {
        enrollments.push({
          id: 'enr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          courseId,
          participantId: targetParticipant.id,
          status: eData.status || 'CONFIRMED',
          attendanceConfirmed: eData.attendanceConfirmed ?? true,
          roomNumber: eData.roomNumber?.trim() || '',
          roommateName: eData.roommateName?.trim() || '',
          assignedGroup: eData.assignedGroup?.trim() || '',
          specialRequirements: eData.specialRequirements?.trim() || '',
          secretariatNotes: eData.secretariatNotes?.trim() || '',
          salaryNumber: cleanSalary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        importedCount++;
      }
    }

    saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);

    const course = this.getCourseById(courseId);
    this.addAuditLog(
      'IMPORT_CSV_PESERTA',
      `Import CSV selesai: ${importedCount} peserta baru ditambah, ${updatedCount} rekod dikemaskini.`,
      courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { importedCount, updatedCount };
  }

  /**
   * SES 4.4 Offline Backup Restoration
   * CRITICAL: Must ONLY be called on explicit user action. Never auto-restored.
   */
  public restoreCourseBackup(
    courseId: string,
    payload: any,
    user?: UserAuthContext
  ): { restoredParticipants: number; restoredEnrollments: number } {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    if (!payload || !Array.isArray(payload.participants) || !Array.isArray(payload.enrollments)) {
      throw new Error('Format fail sandaran tidak sah.');
    }

    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);

    let pCount = 0;
    for (const p of payload.participants) {
      const existingIdx = participants.findIndex(
        item => item.id === p.id || (p.phone && normalizePhoneNumber(item.phone) === normalizePhoneNumber(p.phone))
      );
      if (existingIdx >= 0) {
        participants[existingIdx] = { ...participants[existingIdx], ...p };
      } else {
        participants.push(p);
      }
      pCount++;
    }

    // Replace enrollments for this specific course with restored snapshot
    const otherEnrollments = enrollments.filter(e => e.courseId !== courseId);
    const restoredEnrollments = payload.enrollments.map((e: any) => ({
      ...e,
      courseId // enforce binding to current course
    }));

    saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, [...otherEnrollments, ...restoredEnrollments]);

    const course = this.getCourseById(courseId);
    this.addAuditLog(
      'BACKUP_DATA_RESTORED',
      `Pemulihan sandaran data berjaya: ${restoredEnrollments.length} pendaftaran peserta dipulihkan.`,
      courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { restoredParticipants: pCount, restoredEnrollments: restoredEnrollments.length };
  }

  public updateEnrollmentPrivateAllocations(
    courseId: string, 
    enrollmentId: string, 
    allocations: Partial<CourseEnrollment>, 
    user?: UserAuthContext
  ): CourseEnrollment {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const target = enrollments.find(e => e.id === enrollmentId && e.courseId === courseId);
    if (!target) throw new Error('Pendaftaran peserta tidak dijumpai.');

    Object.assign(target, allocations, { updatedAt: new Date().toISOString() });
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return target;
  }

  public getParticipantById(participantId: string): Participant | undefined {
    const participants = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    return participants.find(p => p.id === participantId);
  }

  // --- PART 09: Attendance, Participant Status & Course Tracking ---
  public getAttendanceRecordsByCourseId(courseId: string, user?: UserAuthContext): AttendanceRecord[] {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }
    const all = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
    return all.filter(a => a.courseId === courseId);
  }

  public saveAttendanceRecord(record: AttendanceRecord, user?: UserAuthContext): AttendanceRecord {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, record.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const all = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
    
    // Deterministic context key to guarantee idempotency & uniqueness (PART 09 Section 17)
    const contextKey = record.attendanceLevel === 'COURSE'
      ? 'course'
      : record.attendanceLevel === 'DAILY'
        ? `day_${record.dayNumber || 1}`
        : `session_${record.sessionId || ''}`;

    const existingIdx = all.findIndex(a => 
      a.id === record.id ||
      (a.courseId === record.courseId &&
       a.participantId === record.participantId &&
       a.attendanceLevel === record.attendanceLevel &&
       (record.attendanceLevel === 'COURSE' ||
        (record.attendanceLevel === 'DAILY' && a.dayNumber === record.dayNumber) ||
        (record.attendanceLevel === 'SESSION' && a.sessionId === record.sessionId)))
    );

    const now = new Date().toISOString();
    let saved: AttendanceRecord;

    if (existingIdx >= 0) {
      const existing = all[existingIdx];
      saved = {
        ...existing,
        ...record,
        previousStatus: existing.status,
        updatedAt: now,
      };
      all[existingIdx] = saved;
    } else {
      saved = {
        ...record,
        id: record.id || `att-${record.courseId}-${record.participantId}-${contextKey}`,
        markedAt: record.markedAt || now,
        updatedAt: now,
      };
      all.push(saved);
    }

    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, all);

    // Synchronize CourseEnrollment.attendanceConfirmed if marked PRESENT
    if (record.status === 'PRESENT') {
      const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
      const enr = enrollments.find(e => e.courseId === record.courseId && e.participantId === record.participantId);
      if (enr && !enr.attendanceConfirmed) {
        enr.attendanceConfirmed = true;
        enr.updatedAt = now;
        saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);
      }
    }

    // Lightweight Audit Record (Section 16)
    const course = this.getCourseById(record.courseId);
    const participant = this.getParticipantById(record.participantId);
    const contextLabel = record.attendanceLevel === 'DAILY' 
      ? `Hari ${record.dayNumber || 1}` 
      : record.attendanceLevel === 'SESSION' 
        ? `Sesi ${record.sessionNumber || 1}` 
        : 'Keseluruhan Kursus';

    this.addAuditLog(
      'ATTENDANCE_RECORDED',
      `Kehadiran ${participant?.name || record.participantId} ditandakan sebagai "${record.status}" (${contextLabel}).`,
      record.courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return saved;
  }

  public bulkSaveAttendanceRecords(
    courseId: string, 
    records: AttendanceRecord[], 
    user?: UserAuthContext
  ): { count: number } {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const all = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const now = new Date().toISOString();

    records.forEach(rec => {
      const contextKey = rec.attendanceLevel === 'COURSE'
        ? 'course'
        : rec.attendanceLevel === 'DAILY'
          ? `day_${rec.dayNumber || 1}`
          : `session_${rec.sessionId || ''}`;

      const existingIdx = all.findIndex(a => 
        a.id === rec.id ||
        (a.courseId === rec.courseId &&
         a.participantId === rec.participantId &&
         a.attendanceLevel === rec.attendanceLevel &&
         (rec.attendanceLevel === 'COURSE' ||
          (rec.attendanceLevel === 'DAILY' && a.dayNumber === rec.dayNumber) ||
          (rec.attendanceLevel === 'SESSION' && a.sessionId === rec.sessionId)))
      );

      if (existingIdx >= 0) {
        all[existingIdx] = {
          ...all[existingIdx],
          ...rec,
          previousStatus: all[existingIdx].status,
          updatedAt: now,
        };
      } else {
        all.push({
          ...rec,
          id: rec.id || `att-${rec.courseId}-${rec.participantId}-${contextKey}`,
          markedAt: rec.markedAt || now,
          updatedAt: now,
        });
      }

      if (rec.status === 'PRESENT') {
        const enr = enrollments.find(e => e.courseId === rec.courseId && e.participantId === rec.participantId);
        if (enr && !enr.attendanceConfirmed) {
          enr.attendanceConfirmed = true;
          enr.updatedAt = now;
        }
      }
    });

    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, all);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);

    const course = this.getCourseById(courseId);
    this.addAuditLog(
      'ATTENDANCE_BULK_RECORDED',
      `Penandaan kehadiran pukal bagi ${records.length} peserta telah disimpan secara rasmi.`,
      courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { count: records.length };
  }

  public deleteAttendanceRecord(recordId: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }
    const all = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
    const filtered = all.filter(a => a.id !== recordId);
    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, filtered);

    const course = this.getCourseById(courseId);
    this.addAuditLog(
      'ATTENDANCE_RESET',
      `Rekod kehadiran (${recordId}) telah dipadam / diset semula.`,
      courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );
  }

  public updateParticipantLifecycleStatus(
    courseId: string, 
    enrollmentId: string, 
    newStatus: ParticipantLifecycleStatus, 
    user?: UserAuthContext
  ): CourseEnrollment {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const enrollments = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const target = enrollments.find(e => e.id === enrollmentId && e.courseId === courseId);
    if (!target) throw new Error('Pendaftaran peserta tidak dijumpai.');

    const oldStatus = target.status;
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);

    const participant = this.getParticipantById(target.participantId);
    const course = this.getCourseById(courseId);
    this.addAuditLog(
      'PARTICIPANT_STATUS_UPDATED',
      `Status kitaran hidup peserta ${participant?.name || target.participantId} dikemaskini dari "${oldStatus}" ke "${newStatus}".`,
      courseId,
      course?.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return target;
  }

  public updateCourseAttendanceConfig(
    courseId: string, 
    config: CourseAttendanceConfig, 
    user?: UserAuthContext
  ): Course {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    course.attendanceConfig = config;
    course.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.COURSES, courses);

    this.addAuditLog(
      'ATTENDANCE_CONFIG_UPDATED',
      `Konfigurasi modul kehadiran kursus (${config.attendanceLevel}, minima: ${config.requireMinimumPercentage}%) dikemaskini.`,
      courseId,
      course.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return course;
  }

  // --- Announcements & Notification Center Management (PART 08 & DCOREV1 Section 16) ---
  public getAnnouncementsByCourseId(courseId: string, includeDrafts: boolean = false): Announcement[] {
    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    return list
      .filter(a => a.courseId === courseId && (includeDrafts || a.status !== 'DRAFT'))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  public saveAnnouncement(announcement: Announcement, user?: UserAuthContext): Announcement {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, announcement.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    // Smart Validation per Section 22
    const cleanTitle = (announcement.title || '').trim();
    if (cleanTitle.length < 3) {
      throw new Error('Tajuk pengumuman mestilah sekurang-kurangnya 3 aksara.');
    }
    const cleanContent = (announcement.content || '').trim();
    if (cleanContent.length < 5) {
      throw new Error('Kandungan pengumuman mestilah sekurang-kurangnya 5 aksara.');
    }

    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const index = list.findIndex(a => a.id === announcement.id);

    const updated: Announcement = {
      ...announcement,
      title: cleanTitle,
      content: cleanContent,
      publishedAt: announcement.publishedAt || new Date().toISOString(),
      status: announcement.status || 'PUBLISHED',
      isPublic: announcement.isPublic !== undefined ? announcement.isPublic : true,
      priority: announcement.priority || 'NORMAL',
      targetScope: announcement.targetScope || 'ALL',
      updatedAt: index >= 0 ? new Date().toISOString() : undefined,
    };

    const isNew = index < 0;
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    syncAnnouncementToFirestore(updated).catch(err => console.warn('Firestore sync announcement error:', err));

    this.addAuditLog(
      isNew ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_UPDATED',
      `Pengumuman langsung ${isNew ? 'diterbitkan' : 'dikemaskini'}: "${updated.title}" (${updated.priority}).`,
      updated.courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return updated;
  }

  public deleteAnnouncement(id: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const target = list.find(a => a.id === id);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list.filter(a => a.id !== id));
    deleteAnnouncementFromFirestore(courseId, id).catch(err => console.warn('Firestore delete announcement error:', err));

    if (target) {
      this.addAuditLog(
        'ANNOUNCEMENT_DELETED',
        `Pengumuman "${target.title}" telah dipadam secara kekal.`,
        courseId,
        undefined,
        user?.role || UserRole.ORGANIZER_ADMIN
      );
    }
  }

  // --- Participant Read / Unread Status (Course-Scoped Client Storage) ---
  public getReadAnnouncementIds(courseId: string): string[] {
    try {
      const raw = localStorage.getItem(`mykursus_read_ann_${courseId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public markAnnouncementAsRead(courseId: string, announcementId: string): void {
    try {
      const current = this.getReadAnnouncementIds(courseId);
      if (!current.includes(announcementId)) {
        current.push(announcementId);
        localStorage.setItem(`mykursus_read_ann_${courseId}`, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Error saving read notification status:', e);
    }
  }

  public markAllAnnouncementsAsRead(courseId: string, announcementIds?: string[]): void {
    try {
      const idsToMark = announcementIds || this.getAnnouncementsByCourseId(courseId).map(a => a.id);
      localStorage.setItem(`mykursus_read_ann_${courseId}`, JSON.stringify(idsToMark));
    } catch (e) {
      console.warn('Error marking all notifications as read:', e);
    }
  }

  // --- Resources & Presentation Materials Management (PART 06) ---
  public getResourcesByCourseId(courseId: string): ResourceMaterial[] {
    const list = getFromStorage<ResourceMaterial[]>(STORAGE_KEYS.RESOURCES, []);
    return list
      .filter(r => r.courseId === courseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveResource(resource: ResourceMaterial, user?: UserAuthContext): ResourceMaterial {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, resource.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<ResourceMaterial[]>(STORAGE_KEYS.RESOURCES, []);
    const index = list.findIndex(r => r.id === resource.id);
    const updated: ResourceMaterial = {
      ...resource,
      createdAt: resource.createdAt || new Date().toISOString()
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    saveToStorage(STORAGE_KEYS.RESOURCES, list);
    syncResourceToFirestore(updated).catch(err => console.warn('Firestore sync resource error:', err));

    this.addAuditLog(
      'RESOURCE_PUBLISHED',
      `Bahan rujukan/slaid diterbitkan: "${updated.title}" (${updated.category}).`,
      updated.courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return updated;
  }

  public deleteResource(id: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<ResourceMaterial[]>(STORAGE_KEYS.RESOURCES, []);
    const target = list.find(r => r.id === id);
    saveToStorage(STORAGE_KEYS.RESOURCES, list.filter(r => r.id !== id));
    deleteResourceFromFirestore(courseId, id).catch(err => console.warn('Firestore delete resource error:', err));

    if (target) {
      this.addAuditLog(
        'RESOURCE_DELETED',
        `Bahan rujukan dipadam: "${target.title}".`,
        courseId,
        undefined,
        user?.role || UserRole.ORGANIZER_ADMIN
      );
    }
  }

  // --- Audit Log Retrieval for Course Workspace ---
  public getAuditLogsByCourseId(courseId: string): AuditLog[] {
    const logs = getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return logs
      .filter(l => l.courseId === courseId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Source Documents & Smart Extraction Management (PART 07) ---
  public getSourceDocumentsByCourseId(courseId: string, user?: UserAuthContext): SourceDocument[] {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<SourceDocument[]>(STORAGE_KEYS.SOURCE_DOCUMENTS, []);
    return list
      .filter(d => d.courseId === courseId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getSourceDocumentById(id: string, user?: UserAuthContext): SourceDocument | undefined {
    const list = getFromStorage<SourceDocument[]>(STORAGE_KEYS.SOURCE_DOCUMENTS, []);
    const doc = list.find(d => d.id === id);
    if (!doc) return undefined;

    if (user) {
      const access = this.checkOrganizerCourseAccess(user, doc.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }
    return doc;
  }

  public saveSourceDocument(doc: SourceDocument, user?: UserAuthContext): SourceDocument {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, doc.courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<SourceDocument[]>(STORAGE_KEYS.SOURCE_DOCUMENTS, []);
    const index = list.findIndex(d => d.id === doc.id);
    const updated: SourceDocument = {
      ...doc,
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      version: (doc.version || 0) + (index >= 0 ? 1 : 1)
    };

    const isNew = index < 0;
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    saveToStorage(STORAGE_KEYS.SOURCE_DOCUMENTS, list);

    this.addAuditLog(
      isNew ? 'SOURCE_DOCUMENT_UPLOADED' : 'SOURCE_DOCUMENT_UPDATED',
      `Dokumen sumber "${updated.fileName}" (${updated.category}) ${isNew ? 'dimuat naik' : 'dikemaskini'}. Status: ${updated.extractionStatus}.`,
      updated.courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return updated;
  }

  public deleteSourceDocument(id: string, courseId: string, user?: UserAuthContext): void {
    if (user) {
      const access = this.checkOrganizerCourseAccess(user, courseId);
      if (!access.allowed) throw new Error(access.reason);
    }

    const list = getFromStorage<SourceDocument[]>(STORAGE_KEYS.SOURCE_DOCUMENTS, []);
    const target = list.find(d => d.id === id);
    saveToStorage(STORAGE_KEYS.SOURCE_DOCUMENTS, list.filter(d => d.id !== id));

    if (target) {
      this.addAuditLog(
        'SOURCE_DOCUMENT_DELETED',
        `Dokumen sumber "${target.fileName}" telah dipadam secara kekal dari arkib penganjur.`,
        courseId,
        undefined,
        user?.role || UserRole.ORGANIZER_ADMIN
      );
    }
  }

  public extractDocumentData(docId: string, courseId: string, user?: UserAuthContext): SourceDocument {
    const doc = this.getSourceDocumentById(docId, user);
    if (!doc) throw new Error('Dokumen sumber tidak dijumpai.');

    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    const enrollments = this.getEnrollmentsByCourseId(courseId);
    const sessions = this.getSessionsByCourseId(courseId);

    // Run Smart Extraction
    const payload = ExtractionEngine.extractFromDocument(doc, course, enrollments, sessions);

    doc.extractedPayload = payload;
    doc.lastExtractedAt = new Date().toISOString();
    doc.extractionStatus = payload.summary.conflictCount > 0 ? 'NEEDS_REVIEW' : 'EXTRACTED';

    this.saveSourceDocument(doc, user);

    this.addAuditLog(
      'SOURCE_DOCUMENT_EXTRACTED',
      `Ekstraksi pintar selesai bagi "${doc.fileName}". Dikesan: ${payload.summary.totalFieldsExtracted} medan, ${payload.summary.totalSessionsExtracted} sesi, ${payload.summary.totalParticipantsExtracted} peserta.`,
      courseId,
      course.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return doc;
  }

  public applyExtractedFieldToCourse(
    courseId: string, 
    docId: string, 
    fieldKey: string, 
    user?: UserAuthContext
  ): { course: Course; changeRequest?: ApprovalChangeRequest } {
    const doc = this.getSourceDocumentById(docId, user);
    if (!doc || !doc.extractedPayload) throw new Error('Data ekstraksi dokumen tidak dijumpai.');

    const targetField = doc.extractedPayload.fields.find(f => f.fieldKey === fieldKey);
    if (!targetField) throw new Error(`Medan "${fieldKey}" tidak dijumpai dalam ekstraksi.`);

    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Kursus tidak dijumpai.');

    let changeRequest: ApprovalChangeRequest | undefined;

    // Check high-risk fields on governed courses
    const isGoverned = course.approvalStatus === ApprovalStatus.APPROVED || course.approvalStatus === ApprovalStatus.SUBMITTED;
    if (isGoverned && targetField.isHighRiskGovernance) {
      // Must route through official Approval Change Request!
      let targetCrField: 'DATES' | 'VENUE' = 'VENUE';
      let propVal = String(targetField.extractedValue);

      if (fieldKey === 'dates') {
        targetCrField = 'DATES';
      } else if (fieldKey === 'venueName') {
        targetCrField = 'VENUE';
      }

      changeRequest = this.proposeHighRiskChange(
        courseId,
        targetCrField,
        propVal,
        `Pindaan dicadangkan daripada Dokumen Sumber: ${doc.fileName} (${targetField.sourceSnippet || 'Dipetik dari dokumen'})`,
        user || { id: 'org-user', role: UserRole.ORGANIZER_ADMIN }
      );

      targetField.status = 'ACCEPTED';
      this.saveSourceDocument(doc, user);

      return { course: this.getCourseById(courseId)!, changeRequest };
    }

    // Direct application for non-governed / operational fields
    if (fieldKey === 'title') {
      course.title = String(targetField.extractedValue);
    } else if (fieldKey === 'code') {
      course.code = String(targetField.extractedValue);
    } else if (fieldKey === 'venueName') {
      course.venueName = String(targetField.extractedValue);
    } else if (fieldKey === 'hallName') {
      course.venueDetails = course.venueDetails || {};
      course.venueDetails.hallName = String(targetField.extractedValue);
    } else if (fieldKey === 'wifiSsid') {
      course.venueDetails = course.venueDetails || {};
      course.venueDetails.wifiSsid = String(targetField.extractedValue);
    } else if (fieldKey === 'wifiPassword') {
      course.venueDetails = course.venueDetails || {};
      course.venueDetails.wifiPassword = String(targetField.extractedValue);
    } else if (fieldKey === 'instructions') {
      course.instructions = String(targetField.extractedValue);
    } else if (fieldKey === 'dates') {
      const parts = String(targetField.extractedValue).split(' to ');
      if (parts.length === 2) {
        course.startDate = parts[0];
        course.endDate = parts[1];
      }
    }

    course.updatedAt = new Date().toISOString();
    this.saveCourse(course);

    targetField.status = 'ACCEPTED';
    this.saveSourceDocument(doc, user);

    this.addAuditLog(
      'SOURCE_FIELD_APPLIED',
      `Medan "${targetField.fieldLabel}" (${fieldKey}) dikemaskini daripada dokumen sumber "${doc.fileName}". Nilai baharu: "${targetField.extractedValue}".`,
      courseId,
      course.title,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { course };
  }

  public rejectExtractedField(
    courseId: string, 
    docId: string, 
    fieldKey: string, 
    user?: UserAuthContext
  ): void {
    const doc = this.getSourceDocumentById(docId, user);
    if (!doc || !doc.extractedPayload) throw new Error('Data ekstraksi tidak dijumpai.');

    const targetField = doc.extractedPayload.fields.find(f => f.fieldKey === fieldKey);
    if (!targetField) throw new Error(`Medan "${fieldKey}" tidak dijumpai.`);

    targetField.status = 'REJECTED';
    this.saveSourceDocument(doc, user);

    this.addAuditLog(
      'SOURCE_FIELD_REJECTED',
      `Cadangan nilai medan "${targetField.fieldLabel}" ditolak oleh penganjur. Nilai sedia ada dikekalkan.`,
      courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );
  }

  public importExtractedParticipants(
    courseId: string, 
    docId: string, 
    selectedRowIds: string[], 
    user?: UserAuthContext
  ): { importedCount: number; updatedCount: number } {
    const doc = this.getSourceDocumentById(docId, user);
    if (!doc || !doc.extractedPayload) throw new Error('Data ekstraksi peserta tidak dijumpai.');

    let importedCount = 0;
    let updatedCount = 0;

    const rowsToImport = doc.extractedPayload.participants.filter(p => selectedRowIds.includes(p.id));

    rowsToImport.forEach(row => {
      const isExisting = Boolean(row.isDuplicate && row.existingParticipantId);
      this.saveParticipant(
        courseId,
        {
          id: row.existingParticipantId,
          name: row.name,
          phone: row.phone,
          email: row.email,
          institutionOrAgency: row.institutionOrAgency,
          designation: row.designation,
          salaryNumber: row.salaryNumber,
          gender: row.gender,
        },
        {
          roomNumber: row.roomNumber,
          roommateName: row.roommateName,
          assignedGroup: row.assignedGroup,
          specialRequirements: row.specialRequirements,
        },
        user
      );

      row.status = 'IMPORTED';
      if (isExisting) updatedCount++;
      else importedCount++;
    });

    this.saveSourceDocument(doc, user);

    this.addAuditLog(
      'PARTICIPANTS_IMPORTED_FROM_SOURCE',
      `Import peserta selesai daripada "${doc.fileName}": ${importedCount} peserta baharu ditambah, ${updatedCount} rekod peserta dikemaskini.`,
      courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { importedCount, updatedCount };
  }

  public importExtractedSessions(
    courseId: string, 
    docId: string, 
    selectedSessionIds: string[], 
    user?: UserAuthContext
  ): { importedCount: number } {
    const doc = this.getSourceDocumentById(docId, user);
    if (!doc || !doc.extractedPayload) throw new Error('Data ekstraksi jadual tidak dijumpai.');

    let importedCount = 0;
    const sessionsToImport = doc.extractedPayload.sessions.filter(s => selectedSessionIds.includes(s.id));

    // Ensure schedule days exist
    const existingDays = this.getScheduleDaysByCourseId(courseId);
    const dayNumbers = Array.from(new Set(sessionsToImport.map(s => s.dayNumber)));

    dayNumbers.forEach(dayNum => {
      if (!existingDays.some(d => d.dayNumber === dayNum)) {
        this.saveScheduleDay({
          id: `day-${courseId}-${dayNum}`,
          courseId,
          dayNumber: dayNum,
          date: new Date().toISOString().split('T')[0],
          theme: `Hari ${dayNum}`
        }, user);
      }
    });

    sessionsToImport.forEach(sess => {
      this.saveSession({
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId,
        dayNumber: sess.dayNumber,
        sessionNumber: sess.sessionNumber,
        startTime: sess.startTime,
        endTime: sess.endTime,
        title: sess.title,
        facilitatorName: sess.facilitatorName,
        location: sess.location,
        description: sess.description
      }, user);

      sess.status = 'IMPORTED';
      importedCount++;
    });

    this.saveSourceDocument(doc, user);

    this.addAuditLog(
      'SESSIONS_IMPORTED_FROM_SOURCE',
      `Import jadual selesai daripada "${doc.fileName}": ${importedCount} sesi baharu didaftarkan ke dalam tentatif kursus.`,
      courseId,
      undefined,
      user?.role || UserRole.ORGANIZER_ADMIN
    );

    return { importedCount };
  }

  // --- Pilot Validation Seed & Reset Helpers ---
  public loadKiarPilot(): void {
    localStorage.removeItem('mykursus_manually_cleared');
    // 1. Save Organizer
    const organizers = this.getOrganizers();
    if (!organizers.some(o => o.id === KIAR_PILOT_ORGANIZER.id)) {
      organizers.push(KIAR_PILOT_ORGANIZER);
      saveToStorage(STORAGE_KEYS.ORGANIZERS, organizers);
    }

    // 2. Save Course
    const courses = this.getCourses();
    const existingCourseIdx = courses.findIndex(c => c.id === KIAR_PILOT_COURSE.id);
    if (existingCourseIdx >= 0) {
      courses[existingCourseIdx] = KIAR_PILOT_COURSE;
    } else {
      courses.push(KIAR_PILOT_COURSE);
    }
    saveToStorage(STORAGE_KEYS.COURSES, courses);

    // 3. Save Schedule Days & Sessions
    const scheduleDays = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULE_DAYS, [])
      .filter(s => s.courseId !== KIAR_PILOT_COURSE.id)
      .concat(KIAR_PILOT_SCHEDULE_DAYS);
    saveToStorage(STORAGE_KEYS.SCHEDULE_DAYS, scheduleDays);

    const sessions = getFromStorage<SessionItem[]>(STORAGE_KEYS.SESSIONS, [])
      .filter(s => s.courseId !== KIAR_PILOT_COURSE.id)
      .concat(KIAR_PILOT_SESSIONS);
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);

    // 4. Save Participants & Enrollments
    const existingParts = getFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const existingEnrs = getFromStorage<CourseEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, [])
      .filter(e => e.courseId !== KIAR_PILOT_COURSE.id);

    KIAR_PILOT_PARTICIPANTS.forEach(item => {
      if (!existingParts.some(p => p.id === item.participant.id)) {
        existingParts.push(item.participant);
      }
      existingEnrs.push(item.enrollment);
    });

    saveToStorage(STORAGE_KEYS.PARTICIPANTS, existingParts);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, existingEnrs);

    // 5. Save Sample Change Request
    const crs = this.getChangeRequests().filter(cr => cr.id !== KIAR_PILOT_CHANGE_REQUEST.id);
    crs.push(KIAR_PILOT_CHANGE_REQUEST);
    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, crs);

    // 6. Save Sample Announcements
    const anns = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, [])
      .filter(a => a.courseId !== KIAR_PILOT_COURSE.id)
      .concat(KIAR_PILOT_ANNOUNCEMENTS);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, anns);

    // 7. Save Sample Resources & Slides
    const resList = getFromStorage<ResourceMaterial[]>(STORAGE_KEYS.RESOURCES, [])
      .filter(r => r.courseId !== KIAR_PILOT_COURSE.id)
      .concat(KIAR_PILOT_RESOURCES);
    saveToStorage(STORAGE_KEYS.RESOURCES, resList);

    // 8. Save Sample Source Documents (PART 07)
    const srcDocs = getFromStorage<SourceDocument[]>(STORAGE_KEYS.SOURCE_DOCUMENTS, [])
      .filter(d => d.courseId !== KIAR_PILOT_COURSE.id)
      .concat(KIAR_PILOT_SOURCE_DOCUMENTS);
    saveToStorage(STORAGE_KEYS.SOURCE_DOCUMENTS, srcDocs);

    // 9. Seed Realistic Pilot Attendance Records (PART 09)
    const pilotAttendance: AttendanceRecord[] = [];
    const days = [
      { dayNumber: 1, date: '2026-09-09' },
      { dayNumber: 2, date: '2026-09-10' },
      { dayNumber: 3, date: '2026-09-11' }
    ];

    days.forEach(day => {
      KIAR_PILOT_PARTICIPANTS.forEach(item => {
        // Realistic scenario: on Day 2, participant p-05 was excused for official duty
        const isExcused = day.dayNumber === 2 && item.participant.id === 'p-05';
        pilotAttendance.push({
          id: `att-kiar-${item.participant.id}-day-${day.dayNumber}`,
          courseId: KIAR_PILOT_COURSE.id,
          participantId: item.participant.id,
          enrollmentId: item.enrollment.id,
          attendanceLevel: 'DAILY',
          dayNumber: day.dayNumber,
          date: day.date,
          status: isExcused ? 'EXCUSED' : 'PRESENT',
          checkInMethod: 'ORGANIZER_MANUAL',
          markedAt: `${day.date}T08:15:00Z`,
          markedByUserId: 'user-org-01',
          markedByUserName: 'Urus Setia PPKI',
          notes: isExcused ? 'Pelepasan rasmi tugas fakulti' : undefined,
          updatedAt: `${day.date}T08:15:00Z`
        });
      });
    });

    const otherAttRecords = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, [])
      .filter(a => a.courseId !== KIAR_PILOT_COURSE.id);
    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, [...otherAttRecords, ...pilotAttendance]);

    this.addAuditLog(
      'PILOT_DATASET_LOADED',
      'Data Penanda Aras Pilot KIAR 2026 (22 peserta, rekod kehadiran 3 hari, 8 sesi, penginapan, pengumuman, bahan, dokumen sumber PPKI) dimuatkan untuk audit pengesahan.',
      KIAR_PILOT_COURSE.id,
      KIAR_PILOT_COURSE.title
    );
  }

  public clearAllData(): void {
    // Purge everything cleanly per DCOREV1 "Deleted Means Deleted"
    localStorage.setItem('mykursus_manually_cleared', 'true');
    saveToStorage(STORAGE_KEYS.COURSES, []);
    saveToStorage(STORAGE_KEYS.ORGANIZERS, []);
    saveToStorage(STORAGE_KEYS.PARTICIPANTS, []);
    saveToStorage(STORAGE_KEYS.ENROLLMENTS, []);
    saveToStorage(STORAGE_KEYS.SCHEDULE_DAYS, []);
    saveToStorage(STORAGE_KEYS.SESSIONS, []);
    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, []);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, []);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
    saveToStorage(STORAGE_KEYS.RESOURCES, []);
    saveToStorage(STORAGE_KEYS.SOURCE_DOCUMENTS, []);
    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
  }
}

export const platformStorage = new PlatformStorageRepository();
