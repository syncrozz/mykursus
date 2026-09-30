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
import { OrganizerAuthModal } from './components/Organizer/OrganizerAuthModal';
import { OrganizerLockedGate } from './components/Organizer/OrganizerLockedGate';
import { ParticipantGateway } from './components/Participant/ParticipantGateway';
import { SupportModal } from './components/Support/SupportModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { Compass, Cloud } from 'lucide-react';
import { testFirebaseConnection } from './services/firebase';

export default function App() {
  // Global Mode: Organizer Workspace (Part 04) vs Master Admin (Part 03) vs Participant Experience (Part 05) vs Architecture Specs (Part 01-02)
  const [appMode, setAppMode] = useState<'organizer' | 'participant' | 'admin' | 'architecture'>('organizer');
  const [activeParticipantSlug, setActiveParticipantSlug] = useState<string>('');
  const [isFirebaseOnline, setIsFirebaseOnline] = useState<boolean>(false);

  // Master Admin Sub-views: Dashboard | Courses | Organizers | Changes | Audit | Detail | Architecture
  const [adminView, setAdminView] = useState<'dashboard' | 'courses' | 'organizers' | 'changes' | 'audit' | 'detail' | 'architecture'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [initialCourseApprovalFilter, setInitialCourseApprovalFilter] = useState<ApprovalStatus | undefined>(undefined);

  // Security & Authentication State
  const [isMasterAdminUnlocked, setIsMasterAdminUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mykursus_master_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isOrganizerUnlocked, setIsOrganizerUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mykursus_organizer_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [showOrganizerAuthModal, setShowOrganizerAuthModal] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.MASTER_ADMIN);

  const handleUnlockMasterAdmin = () => {
    setIsMasterAdminUnlocked(true);
    try {
      sessionStorage.setItem('mykursus_master_admin_unlocked', 'true');
    } catch {
      // ignore
    }
    setShowAuthModal(false);
    setAppMode('admin');
  };

  const handleLockMasterAdmin = () => {
    setIsMasterAdminUnlocked(false);
    try {
      sessionStorage.removeItem('mykursus_master_admin_unlocked');
    } catch {
      // ignore
    }
  };

  const handleUnlockOrganizer = (authenticatedOrg?: Organizer) => {
    setIsOrganizerUnlocked(true);
    try {
      sessionStorage.setItem('mykursus_organizer_unlocked', 'true');
      if (authenticatedOrg?.id) {
        localStorage.setItem('mykursus_active_organizer_id', authenticatedOrg.id);
        window.dispatchEvent(new CustomEvent('mykursus_data_changed', { detail: { key: 'organizer_switch' } }));
      }
    } catch {
      // ignore
    }
    setShowOrganizerAuthModal(false);
    setAppMode('organizer');
  };

  const handleLockOrganizer = () => {
    setIsOrganizerUnlocked(false);
    try {
      sessionStorage.removeItem('mykursus_organizer_unlocked');
    } catch {
      // ignore
    }
  };

  // Public Course Preview State (Option A)
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Support Experience Modal State
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);

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

    // Listen to real-time storage changes across components, Firestore updates, and browser tabs
    const handleDataChanged = () => {
      reloadData();
    };
    window.addEventListener('mykursus_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    // Verify Firebase connection on app boot
    testFirebaseConnection().then(res => {
      if (res.success) {
        setIsFirebaseOnline(true);
      }
    });

    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // Check if initial URL points to a specific mode (admin or organizer)
    const modeParam = searchParams.get('mode');
    if (modeParam === 'admin' || hash === '#admin' || hash === '#/admin') {
      const isUnlocked = sessionStorage.getItem('mykursus_master_admin_unlocked') === 'true';
      if (!isUnlocked) {
        setShowAuthModal(true);
      } else {
        setAppMode('admin');
      }
      return;
    }
    if (modeParam === 'organizer' || hash === '#organizer' || hash === '#/organizer') {
      const isUnlocked = sessionStorage.getItem('mykursus_organizer_unlocked') === 'true';
      if (!isUnlocked) {
        setShowOrganizerAuthModal(true);
      } else {
        setAppMode('organizer');
      }
      return;
    }

    // Check if initial URL points to a public course slug
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
        if (potentialSlug && !['admin', 'organizer', 'participant', 'architecture'].includes(potentialSlug)) {
          initialSlug = potentialSlug;
        }
      } else if (path.length > 1 && !path.includes('.') && !path.startsWith('/api/')) {
        // Direct root path like /kursus-transformasi-kiar-2026
        const potentialPathSlug = path.replace(/^\/+/, '').split('/')[0].trim();
        if (potentialPathSlug && !['admin', 'organizer', 'participant', 'architecture'].includes(potentialPathSlug)) {
          initialSlug = potentialPathSlug;
        }
      }
    }

    if (initialSlug) {
      const cleanSlug = initialSlug.replace(/\/+$/, '').split('?')[0].split('#')[0].toLowerCase();
      setActiveParticipantSlug(cleanSlug);
      setAppMode('participant');
    }

    return () => {
      window.removeEventListener('mykursus_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  // --- Handlers for Governance Actions ---
  const handleClearAllData = () => {
    if (window.confirm('Adakah anda pasti mahu mengosongkan semua data platform ("Empty Means Empty")?')) {
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
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              Platform Pengurusan Kursus & Akses Peserta
            </p>
          </div>
        </div>

        {/* Top-Right Navigation & Mode Switchers */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Active Mode Indicator if inside Organizer or Master Admin */}
          {appMode === 'organizer' && (
            <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border-2 border-emerald-700 flex items-center gap-1.5 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mod: Penganjur</span>
            </div>
          )}
          {appMode === 'admin' && (
            <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border-2 border-blue-700 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Mod: Master Admin</span>
            </div>
          )}

          {/* Participant Experience Mode Switcher (PART 05) */}
          <button
            onClick={() => {
              const activeCourses = platformStorage.getCourses();
              if (activeCourses.length > 0 && !activeParticipantSlug) {
                setActiveParticipantSlug(activeCourses[0].slug);
              }
              setAppMode('participant');
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              appMode === 'participant'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Paparan Peserta</span>
          </button>

          {/* Firebase Status Badge */}
          <button 
            type="button"
            onClick={() => setShowFirebaseModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-zinc-900 bg-amber-50 hover:bg-amber-100 text-zinc-800 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
            title={`Pangkalan Data Firebase Firestore: ${isFirebaseOnline ? 'Terhubung (Klik untuk urus/segerak)' : 'Menyambung (Klik untuk info)'}`}
          >
            <Cloud className={`w-4 h-4 ${isFirebaseOnline ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className="hidden md:inline text-[11px] font-mono font-bold">
              {isFirebaseOnline ? 'Cloud: Aktif' : 'Cloud: Sambung'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isFirebaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          </button>

          {/* Organizer Access / Lock Indicator */}
          <button
            id="btn-nav-lock-organizer"
            onClick={() => {
              if (isOrganizerUnlocked) {
                if (appMode !== 'organizer') {
                  setAppMode('organizer');
                } else {
                  handleLockOrganizer();
                }
              } else {
                setShowOrganizerAuthModal(true);
              }
            }}
            title={isOrganizerUnlocked ? (appMode === 'organizer' ? 'Kunci Ruang Penganjur' : 'Buka Ruang Penganjur') : 'Buka Ruang Penganjur (Perlu PIN)'}
            className={`p-1.5 border-2 border-zinc-900 transition-colors cursor-pointer flex items-center justify-center ${
              appMode === 'organizer'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : isOrganizerUnlocked
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-amber-600'
            }`}
          >
            {isOrganizerUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>

          {/* Master Admin Access / Lock Indicator */}
          <button
            id="btn-nav-lock-admin"
            onClick={() => {
              if (isMasterAdminUnlocked) {
                if (appMode !== 'admin') {
                  setAppMode('admin');
                } else {
                  handleLockMasterAdmin();
                }
              } else {
                setShowAuthModal(true);
              }
            }}
            title={isMasterAdminUnlocked ? (appMode === 'admin' ? 'Kunci Master Admin' : 'Buka Master Admin') : 'Buka Master Admin (PIN Keselamatan)'}
            className={`p-1.5 border-2 border-zinc-900 transition-colors cursor-pointer flex items-center justify-center relative ${
              appMode === 'admin'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : isMasterAdminUnlocked
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            {isMasterAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 text-red-600" />}
            {pendingApprovalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main App Body */}
      {appMode === 'participant' ? (
        /* Participant Experience (PART 05) */
        <ParticipantGateway
          initialSlug={activeParticipantSlug || undefined}
          onNavigateToOrganizer={() => {
            if (!isOrganizerUnlocked) {
              setShowOrganizerAuthModal(true);
            } else {
              setAppMode('organizer');
            }
          }}
          onNavigateToAdmin={() => {
            if (!isMasterAdminUnlocked) {
              setShowAuthModal(true);
            } else {
              setAppMode('admin');
            }
          }}
        />
      ) : (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {appMode === 'organizer' ? (
            !isOrganizerUnlocked ? (
              /* Locked Organizer Gate Screen */
              <OrganizerLockedGate
                onUnlockSuccess={handleUnlockOrganizer}
                onNavigateToParticipant={() => setAppMode('participant')}
              />
            ) : (
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
                onLockOrganizer={handleLockOrganizer}
              />
            )
          ) : appMode === 'admin' ? (
          !isMasterAdminUnlocked ? (
            /* Locked State Screen */
            <div className="bg-white border-2 border-zinc-900 p-8 text-center max-w-md mx-auto my-12 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-4">
              <div className="w-12 h-12 bg-zinc-900 text-white mx-auto flex items-center justify-center border border-zinc-700">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-black uppercase text-zinc-950">
                Master Admin Dilindungi
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Modul tadbir urus dan kawalan platform MyKursus dilindungi oleh tapisan keselamatan pentadbir. Sila sahkan identiti dengan PIN keselamatan.
              </p>
              <button
                id="btn-trigger-admin-pin"
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 bg-zinc-900 text-white text-xs font-black uppercase tracking-wider border-2 border-zinc-900 hover:bg-zinc-800 flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              >
                <Lock className="w-4 h-4" />
                <span>Masukkan PIN Keselamatan</span>
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
                onLock={handleLockMasterAdmin}
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

              {adminView === 'architecture' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-900 p-4 text-xs text-blue-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold uppercase tracking-wider block">Dokumentasi Seni Bina Platform</span>
                      <span>Spesifikasi dalaman teknikal dan struktur aliran data MyKursus.my di bawah kawalan Master Admin.</span>
                    </div>
                  </div>
                  <ArchitectureViewer />
                </div>
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
          onUpdateCourse={(updated) => {
            setPreviewCourse(updated);
            setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
          }}
        />
      )}

      {/* Security Auth Modal for Organizer PIN Verification (1234) */}
      <OrganizerAuthModal
        isOpen={showOrganizerAuthModal}
        onClose={() => setShowOrganizerAuthModal(false)}
        onSuccess={handleUnlockOrganizer}
      />

      {/* Security Auth Modal for Master Admin */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleUnlockMasterAdmin}
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
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <button
              id="footer-nav-organizer"
              type="button"
              onClick={() => {
                if (!isOrganizerUnlocked) setShowOrganizerAuthModal(true);
                else setAppMode('organizer');
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer hidden sm:inline"
              title="Akses Ruang Penganjur"
            >
              Penganjur
            </button>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <button
              id="footer-nav-admin"
              type="button"
              onClick={() => {
                if (!isMasterAdminUnlocked) setShowAuthModal(true);
                else setAppMode('admin');
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer hidden sm:inline"
              title="Akses Master Admin"
            >
              Pentadbir
            </button>
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

      {/* Firebase Diagnostics & Cloud Sync Modal */}
      <FirebaseStatusModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        isFirebaseOnline={isFirebaseOnline}
        onConnectionChange={(online) => setIsFirebaseOnline(online)}
        onDataReload={reloadData}
      />
    </div>
  );
}
