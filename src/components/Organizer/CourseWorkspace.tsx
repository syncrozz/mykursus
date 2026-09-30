import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Eye, 
  ExternalLink, 
  BookOpen, 
  FileText, 
  Users, 
  Calendar, 
  Bell, 
  Home, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles, 
  Zap, 
  History, 
  Radio,
  UserCheck,
  RefreshCw,
  Cloud,
  Check
} from 'lucide-react';
import { platformStorage } from '../../services/storage';
import { formatDateRangeDMY } from '../../utils/dateFormatter';
import { 
  Course, 
  ApprovalStatus, 
  CourseStatus, 
  Participant, 
  CourseEnrollment, 
  ScheduleDay, 
  SessionItem, 
  Announcement, 
  Organizer, 
  ResourceMaterial, 
  AuditLog, 
  UserRole,
  AttendanceRecord,
  ParticipantLifecycleStatus,
  UserAuthContext
} from '../../types';

import { CourseOverviewTab } from './CourseOverviewTab';
import { CourseInfoTab } from './CourseInfoTab';
import { ParticipantsTab } from './ParticipantsTab';
import { AttendanceTab } from './AttendanceTab';
import { ScheduleTab } from './ScheduleTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { AccommodationTab } from './AccommodationTab';
import { LogisticsTab } from './LogisticsTab';
import { LiveOperationsTab } from './LiveOperationsTab';
import { ResourcesTab } from './ResourcesTab';
import { SourceDocumentsTab } from './SourceDocuments/SourceDocumentsTab';
import { CourseAuditTab } from './CourseAuditTab';

interface CourseWorkspaceProps {
  course: Course;
  currentOrganizer: Organizer;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  announcements: Announcement[];
  resources?: ResourceMaterial[];
  auditLogs?: AuditLog[];
  attendanceRecords?: AttendanceRecord[];
  authContext?: UserAuthContext;
  onBackToDashboard: () => void;
  onUpdateCourse: (updates: Partial<Course>) => void;
  onSubmitForReview: () => void;
  onRequestOfficialChange: (targetField: 'DATES' | 'VENUE', proposedValue: string, reason: string) => void;
  onSaveParticipant: (participantData: Partial<Participant>, enrollmentData: Partial<CourseEnrollment>) => void;
  onDeleteParticipant: (participantId: string) => void;
  onBulkDeleteParticipants?: (participantIds: string[]) => void;
  onUpdateAllocations: (enrollmentId: string, allocations: Partial<CourseEnrollment>) => void;
  onBulkImportParticipants?: (rows: Array<{ participant: Partial<Participant>; enrollment: Partial<CourseEnrollment> }>) => void;
  onRestoreBackup?: (payload: any) => void;
  onSaveDay: (day: ScheduleDay) => void;
  onDeleteDay: (dayId: string) => void;
  onSaveSession: (session: SessionItem) => void;
  onDeleteSession: (sessionId: string) => void;
  onBulkImportSessions?: (sessionsToImport: SessionItem[], newDaysToCreate: ScheduleDay[], replaceExistingDays: number[]) => void;
  onSaveAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onSaveResource?: (resource: ResourceMaterial) => void;
  onDeleteResource?: (id: string) => void;
  onSaveAttendance?: (record: AttendanceRecord) => void;
  onBulkSaveAttendance?: (records: AttendanceRecord[]) => void;
  onDeleteAttendance?: (recordId: string) => void;
  onUpdateParticipantStatus?: (enrollmentId: string, status: ParticipantLifecycleStatus) => void;
  onUpdateAttendanceConfig?: (config: any) => void;
  onOpenPublicPreview: () => void;
}

