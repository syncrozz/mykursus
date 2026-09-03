/**
 * MyKursus — Core Architecture & Data Model Types (DCOREV1 Part 02)
 * Framework: DCOREV1
 * Domain: Universal Multi-Tenant Course Engine
 */

export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN',
  ORGANIZER_ADMIN = 'ORGANIZER_ADMIN',
  PARTICIPANT = 'PARTICIPANT',
}

/**
 * Operational Course Status (Real-world event lifecycle)
 */
export enum CourseStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Governance & Approval Workflow Status
 */
export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Visibility and Data Privacy Tiers
 */
export enum VisibilityTier {
  PUBLIC = 'PUBLIC',                     // Anyone with course slug
  AUTHENTICATED = 'AUTHENTICATED',       // Logged-in participants of this course
  PARTICIPANT_PRIVATE = 'PARTICIPANT_PRIVATE', // Bound strictly to participant's own token/id
  ORGANIZER_ADMIN = 'ORGANIZER_ADMIN',   // Assigned organizers of this course
  MASTER_ADMIN = 'MASTER_ADMIN',         // Platform root governance only
}

/**
 * Pluggable Course Module Types
 */
export enum CourseModuleKey {
  // Core Modules (Standard on almost all courses)
  OVERVIEW = 'overview',
  SCHEDULE = 'schedule',
  SESSIONS = 'sessions',
  PARTICIPANTS = 'participants',
  ANNOUNCEMENTS = 'announcements',

  // Optional Modules (Activated on-demand)
  ACCOMMODATION = 'accommodation',
  VENUE_LOGISTICS = 'venue_logistics',
  WIFI_ACCESS = 'wifi_access',
  TRAVEL_MEALS = 'travel_meals',
  SECRETARIAT = 'secretariat',
  RESOURCES = 'resources',
  CHECKLIST = 'checklist',
  ATTENDANCE = 'attendance',
  FEEDBACK = 'feedback',
  CERTIFICATE = 'certificate',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organizer {
  id: string;
  name: string;              // e.g. "Pusat Pembangunan Kemahiran Insaniah"
  code: string;              // e.g. "PPKI"
  contactEmail: string;
  contactPhone: string;
  description?: string;
  memberUserIds: string[];   // Users who belong to this Organizer
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleConfig {
  key: CourseModuleKey;
  enabled: boolean;
  order: number;
  customLabel?: string;
  settings?: Record<string, unknown>;
}

export interface Course {
  id: string;                       // Immutable internal UUID
  slug: string;                     // Immutable public human-readable URL slug
  title: string;                    // e.g. "Kursus Transformasi Pedagogi MPU2412 KIAR"
  subtitle?: string;
  code?: string;                    // e.g. "MPU2412"
  description?: string;
  objectives?: string[];
  instructions?: string;
  organizerId: string;              // Belongs to one Organizer
  assignedUserIds: string[];        // Specific organizer managers

  // Real-world operational status
  status: CourseStatus;
  isFeaturedActive: boolean;        // Spotlighted by Master Admin

  // Governance & approval workflow
  approvalStatus: ApprovalStatus;
  publishedAt?: string;
  approvedAt?: string;
  approvedByUserId?: string;
  reviewNotes?: string;

  // Schedule & Venue Metadata
  startDate: string;                // ISO Date YYYY-MM-DD
  endDate: string;                  // ISO Date YYYY-MM-DD
  venueName: string;                // e.g. "Tamu Hotel & Suites Kuala Lumpur"
  venueAddress?: string;
  timezone: string;

  // Active Modules for this course
  modules: CourseModuleConfig[];

  // Attendance & Participation Tracking Configuration (PART 09)
  attendanceConfig?: CourseAttendanceConfig;

  // Change governance tracking
  hasPendingChanges: boolean;

  // Practical Logistics & Accommodation Sub-modules (Optional/Pluggable)
  venueDetails?: {
    hallName?: string;
    floor?: string;
    floorLevel?: string;
    wifiSsid?: string;
    wifiPassword?: string;
    parkingInfo?: string;
    directions?: string;
  };
  wifiDetails?: WifiAccessConfig;
  accommodationDetails?: {
    providerName?: string;
    checkInTime?: string;
    checkOutTime?: string;
    roomTypes?: string;
    notes?: string;
  };
  contacts?: Array<{
    id: string;
    name: string;
    position: string;
    phone: string;
    email?: string;
    whatsapp?: string;
  }>;
  sourceDocuments?: SourceDocumentReference[];

  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  icOrNationalId?: string;          // Stored securely, never public
  salaryNumber?: string;            // Official salary/employee number (e.g. G-40812)
  name: string;
  email: string;
  phone: string;
  institutionOrAgency: string;      // e.g. "Kolej Poly-Tech MARA Kuantan"
  designation?: string;
  gender?: 'M' | 'F';
  createdAt: string;
}

export type ParticipantLifecycleStatus = 
  | 'REGISTERED' 
  | 'CONFIRMED' 
  | 'ATTENDING' 
  | 'ABSENT' 
  | 'COMPLETED' 
  | 'WITHDRAWN' 
  | 'CANCELLED'
  | 'ATTENDED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceLevel = 'COURSE' | 'DAILY' | 'SESSION';
export type CheckInMethod = 'ORGANIZER_MANUAL' | 'SELF_CHECKIN' | 'QR_CODE';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  participantId: string;
  enrollmentId: string;
  attendanceLevel: AttendanceLevel;
  dayNumber?: number;
  date?: string;                    // YYYY-MM-DD
  sessionId?: string;
  sessionNumber?: number;
  status: AttendanceStatus;
  checkInMethod: CheckInMethod;
  markedAt: string;
  markedByUserId?: string;
  markedByUserName?: string;
  notes?: string;
  updatedAt?: string;
  previousStatus?: AttendanceStatus;
}

export interface CourseAttendanceConfig {
  attendanceLevel: AttendanceLevel;
  allowSelfCheckIn: boolean;
  requireMinimumPercentage: number; // e.g. 80
  requiredSessionsCount?: number;
  autoCompleteOnRequirementMet: boolean;
}

/**
 * Sanitized Participant Data revealed ONLY after phone number verification
 * Contains strictly minimal necessary data per DCOREV1 privacy boundaries
 */
export interface VerifiedParticipantData {
  participantId: string;
  name: string;
  institutionOrAgency: string;
  designation?: string;
  phone: string;                    // Masked for privacy (e.g. 019-***5671)
  enrollmentStatus: string;
  attendanceConfirmed: boolean;
  roomNumber?: string;
  roommateName?: string;
  assignedGroup?: string;
  specialRequirements?: string;
  attendanceSummary?: {
    totalContexts: number;
    presentCount: number;
    percentage: number;
    level: AttendanceLevel;
    records: Array<{
      label: string;
      date?: string;
      status: AttendanceStatus;
      markedAt?: string;
    }>;
  };
  courseCompletionStatus?: string;
}

/**
 * Enrollment join: binds a Participant to a specific Course with private allocations
 */
export interface CourseEnrollment {
  id: string;
  courseId: string;
  participantId: string;
  status: ParticipantLifecycleStatus;
  attendanceConfirmed: boolean;

