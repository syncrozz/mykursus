import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { 
  Course, 
  Organizer, 
  UserRole, 
  UserAuthContext, 
  Participant, 
  CourseEnrollment, 
  ScheduleDay, 
  SessionItem, 
  Announcement,
  ResourceMaterial,
  AttendanceRecord,
  ParticipantLifecycleStatus
} from '../../types';
import { platformStorage } from '../../services/storage';
import { OrganizerHeader } from './OrganizerHeader';
import { OrganizerDashboard } from './OrganizerDashboard';
import { CourseWorkspace } from './CourseWorkspace';
import { CreateCourseModal } from './CreateCourseModal';
import { AccessDeniedNotice } from './AccessDeniedNotice';

interface OrganizerWorkspaceProps {
  onSwitchToMasterAdmin?: () => void;
  onOpenPublicPreview?: (course: Course) => void;
}

export const OrganizerWorkspace: React.FC<OrganizerWorkspaceProps> = ({
  onSwitchToMasterAdmin,
  onOpenPublicPreview,
}) => {
  // Organizers available on platform
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [currentOrganizerId, setCurrentOrganizerId] = useState<string>('org-ppki-01');

  // Simulation Role: ORGANIZER_ADMIN by default, can switch to MASTER_ADMIN or PARTICIPANT for RBAC testing
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.ORGANIZER_ADMIN);

  // Selected course within Organizer Workspace
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Create Course Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Reload trigger
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Toast feedback state
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Event listener for storage changes across components and tabs
  useEffect(() => {
    const handleDataChanged = () => {
      setDataVersion(v => v + 1);
    };
    window.addEventListener('mykursus_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('mykursus_data_changed', handleDataChanged);
    };
  }, []);

  useEffect(() => {
    const orgs = platformStorage.getOrganizers();
    setOrganizers(orgs);
    if (orgs.length > 0 && !orgs.some(o => o.id === currentOrganizerId)) {
      setCurrentOrganizerId(orgs[0].id);
    }
  }, [dataVersion]);

  const currentOrganizer = organizers.find(o => o.id === currentOrganizerId) || {
    id: currentOrganizerId,
    name: 'Penganjur',
    code: 'ORG',
    status: 'ACTIVE',
    contactPerson: 'Urus Setia',
    email: '',
    phone: '',
  };

  // Construct Auth Context for storage authorization
  const authContext: UserAuthContext = {
    id: `user-${currentOrganizerId}`,
    name: currentOrganizer.contactPerson || 'Urus Setia',
    role: currentRole,
    organizerId: currentOrganizerId,
  };

  // Fetch all courses
  const allCourses = platformStorage.getCourses();
  const organizerCourses = allCourses.filter(c => c.organizerId === currentOrganizerId);

  // Active selected course
  const activeCourse = selectedCourseId ? platformStorage.getCourseById(selectedCourseId) : null;

  // Security Check: Cross-Tenant Isolation (Section 03 & 28)
  const isCourseOwnedByCurrentOrg = activeCourse 
    ? (currentRole === UserRole.MASTER_ADMIN || activeCourse.organizerId === currentOrganizerId)
    : true;

  // Data helpers for active course
  const courseEnrollments = activeCourse ? platformStorage.getEnrollmentsByCourseId(activeCourse.id) : [];
  const scheduleDays = activeCourse ? platformStorage.getScheduleDaysByCourseId(activeCourse.id) : [];
  const sessions = activeCourse ? platformStorage.getSessionsByCourseId(activeCourse.id) : [];
  const announcements = activeCourse ? platformStorage.getAnnouncementsByCourseId(activeCourse.id) : [];
  const resources = activeCourse ? platformStorage.getResourcesByCourseId(activeCourse.id) : [];
  const auditLogs = activeCourse ? platformStorage.getAuditLogsByCourseId(activeCourse.id) : [];
  const attendanceRecords = activeCourse ? platformStorage.getAttendanceRecordsByCourseId(activeCourse.id) : [];

  const handleRefresh = () => {
    setDataVersion(v => v + 1);
  };

  // Course Actions
  const handleSaveDraftCourse = (courseData: Partial<Course>) => {
    try {
      const newCourse = platformStorage.createCourse(courseData, authContext);
      setShowCreateModal(false);
      handleRefresh();
      setSelectedCourseId(newCourse.id);
      showFeedback('✓ Kursus baharu berjaya dicipta!');
    } catch (err: any) {
      showFeedback(err.message || 'Ralat menyimpan draf kursus.', 'error');
    }
  };

  const handleUpdateCourse = (updates: Partial<Course>) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateCourseOperational(activeCourse.id, updates, authContext);
      handleRefresh();
      showFeedback('✓ Maklumat kursus berjaya dikemaskini & disimpan ke Cloud!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleSubmitForReview = () => {
    if (!activeCourse) return;
    try {
      platformStorage.submitCourseForReview(activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Kursus berjaya dihantar untuk semakan Master Admin.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleRequestOfficialChange = (targetField: 'DATES' | 'VENUE', proposedValue: string, reason: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.proposeHighRiskChange(activeCourse.id, targetField, proposedValue, reason, authContext);
      handleRefresh();
      showFeedback('✓ Permohonan pindaan rasmi telah dihantar kepada Master Admin.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Participant Actions
  const handleSaveParticipant = (pData: Partial<Participant>, eData: Partial<CourseEnrollment>) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveParticipant(activeCourse.id, pData, eData, authContext);
      handleRefresh();
      showFeedback('✓ Maklumat peserta berjaya dikemaskini & disimpan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteParticipant = (participantId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteParticipantFromCourse(activeCourse.id, participantId, authContext);
      handleRefresh();
      showFeedback('✓ Rekod peserta telah dikeluarkan.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleBulkDeleteParticipants = (participantIds: string[]) => {
    if (!activeCourse || !participantIds || participantIds.length === 0) return;
    try {
      const count = platformStorage.bulkDeleteParticipantsFromCourse(activeCourse.id, participantIds, authContext);
      handleRefresh();
      showFeedback(`✓ Sebanyak ${count} peserta berjaya dipadam dari kursus.`);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    try {
      platformStorage.deleteCourse(courseId);
      handleRefresh();
      showFeedback('✓ Kursus telah dipadam secara kekal.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleBulkDeleteCourses = (courseIds: string[]) => {
    if (!courseIds || courseIds.length === 0) return;
    try {
      const count = platformStorage.bulkDeleteCourses(courseIds);
      handleRefresh();
      showFeedback(`✓ Sebanyak ${count} kursus berjaya dipadam.`);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleUpdateAllocations = (enrollmentId: string, allocations: Partial<CourseEnrollment>) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateEnrollmentPrivateAllocations(activeCourse.id, enrollmentId, allocations, authContext);
      handleRefresh();
      showFeedback('✓ Agihan bilik / kumpulan peserta dikemaskini!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleBulkImportParticipants = (rows: Array<{ participant: Partial<Participant>; enrollment: Partial<CourseEnrollment> }>) => {
    if (!activeCourse) return;
    try {
      platformStorage.bulkImportParticipants(activeCourse.id, rows, authContext);
      handleRefresh();
      showFeedback(`✓ Pukal peserta (${rows.length} orang) berjaya diimport!`);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleRestoreBackup = (payload: any) => {
    if (!activeCourse) return;
    try {
      platformStorage.restoreCourseBackup(activeCourse.id, payload, authContext);
      handleRefresh();
      showFeedback('✓ Sandaran kursus berjaya dipulihkan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Schedule Actions
  const handleSaveDay = (day: ScheduleDay) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveScheduleDay(day, authContext);
      handleRefresh();
      showFeedback('✓ Hari jadual berjaya disimpan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteDay = (dayId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteScheduleDay(dayId, activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Hari jadual telah dipadam.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleSaveSession = (session: SessionItem) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveSession(session, authContext);
      handleRefresh();
      showFeedback('✓ Sesi jadual berjaya disimpan & diselaraskan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteSession(sessionId, activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Sesi jadual telah dipadam.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleBulkImportSessions = (
    sessionsToImport: SessionItem[], 
    newDaysToCreate: ScheduleDay[], 
    replaceExistingDays: number[]
  ) => {
    if (!activeCourse) return;
    try {
      const res = platformStorage.bulkImportSessions(
        activeCourse.id,
        sessionsToImport,
        newDaysToCreate,
        replaceExistingDays,
        authContext
      );
      handleRefresh();
      showFeedback(`✓ Berjaya mengimport ${res.importedCount} slot jadual!${res.daysCreatedCount > 0 ? ` (${res.daysCreatedCount} hari baharu ditambah)` : ''}`);
    } catch (err: any) {
      showFeedback(`Ralat semasa import: ${err.message}`, 'error');
    }
  };

  // Announcement Actions
  const handleSaveAnnouncement = (ann: Announcement) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveAnnouncement(ann, authContext);
      handleRefresh();
      showFeedback('✓ Pengumuman langsung diterbitkan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteAnnouncement(id, activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Pengumuman telah dipadam.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Resource & Materials Actions
  const handleSaveResource = (res: ResourceMaterial) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveResource(res, authContext);
      handleRefresh();
      showFeedback('✓ Bahan rujukan kursus berjaya dimuat naik & disimpan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteResource = (id: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteResource(id, activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Bahan rujukan telah dipadam.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Attendance Handlers (DCOREV1 Section 09)
  const handleSaveAttendance = (record: AttendanceRecord) => {
    try {
      platformStorage.saveAttendanceRecord(record, authContext);
      handleRefresh();
      showFeedback('✓ Rekod kehadiran berjaya dikemaskini!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleBulkSaveAttendance = (records: AttendanceRecord[]) => {
    if (!activeCourse) return;
    try {
      platformStorage.bulkSaveAttendanceRecords(activeCourse.id, records, authContext);
      handleRefresh();
      showFeedback('✓ Rekod kehadiran pukal berjaya disimpan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteAttendance = (recordId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteAttendanceRecord(recordId, activeCourse.id, authContext);
      handleRefresh();
      showFeedback('✓ Rekod kehadiran telah dipadam.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleUpdateParticipantLifecycleStatus = (enrollmentId: string, status: ParticipantLifecycleStatus) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateParticipantLifecycleStatus(activeCourse.id, enrollmentId, status, authContext);
      handleRefresh();
      showFeedback('✓ Status penyertaan dikemaskini!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleUpdateAttendanceConfig = (config: any) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateCourseAttendanceConfig(activeCourse.id, config, authContext);
      handleRefresh();
      showFeedback('✓ Tetapan kehadiran kursus disimpan!');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleLoadPilot = () => {
    platformStorage.loadKiarPilot();
    handleRefresh();
  };

  // RBAC Boundary 1: If current role is PARTICIPANT, block workspace access
  if (currentRole === UserRole.PARTICIPANT) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <OrganizerHeader
          currentOrganizer={currentOrganizer}
          organizers={organizers}
          onSwitchOrganizer={setCurrentOrganizerId}
          currentRole={currentRole}
          onSwitchRole={setCurrentRole}
          onOpenCreateCourse={() => setShowCreateModal(true)}
          totalCoursesCount={organizerCourses.length}
        />
        <AccessDeniedNotice
          reason="Anda sedang mensimulasikan peranan Peserta (PARTICIPANT). Peserta hanya mempunyai akses paparan awam melalui URL slug Option A, dan tidak dibenarkan mengakses pengurusan operasi kursus."
          onSwitchToAuthorizedRole={(role) => setCurrentRole(role)}
        />
      </div>
    );
  }

  // RBAC Boundary 2: If course selected does NOT belong to current organizer
  if (activeCourse && !isCourseOwnedByCurrentOrg) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <OrganizerHeader
          currentOrganizer={currentOrganizer}
          organizers={organizers}
          onSwitchOrganizer={setCurrentOrganizerId}
          currentRole={currentRole}
          onSwitchRole={setCurrentRole}
          onOpenCreateCourse={() => setShowCreateModal(true)}
          totalCoursesCount={organizerCourses.length}
        />
        <AccessDeniedNotice
          reason={`Kursus "${activeCourse.title}" dimiliki oleh organisasi lain (${activeCourse.organizerId}). Mengikut prinsip pemintalan penyewa (multi-tenant isolation) DCOREV1, anda tidak mempunyai hak akses.`}
          onBackToDashboard={() => setSelectedCourseId(null)}
          onSwitchToAuthorizedRole={(role) => setCurrentRole(role)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div className={`p-3 border-2 text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] animate-in fade-in slide-in-from-top-2 duration-200 ${
          feedback.type === 'error' 
            ? 'bg-red-100 border-red-800 text-red-950' 
            : 'bg-emerald-100 border-emerald-800 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-zinc-600 hover:text-zinc-950 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header bar with tenant switcher and role simulator */}
      <OrganizerHeader
        currentOrganizer={currentOrganizer}
        organizers={organizers}
        onSwitchOrganizer={(orgId) => {
          setCurrentOrganizerId(orgId);
          setSelectedCourseId(null); // Reset selected course on tenant change
        }}
        currentRole={currentRole}
        onSwitchRole={setCurrentRole}
        onOpenCreateCourse={() => setShowCreateModal(true)}
        totalCoursesCount={organizerCourses.length}
      />

      {/* Main Workspace View: Dashboard vs Individual Course */}
      {!activeCourse ? (
        <OrganizerDashboard
          currentOrganizer={currentOrganizer}
          courses={allCourses}
          getParticipantCount={(courseId) => platformStorage.getEnrollmentsByCourseId(courseId).length}
          onSelectCourse={(course) => setSelectedCourseId(course.id)}
          onOpenCreateModal={() => setShowCreateModal(true)}
          onOpenPublicPreview={(course) => {
            if (onOpenPublicPreview) onOpenPublicPreview(course);
          }}
          onLoadPilot={handleLoadPilot}
          onDeleteCourse={handleDeleteCourse}
          onBulkDeleteCourses={handleBulkDeleteCourses}
        />
      ) : (
        <CourseWorkspace
          course={activeCourse}
          currentOrganizer={currentOrganizer}
          enrollments={courseEnrollments}
          scheduleDays={scheduleDays}
          sessions={sessions}
          announcements={announcements}
          resources={resources}
          auditLogs={auditLogs}
          attendanceRecords={attendanceRecords}
          authContext={authContext}
          onBackToDashboard={() => setSelectedCourseId(null)}
          onUpdateCourse={handleUpdateCourse}
          onSubmitForReview={handleSubmitForReview}
          onRequestOfficialChange={handleRequestOfficialChange}
          onSaveParticipant={handleSaveParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onBulkDeleteParticipants={handleBulkDeleteParticipants}
          onUpdateAllocations={handleUpdateAllocations}
          onBulkImportParticipants={handleBulkImportParticipants}
          onRestoreBackup={handleRestoreBackup}
          onSaveDay={handleSaveDay}
          onDeleteDay={handleDeleteDay}
          onSaveSession={handleSaveSession}
          onDeleteSession={handleDeleteSession}
          onBulkImportSessions={handleBulkImportSessions}
          onSaveAnnouncement={handleSaveAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onSaveResource={handleSaveResource}
          onDeleteResource={handleDeleteResource}
          onSaveAttendance={handleSaveAttendance}
          onBulkSaveAttendance={handleBulkSaveAttendance}
          onDeleteAttendance={handleDeleteAttendance}
          onUpdateParticipantStatus={handleUpdateParticipantLifecycleStatus}
          onUpdateAttendanceConfig={handleUpdateAttendanceConfig}
          onOpenPublicPreview={() => {
            if (onOpenPublicPreview) onOpenPublicPreview(activeCourse);
          }}
        />
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          currentOrganizer={currentOrganizer}
          onSaveDraft={handleSaveDraftCourse}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