export const CourseWorkspace: React.FC<CourseWorkspaceProps> = ({
  course,
  currentOrganizer,
  enrollments,
  scheduleDays,
  sessions,
  announcements,
  resources = [],
  auditLogs = [],
  attendanceRecords = [],
  authContext,
  onBackToDashboard,
  onUpdateCourse,
  onSubmitForReview,
  onRequestOfficialChange,
  onSaveParticipant,
  onDeleteParticipant,
  onBulkDeleteParticipants,
  onUpdateAllocations,
  onBulkImportParticipants,
  onRestoreBackup,
  onSaveDay,
  onDeleteDay,
  onSaveSession,
  onDeleteSession,
  onBulkImportSessions,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onSaveResource = () => {},
  onDeleteResource = () => {},
  onSaveAttendance = () => {},
  onBulkSaveAttendance = () => {},
  onDeleteAttendance = () => {},
  onUpdateParticipantStatus = () => {},
  onUpdateAttendanceConfig,
  onOpenPublicPreview,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'operations' | 'documents' | 'info' | 'participants' | 'attendance' | 'schedule' | 'resources' | 'announcements' | 'accommodation' | 'logistics' | 'audit'
  >('overview');

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncNotice, setCloudSyncNotice] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>(() => {
    return platformStorage.getAutoSyncStatus?.()?.status || 'idle';
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    const raw = platformStorage.getAutoSyncStatus?.()?.lastSyncedAt;
    if (!raw) return null;
    return new Date(raw).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      if (e.detail) {
        setSyncStatus(e.detail.status);
        if (e.detail.lastSyncedAt) {
          const date = new Date(e.detail.lastSyncedAt);
          setLastSyncedTime(date.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
        if (e.detail.status === 'synced') {
          setCloudSyncNotice(`✓ Data disegerak secara automatik ke Cloud Firestore (${e.detail.count || 0} rekod).`);
          setTimeout(() => setCloudSyncNotice(null), 4000);
        }
      }
    };
    window.addEventListener('mykursus_sync_status', handleSyncStatus);
    return () => window.removeEventListener('mykursus_sync_status', handleSyncStatus);
  }, []);

  const handleSyncToCloud = async () => {
    setIsSyncingCloud(true);
    setCloudSyncNotice(null);
    try {
      const res = await platformStorage.syncToCloud();
      if (res.success) {
        setCloudSyncNotice(`✓ Data disegerak ke Cloud Firestore (${res.count} rekod). Boleh diakses di tab incognito.`);
        setTimeout(() => setCloudSyncNotice(null), 5000);
      } else {
        setCloudSyncNotice(`Ralat: ${res.error || 'Gagal menyegerak ke Cloud'}`);
      }
    } catch (e: any) {
      setCloudSyncNotice(`Ralat: ${e.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const isDraft = course.approvalStatus === ApprovalStatus.DRAFT;
  const isChangesRequired = course.approvalStatus === ApprovalStatus.CHANGES_REQUIRED;
  const isSubmitted = course.approvalStatus === ApprovalStatus.SUBMITTED;
  const isApproved = course.approvalStatus === ApprovalStatus.APPROVED;

  const canSubmit = isDraft || isChangesRequired;

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: Layers },
    // Show Live Operations prominently
    { 
      id: 'operations', 
      label: 'Operasi Acara (Live)', 
      icon: Zap,
      highlight: true
    },
    { 
      id: 'documents', 
      label: 'Dokumen Sumber (AI)', 
      icon: Sparkles 
    },
    { id: 'info', label: 'Info Kursus', icon: FileText },
    { id: 'participants', label: `Peserta (${enrollments.length})`, icon: Users },
    { id: 'attendance', label: 'Kehadiran & Status', icon: UserCheck, highlight: true },
    { id: 'schedule', label: `Jadual & Sesi (${sessions.length})`, icon: Calendar },
    { id: 'resources', label: `Bahan & Slaid (${resources.length})`, icon: BookOpen },
    { id: 'announcements', label: `Pengumuman (${announcements.length})`, icon: Bell },
    { id: 'accommodation', label: 'Penginapan', icon: Home },
    { id: 'logistics', label: 'Logistik & Urus Setia', icon: Building },
    { id: 'audit', label: `Log Operasi (${auditLogs.length})`, icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Top Workspace Header Navigation */}
      <div className="bg-white border-2 border-zinc-900 p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        {/* Back and Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 flex items-center gap-1 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Semua Kursus</span>
            </button>

            <span className="text-zinc-300">|</span>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-zinc-500 font-bold">
                KOD: {course.code}
              </span>

              {/* Status Badge */}
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-black ${
                course.approvalStatus === ApprovalStatus.APPROVED
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                  : course.approvalStatus === ApprovalStatus.SUBMITTED
                  ? 'bg-amber-100 text-amber-950 border-amber-400'
                  : course.approvalStatus === ApprovalStatus.CHANGES_REQUIRED
                  ? 'bg-red-100 text-red-950 border-red-400'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-300'
              }`}>
                {course.approvalStatus}
              </span>

              {/* Public Badge */}
              <span className={`text-[10px] font-mono px-2 py-0.5 border font-bold ${
                course.status === CourseStatus.ACTIVE
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}>
                {course.status}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncToCloud}
              disabled={isSyncingCloud || syncStatus === 'syncing'}
              className={`px-3 py-1.5 border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${
                syncStatus === 'syncing' || isSyncingCloud
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-400 text-amber-900'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-900'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-400 text-blue-900'
              }`}
              title="Penyegerakan automatik ke Cloud Firestore aktif setiap kali data dikemas kini. Klik untuk segerak manual segera."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' || isSyncingCloud ? 'animate-spin text-amber-600' : syncStatus === 'synced' ? 'text-emerald-600' : 'text-blue-600'}`} />
              <div className="flex items-center gap-1.5">
                <span>
                  {syncStatus === 'syncing' || isSyncingCloud 
                    ? 'Auto-Sync: Menyegerak...' 
                    : 'Auto-Sync: Aktif'}
                </span>
                {lastSyncedTime && (
                  <span className="text-[10px] opacity-75 font-mono hidden sm:inline">
                    ({lastSyncedTime})
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Pusat Operasi Live</span>
            </button>

            <button
              onClick={onOpenPublicPreview}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-400 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Paparan Peserta</span>
            </button>

            {canSubmit && (
              <button
                onClick={onSubmitForReview}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Hantar Semakan</span>
              </button>
            )}
          </div>
        </div>

        {cloudSyncNotice && (
          <div className="p-2.5 bg-blue-50 border-2 border-blue-600 text-blue-950 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{cloudSyncNotice}</span>
            </div>
            <button
              onClick={() => setCloudSyncNotice(null)}
              className="text-blue-700 hover:text-blue-900 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Course Title and Meta */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight leading-tight">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatDateRangeDMY(course.startDate, course.endDate)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-zinc-500" />
              <span>{course.venue} ({course.venueDetails?.hallName || 'Dewan'})</span>
            </span>
            <span>•</span>
            <span>Anjuran: {currentOrganizer.name} ({currentOrganizer.shortName})</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200 overflow-x-auto pt-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? tab.highlight 
                      ? 'border-amber-500 text-zinc-950 bg-amber-50 font-black'
                      : 'border-zinc-900 text-zinc-900 bg-zinc-100'
                    : tab.highlight
                    ? 'border-transparent text-amber-900 hover:bg-amber-50/60'
                    : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (tab.highlight ? 'text-amber-600' : 'text-zinc-900') : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <CourseOverviewTab
          course={course}
          enrollments={enrollments}
          sessions={sessions}
          announcements={announcements}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onSubmitForReview={onSubmitForReview}
          onOpenPublicPreview={onOpenPublicPreview}
        />
      )}

      {activeTab === 'operations' && (
        <LiveOperationsTab
          course={course}
          scheduleDays={scheduleDays}
          sessions={sessions}
          announcements={announcements}
          enrollments={enrollments.map(e => e.enrollment)}
          onUpdateSession={onSaveSession}
          onSaveAnnouncement={onSaveAnnouncement}
          onDeleteAnnouncement={onDeleteAnnouncement}
          onOpenPublicPreview={onOpenPublicPreview}
          onNavigateToScheduleTab={() => setActiveTab('schedule')}
          onNavigateToAnnouncementsTab={() => setActiveTab('announcements')}
        />
      )}

      {activeTab === 'documents' && (
        <SourceDocumentsTab
          course={course}
          currentUser={{
            id: currentOrganizer.id,
            name: currentOrganizer.name,
            role: UserRole.ORGANIZER_ADMIN,
            organizerId: currentOrganizer.id,
          }}
          onCourseUpdated={onUpdateCourse}
        />
      )}

      {activeTab === 'info' && (
        <CourseInfoTab
          course={course}
          onUpdateCourse={onUpdateCourse}
          onRequestOfficialChange={onRequestOfficialChange}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab
          course={course}
          enrollments={enrollments}
          onSaveParticipant={onSaveParticipant}
          onDeleteParticipant={onDeleteParticipant}
          onBulkDeleteParticipants={onBulkDeleteParticipants}
          onUpdateAllocations={onUpdateAllocations}
          onBulkImportParticipants={onBulkImportParticipants}
          onRestoreBackup={onRestoreBackup}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceTab
          course={course}
          enrollments={enrollments}
          scheduleDays={scheduleDays}
          sessions={sessions}
          attendanceRecords={attendanceRecords}
          authContext={authContext}
          onSaveAttendance={onSaveAttendance}
          onBulkSaveAttendance={onBulkSaveAttendance}
          onDeleteAttendance={onDeleteAttendance}
          onUpdateParticipantStatus={onUpdateParticipantStatus}
          onUpdateAttendanceConfig={onUpdateAttendanceConfig}
        />
      )}

      {activeTab === 'schedule' && (
        <ScheduleTab
          course={course}
          scheduleDays={scheduleDays}
          sessions={sessions}
          onSaveDay={onSaveDay}
          onDeleteDay={onDeleteDay}
          onSaveSession={onSaveSession}
          onDeleteSession={onDeleteSession}
          onBulkImportSessions={onBulkImportSessions}
          onPublishAnnouncement={onSaveAnnouncement}
        />
      )}

      {activeTab === 'resources' && (
        <ResourcesTab
          course={course}
          resources={resources}
          sessions={sessions}
          onSaveResource={onSaveResource}
          onDeleteResource={onDeleteResource}
          onPublishAnnouncement={onSaveAnnouncement}
        />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementsTab
          course={course}
          announcements={announcements}
          sessions={sessions}
          resources={resources}
          onSaveAnnouncement={onSaveAnnouncement}
          onDeleteAnnouncement={onDeleteAnnouncement}
        />
      )}

      {activeTab === 'accommodation' && (
        <AccommodationTab
          course={course}
          enrollments={enrollments}
          onUpdateCourse={onUpdateCourse}
          onUpdateAllocations={onUpdateAllocations}
        />
      )}

      {activeTab === 'logistics' && (
        <LogisticsTab
          course={course}
          onUpdateCourse={onUpdateCourse}
        />
      )}

      {activeTab === 'audit' && (
        <CourseAuditTab
          course={course}
          auditLogs={auditLogs}
        />
      )}
    </div>
  );
};
