import React, { useState, useEffect } from 'react';
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
    } catch (err: any) {
      alert(err.message || 'Ralat menyimpan draf kursus.');
    }
  };

  const handleUpdateCourse = (updates: Partial<Course>) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateCourseOperational(activeCourse.id, updates, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitForReview = () => {
    if (!activeCourse) return;
    try {
      platformStorage.submitCourseForReview(activeCourse.id, authContext);
      handleRefresh();
      alert('Kursus berjaya dihantar untuk semakan Master Admin.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestOfficialChange = (targetField: 'DATES' | 'VENUE', proposedValue: string, reason: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.proposeHighRiskChange(activeCourse.id, targetField, proposedValue, reason, authContext);
      handleRefresh();
      alert('Permohonan pindaan rasmi telah dihantar kepada Master Admin.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Participant Actions
  const handleSaveParticipant = (pData: Partial<Participant>, eData: Partial<CourseEnrollment>) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveParticipant(activeCourse.id, pData, eData, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteParticipant = (participantId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteParticipantFromCourse(activeCourse.id, participantId, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateAllocations = (enrollmentId: string, allocations: Partial<CourseEnrollment>) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateEnrollmentPrivateAllocations(activeCourse.id, enrollmentId, allocations, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkImportParticipants = (rows: Array<{ participant: Partial<Participant>; enrollment: Partial<CourseEnrollment> }>) => {
    if (!activeCourse) return;
    try {
      platformStorage.bulkImportParticipants(activeCourse.id, rows, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestoreBackup = (payload: any) => {
    if (!activeCourse) return;
    try {
      platformStorage.restoreCourseBackup(activeCourse.id, payload, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Schedule Actions
  const handleSaveDay = (day: ScheduleDay) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveScheduleDay(day, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDay = (dayId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteScheduleDay(dayId, activeCourse.id, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSession = (session: SessionItem) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveSession(session, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteSession(sessionId, activeCourse.id, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Announcement Actions
  const handleSaveAnnouncement = (ann: Announcement) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveAnnouncement(ann, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteAnnouncement(id, activeCourse.id, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resource & Materials Actions
  const handleSaveResource = (res: ResourceMaterial) => {
    if (!activeCourse) return;
    try {
      platformStorage.saveResource(res, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteResource = (id: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteResource(id, activeCourse.id, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Attendance Handlers (DCOREV1 Section 09)
  const handleSaveAttendance = (record: AttendanceRecord) => {
    try {
      platformStorage.saveAttendanceRecord(record, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkSaveAttendance = (records: AttendanceRecord[]) => {
    if (!activeCourse) return;
    try {
      platformStorage.bulkSaveAttendanceRecords(activeCourse.id, records, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAttendance = (recordId: string) => {
    if (!activeCourse) return;
    try {
      platformStorage.deleteAttendanceRecord(recordId, activeCourse.id, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateParticipantLifecycleStatus = (enrollmentId: string, status: ParticipantLifecycleStatus) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateParticipantLifecycleStatus(activeCourse.id, enrollmentId, status, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateAttendanceConfig = (config: any) => {
    if (!activeCourse) return;
    try {
      platformStorage.updateCourseAttendanceConfig(activeCourse.id, config, authContext);
      handleRefresh();
    } catch (err: any) {
      alert(err.message);
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
          onUpdateAllocations={handleUpdateAllocations}
          onBulkImportParticipants={handleBulkImportParticipants}
          onRestoreBackup={handleRestoreBackup}
          onSaveDay={handleSaveDay}
          onDeleteDay={handleDeleteDay}
          onSaveSession={handleSaveSession}
          onDeleteSession={handleDeleteSession}
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
