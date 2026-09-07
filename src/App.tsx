import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ExternalLink, 
  BookOpen, 
  Layers, 
  Database,
  ArrowRight,
  Eye
} from 'lucide-react';
import { 
  UserRole, 
  Course, 
  Organizer, 
  ApprovalChangeRequest, 
  AuditLog, 
  CourseStatus, 
  ApprovalStatus 
} from './types';
import { platformStorage } from './services/storage';
import { AdminHeader } from './components/MasterAdmin/AdminHeader';
import { AdminDashboard } from './components/MasterAdmin/AdminDashboard';
import { CourseOversight } from './components/MasterAdmin/CourseOversight';
import { CourseDetailReview } from './components/MasterAdmin/CourseDetailReview';
import { OrganizerManagement } from './components/MasterAdmin/OrganizerManagement';
import { ChangeRequestsReview } from './components/MasterAdmin/ChangeRequestsReview';
import { AuditLogViewer } from './components/MasterAdmin/AuditLogViewer';
import { AuthModal } from './components/MasterAdmin/AuthModal';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { PublicCourseViewer } from './components/PublicCourseViewer';
import { OrganizerWorkspace } from './components/Organizer/OrganizerWorkspace';
import { ParticipantGateway } from './components/Participant/ParticipantGateway';
import { SupportModal } from './components/Support/SupportModal';
import { Compass, Cloud } from 'lucide-react';
import { testFirebaseConnection } from './services/firebase';