  // Participant-Specific Private Allocations (Never public)
  roomNumber?: string;              // e.g. "508"
  roommateName?: string;            // e.g. "Ustaz Ahmad"
  assignedGroup?: string;           // e.g. "Kumpulan 3: Modul STEM"
  specialRequirements?: string;     // Dietary, mobility, medical
  secretariatNotes?: string;        // Internal organizer note
  salaryNumber?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDay {
  id: string;
  courseId: string;
  dayNumber: number;                // Day 1, Day 2, etc.
  date: string;                     // YYYY-MM-DD
  theme?: string;
}

export interface SessionItem {
  id: string;
  courseId: string;
  dayNumber: number;
  sessionNumber: number;            // 1 to 8, etc.
  startTime: string;                // e.g. "08:30"
  endTime: string;                  // e.g. "10:30"
  title: string;
  description?: string;
  facilitatorName?: string;
  location?: string;                // e.g. "Ballroom Level 2"
  isBreakOrMeal?: boolean;
  presentationUrl?: string;         // Live presentation or slides link
  materialsNote?: string;
  updatedAt?: string;               // ISO timestamp of latest operational edit
}

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'CRITICAL';
export type AnnouncementCategory = 'GENERAL' | 'SCHEDULE_CHANGE' | 'LOCATION_CHANGE' | 'RESOURCES' | 'URGENT';

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPublic: boolean;
  publishedAt: string;
  authorUserId: string;
  authorName?: string;
  relatedSessionId?: string;        // Optional link to specific session (single source of truth)
  relatedResourceId?: string;       // Optional link to specific resource (single source of truth)
  category?: AnnouncementCategory;
  updatedAt?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  targetScope?: 'ALL' | 'SESSION' | 'PARTICIPANT_GROUP'; // Clean extension point for future targeted messaging
  targetGroupId?: string;           // Clean extension point
  expiresAt?: string;               // Optional expiry
}

export interface ResourceMaterial {
  id: string;
  courseId: string;
  title: string;
  category: 'SLIDES' | 'DOCUMENT' | 'TEMPLATE' | 'EXTERNAL_LINK';
  fileUrl: string;
  fileSizeMb?: number;
  sessionId?: string;               // Optional link to specific session
  isPublic: boolean;
  createdAt: string;
}

/**
 * Proposed Change entity for low-risk vs high-risk governance
 */
export interface ApprovalChangeRequest {
  id: string;
  courseId: string;
  courseTitle: string;
  requestedByUserId: string;
  requestedByOrganizerName: string;
  changeCategory: 'HIGH_RISK' | 'LOW_RISK';
  targetField: 'DATES' | 'VENUE' | 'PUBLICATION' | 'GENERAL';
  currentValue: string;
  proposedValue: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
}

export interface AuditLog {
  id: string;
  courseId?: string;
  courseTitle?: string;
  action: string;
  details: string;
  performedByRole: UserRole;
  timestamp: string;
}

export interface SourceDocumentReference {
  id: string;
  courseId: string;
  originalFileName: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'TXT' | 'CSV';
  documentPurpose: 'OFFER_LETTER' | 'SCHEDULE' | 'PARTICIPANT_LIST' | 'GENERAL';
  uploadedAt: string;
  extractedState: 'UNPROCESSED' | 'EXTRACTED' | 'VERIFIED';
}

/**
 * PART 07 — Source Documents & Smart Data Extraction Types
 */
export type SourceDocumentCategory = 
  | 'OFFICIAL_LETTER'
  | 'SCHEDULE'
  | 'PARTICIPANT_LIST'
  | 'ACCOMMODATION'
  | 'VENUE_LOGISTICS'
  | 'COURSE_INFO'
  | 'REQUIREMENTS'
  | 'RESOURCE'
  | 'OTHER';

export type ExtractionStatus = 
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'FAILED'
  | 'UNSUPPORTED';

export type ExtractionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';

export interface ExtractedField<T = string> {
  fieldKey: string;
  fieldLabel: string;
  category: 'COURSE' | 'LOGISTICS' | 'CONTACT' | 'ACCOMMODATION';
  extractedValue: T;
  currentValue?: string;
  confidence: ExtractionConfidence;
  sourceSnippet?: string;
  isConflict?: boolean;
  isHighRiskGovernance?: boolean; // For Dates and Venue which require Master Admin review on approved courses
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ExtractedParticipantRow {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  institutionOrAgency: string;
  designation?: string;
  gender?: 'M' | 'F';
  salaryNumber?: string;
  icOrNationalId?: string;
  roomNumber?: string;
  roommateName?: string;
  assignedGroup?: string;
  specialRequirements?: string;
  confidence: ExtractionConfidence;
  validationErrors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  existingParticipantId?: string;
  selectedForImport: boolean;
  status: 'PENDING' | 'IMPORTED' | 'REJECTED';
}

export interface ExtractedSessionItem {
  id: string;
  dayNumber: number;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  title: string;
  facilitatorName?: string;
  location?: string;
  description?: string;
  confidence: ExtractionConfidence;
  sourceSnippet?: string;
  selectedForImport: boolean;
  status: 'PENDING' | 'IMPORTED' | 'REJECTED';
}

export interface ExtractedPayload {
  fields: ExtractedField<any>[];
  sessions: ExtractedSessionItem[];
  participants: ExtractedParticipantRow[];
  detectedColumns?: string[];
  summary: {
    totalFieldsExtracted: number;
    totalSessionsExtracted: number;
    totalParticipantsExtracted: number;
    highConfidenceCount: number;
    conflictCount: number;
  };
}

export interface SourceDocument {
  id: string;
  courseId: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT' | 'IMAGE' | 'OTHER';
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  category: SourceDocumentCategory;
  customCategoryLabel?: string;
  rawText?: string;
  fileDataUrl?: string;
  extractionStatus: ExtractionStatus;
  lastExtractedAt?: string;
  processingError?: string;
  extractedPayload?: ExtractedPayload;
  version: number;
}

export interface UserAuthContext {
  id: string;
  name?: string;
  role: UserRole;
  organizerId?: string;
}

export interface VenueLogistics {
  hallName?: string;
  floor?: string;
  floorLevel?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  parkingInfo?: string;
  directions?: string;
}

export interface WifiAccessConfig {
  ssid: string;
  password?: string;
  instructions?: string;
}

export interface SecretariatContact {
  id: string;
  name: string;
  position: string;
  phone: string;
  email?: string;
  whatsapp?: string;
}