export default function App() {
  // Global Mode: Organizer Workspace (Part 04) vs Master Admin (Part 03) vs Participant Experience (Part 05) vs Architecture Specs (Part 01-02)
  const [appMode, setAppMode] = useState<'organizer' | 'participant' | 'admin' | 'architecture'>('organizer');
  const [activeParticipantSlug, setActiveParticipantSlug] = useState<string>('');
  const [isFirebaseOnline, setIsFirebaseOnline] = useState<boolean>(false);

  // Master Admin Sub-views: Dashboard | Courses | Organizers | Changes | Audit | Detail
  const [adminView, setAdminView] = useState<'dashboard' | 'courses' | 'organizers' | 'changes' | 'audit' | 'detail'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [initialCourseApprovalFilter, setInitialCourseApprovalFilter] = useState<ApprovalStatus | undefined>(undefined);

  // Security & Authentication State
  const [isMasterAdminUnlocked, setIsMasterAdminUnlocked] = useState<boolean>(true); // Default open in sandbox, can lock to test PIN 5313
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.MASTER_ADMIN);

  // Public Course Preview State (Option A)
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Support Experience Modal State
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Synchronized Storage State
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [changeRequests, setChangeRequests] = useState<ApprovalChangeRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const reloadData = () => {
    setCourses(platformStorage.getCourses());
    setOrganizers(platformStorage.getOrganizers());
    setChangeRequests(platformStorage.getChangeRequests());
    setAuditLogs(platformStorage.getAuditLogs());

    // Update currently selected course if open
    if (selectedCourse) {
      const refreshed = platformStorage.getCourseById(selectedCourse.id);
      setSelectedCourse(refreshed || null);
    }
  };

  useEffect(() => {
    reloadData();

    // Verify Firebase connection on app boot
    testFirebaseConnection().then(res => {
      if (res.success) {
        setIsFirebaseOnline(true);
      }
    });

    // Check if initial URL points to a public course slug
    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    let initialSlug = 
      searchParams.get('course') || 
      searchParams.get('c') || 
      searchParams.get('slug') || 
      '';

    if (!initialSlug) {
      if (path.startsWith('/course/')) {
        initialSlug = path.replace('/course/', '').trim();
      } else if (hash.startsWith('#/course/')) {
        initialSlug = hash.replace('#/course/', '').trim();
      } else if (hash.startsWith('#course/')) {
        initialSlug = hash.replace('#course/', '').trim();
      } else if (hash.startsWith('#/')) {
        const potentialSlug = hash.replace('#/', '').trim();
        if (potentialSlug && !['admin', 'organizer', 'participant'].includes(potentialSlug)) {
          initialSlug = potentialSlug;
        }
      }
    }

    if (initialSlug) {
      const cleanSlug = initialSlug.replace(/\/+$/, '').split('?')[0].split('#')[0].toLowerCase();
      setActiveParticipantSlug(cleanSlug);
      setAppMode('participant');
    }
  }, []);

  // --- Handlers for Governance Actions ---
  const handleLoadPilotData = () => {
    platformStorage.loadKiarPilot();
    reloadData();
  };

  const handleClearAllData = () => {
    if (window.confirm('Adakah anda pasti mahu mengosongkan semua data platform mengikut DCOREV1 ("Empty Means Empty")?')) {
      platformStorage.clearAllData();
      setSelectedCourse(null);
      reloadData();
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setAdminView('detail');
  };

  const handleApproveCourse = (courseId: string, notes?: string) => {
    platformStorage.approveCourse(courseId, notes);
    reloadData();
  };

  const handleRequestChanges = (courseId: string, notes: string) => {
    platformStorage.requestChanges(courseId, notes);
    reloadData();
  };

  const handleRejectCourse = (courseId: string, notes: string) => {
    platformStorage.rejectCourse(courseId, notes);
    reloadData();
  };

  const handleUpdateCourseStatus = (courseId: string, newStatus: CourseStatus) => {
    platformStorage.updateCourseStatus(courseId, newStatus);
    reloadData();
  };

  const handleToggleFeaturedActive = (courseId: string) => {
    platformStorage.toggleFeaturedActive(courseId);
    reloadData();
  };

  const handleUpdateDates = (courseId: string, startDate: string, endDate: string) => {
    platformStorage.updateOfficialDates(courseId, startDate, endDate);
    reloadData();
  };

  const handleUpdateVenue = (courseId: string, venueName: string, venueAddress?: string) => {
    platformStorage.updateOfficialVenue(courseId, venueName, venueAddress);
    reloadData();
  };

  const handleAssignOrganizer = (courseId: string, organizerId: string) => {
    platformStorage.assignOrganizer(courseId, organizerId);
    reloadData();
  };

  const handleUpdateSlug = (courseId: string, newSlug: string) => {
    platformStorage.updateSlug(courseId, newSlug);
    reloadData();
  };

  const handleDeleteCourse = (courseId: string) => {
    platformStorage.deleteCourse(courseId);
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(null);
      setAdminView('courses');
    }
    reloadData();
  };

  const handleSaveOrganizer = (organizer: Organizer) => {
    platformStorage.saveOrganizer(organizer);
    reloadData();
  };

  const handleDeleteOrganizer = (id: string) => {
    try {
      platformStorage.deleteOrganizer(id);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReviewChangeRequest = (crId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    platformStorage.reviewChangeRequest(crId, status, comment);
    reloadData();
  };

  const pendingApprovalCount = courses.filter(c => c.approvalStatus === ApprovalStatus.SUBMITTED).length;
  const pendingChangesCount = changeRequests.filter(cr => cr.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col selection:bg-zinc-200">
      {/* Platform Top Header */}
      <header className="bg-white border-b-2 border-zinc-900 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-950 text-white flex items-center justify-center font-black text-sm tracking-tighter">
            MK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950">
                MyKursus
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-zinc-900 text-white uppercase">
                DCOREV1
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              Platform Pengurusan Kursus & Akses Peserta Berpusat
            </p>
          </div>
        </div>

        {/* Top-Right Navigation & Mode Switchers */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Participant Experience Mode Switcher (PART 05) */}
          <button
            onClick={() => {
              const currentCourses = platformStorage.getCourses();
              if (currentCourses.length === 0) {
                platformStorage.loadKiarPilot();
                reloadData();
              }
              const activeCourses = platformStorage.getCourses();
              if (activeCourses.length > 0 && !activeParticipantSlug) {
                setActiveParticipantSlug(activeCourses[0].slug);
              }
              setAppMode('participant');
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
              appMode === 'participant'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Paparan Peserta</span>
          </button>

          {/* Organizer Workspace (Part 04) */}
          <button
            onClick={() => setAppMode('organizer')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
              appMode === 'organizer'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Ruang Penganjur</span>
          </button>

          {/* Master Admin Mode Switcher */}
          <button
            onClick={() => {
              if (!isMasterAdminUnlocked) {
                setShowAuthModal(true);
              } else {
                setAppMode('admin');
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
              appMode === 'admin'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Master Admin</span>
            {pendingApprovalCount > 0 && (
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setAppMode('architecture')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
              appMode === 'architecture'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Layers className="w-4 h-4 text-zinc-500" />
            <span className="hidden sm:inline">Seni Bina</span>
            <span>DCOREV1</span>
          </button>

          {/* Firebase Status Badge */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border-2 border-zinc-900 bg-amber-50 text-zinc-800"
            title="Pangkalan Data Firebase Firestore Aktif (Projek: ultimate-quote-w40ks)"
          >
            <Cloud className={`w-3.5 h-3.5 ${isFirebaseOnline ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className="font-bold text-[10px]">
              {isFirebaseOnline ? 'Firebase: Sedia' : 'Firebase: Menyambung'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isFirebaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>

          {/* Lock / Unlock status indicator */}
          <button
            onClick={() => {
              if (isMasterAdminUnlocked) {
                setIsMasterAdminUnlocked(false);
                alert('Master Admin telah dikunci. Sila masukkan PIN 5313 untuk membuka semula.');
              } else {
                setShowAuthModal(true);
              }
            }}
            title={isMasterAdminUnlocked ? 'Kunci Master Admin' : 'Buka Kunci Master Admin'}
            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 text-zinc-700"
          >
            {isMasterAdminUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-600" />}
          </button>
        </div>
      </header>

      {/* Main App Body */}
      {appMode === 'participant' ? (
        /* Participant Experience (PART 05) */
        <ParticipantGateway
          initialSlug={activeParticipantSlug || (courses.length > 0 ? courses[0].slug : undefined)}
          onNavigateToOrganizer={() => setAppMode('organizer')}
          onNavigateToAdmin={() => setAppMode('admin')}
        />
      ) : (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {appMode === 'organizer' ? (
            /* Organizer Workspace (PART 04) */
            <OrganizerWorkspace
              onSwitchToMasterAdmin={() => {
                if (!isMasterAdminUnlocked) {
                  setShowAuthModal(true);
                } else {
                  setAppMode('admin');
                }
              }}
              onOpenPublicPreview={(course) => {
                setActiveParticipantSlug(course.slug);
                setAppMode('participant');
              }}
            />
          ) : appMode === 'admin' ? (
          !isMasterAdminUnlocked ? (
            /* Locked State Screen */
            <div className="bg-white border-2 border-zinc-900 p-8 text-center max-w-md mx-auto my-12 shadow-md space-y-4">
              <div className="w-12 h-12 bg-zinc-900 text-white mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-zinc-950">
                Master Admin Dikunci
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Modul tadbir urus dan kawalan platform MyKursus dilindungi oleh kebenaran keselamatan mengikut DCOREV1.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 hover:bg-zinc-800"
              >
                Masukkan PIN Kebenaran
              </button>
            </div>
          ) : (
            /* Master Admin Control Center */
            <div className="flex flex-col gap-6">
              <AdminHeader
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
                activeView={adminView === 'detail' ? 'courses' : adminView}
                onNavigate={(v) => {
                  setSelectedCourse(null);
                  setAdminView(v);
                }}
                onLock={() => setIsMasterAdminUnlocked(false)}
                onLoadPilot={handleLoadPilotData}
                onClearAll={handleClearAllData}
                pendingCount={pendingApprovalCount}
                changesCount={pendingChangesCount}
              />

              {/* View Routing */}
              {adminView === 'dashboard' && (
                <AdminDashboard
                  courses={courses}
                  organizers={organizers}
                  changeRequests={changeRequests}
                  onSelectCourse={handleSelectCourse}
                  onNavigateToCourses={(filterApproval) => {
                    setInitialCourseApprovalFilter(filterApproval);
                    setAdminView('courses');
                  }}
                  onNavigateToOrganizers={() => setAdminView('organizers')}
                  onNavigateToChanges={() => setAdminView('changes')}
                  onLoadPilot={handleLoadPilotData}
                />
              )}

              {adminView === 'courses' && (
                <CourseOversight
                  courses={courses}
                  organizers={organizers}
                  onSelectCourse={handleSelectCourse}
                  onToggleFeatured={handleToggleFeaturedActive}
                  onDeleteCourse={handleDeleteCourse}
                  initialApprovalFilter={initialCourseApprovalFilter}
                />
              )}

              {adminView === 'organizers' && (
                <OrganizerManagement
                  organizers={organizers}
                  courses={courses}
                  currentRole={currentRole}
                  onSaveOrganizer={handleSaveOrganizer}
                  onDeleteOrganizer={handleDeleteOrganizer}
                  onSelectCourse={handleSelectCourse}
                />
              )}

              {adminView === 'changes' && (
                <ChangeRequestsReview
                  changeRequests={changeRequests}
                  currentRole={currentRole}
                  onReviewChangeRequest={handleReviewChangeRequest}
                />
              )}

              {adminView === 'audit' && (
                <AuditLogViewer logs={auditLogs} />
              )}

              {adminView === 'detail' && selectedCourse && (
                <CourseDetailReview
                  course={selectedCourse}
                  organizers={organizers}
                  enrollments={platformStorage.getEnrollmentsByCourseId(selectedCourse.id)}
                  sessions={platformStorage.getSessionsByCourseId(selectedCourse.id)}
                  scheduleDays={platformStorage.getScheduleDaysByCourseId(selectedCourse.id)}
                  changeRequests={changeRequests.filter(cr => cr.courseId === selectedCourse.id)}
                  currentRole={currentRole}
                  onBack={() => setAdminView('courses')}
                  onApprove={handleApproveCourse}
                  onRequestChanges={handleRequestChanges}
                  onReject={handleRejectCourse}
                  onUpdateStatus={handleUpdateCourseStatus}
                  onToggleFeatured={handleToggleFeaturedActive}
                  onUpdateDates={handleUpdateDates}
                  onUpdateVenue={handleUpdateVenue}
                  onAssignOrganizer={handleAssignOrganizer}
                  onUpdateSlug={handleUpdateSlug}
                  onReviewChangeRequest={handleReviewChangeRequest}
                />
              )}
            </div>
          )
        ) : (
          /* Architecture Specs View */
          <ArchitectureViewer />
        )}
      </main>
      )}

      {/* Option A Public Participant Course Modal Preview */}
      {previewCourse && (
        <PublicCourseViewer
          course={previewCourse}
          enrollments={platformStorage.getEnrollmentsByCourseId(previewCourse.id)}
          sessions={platformStorage.getSessionsByCourseId(previewCourse.id)}
          scheduleDays={platformStorage.getScheduleDaysByCourseId(previewCourse.id)}
          announcements={platformStorage.getAnnouncementsByCourseId(previewCourse.id)}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {/* Security Auth Modal for PIN Verification */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setIsMasterAdminUnlocked(true);
          setShowAuthModal(false);
          setAppMode('admin');
        }}
      />

      {/* Platform Standard Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-3.5 pb-16 sm:pb-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            <span>
              Developed by{' '}
              <a
                href="https://www.syncrozz.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Syncrozz
              </a>
            </span>
            <a
              href="https://wa.me/60145313756"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Syncrozz"
              title="Hubungi melalui WhatsApp"
              className="inline-flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <img
                src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/MAIN/Logo%20Whatapp%20v2.png"
                alt="WhatsApp"
                className="w-5 h-5 object-contain"
                loading="lazy"
              />
            </a>
          </div>

          <button
            id="footer-support-btn"
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/5 text-white/50 text-[11px] font-normal hover:text-white/80 hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <span>Support</span>
            <span className="text-rose-400/60">❤️</span>
          </button>
        </div>
      </footer>

      {/* SYNCROZZ Support Experience Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}
