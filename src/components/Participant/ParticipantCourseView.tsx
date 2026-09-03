import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Bell, 
  Wifi, 
  Building, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  Users, 
  HelpCircle, 
  Compass, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  BedDouble,
  X,
  Radio,
  Eye,
  Filter
} from 'lucide-react';
import { 
  Course, 
  ScheduleDay, 
  SessionItem, 
  Announcement, 
  CourseModuleKey, 
  ApprovalStatus, 
  CourseStatus,
  VerifiedParticipantData 
} from '../../types';
import { platformStorage } from '../../services/storage';
import { calculateCourseSessionStatus, parseRequirementsList } from '../../utils/courseHelpers';
import { 
  getPriorityMeta, 
  getCategoryLabel, 
  formatWhatsAppAnnouncement, 
  formatWhatsAppCourseShare 
} from '../../utils/communicationHelpers';
import { MyInformationTab } from './MyInformationTab';

interface ParticipantCourseViewProps {
  course: Course;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  announcements?: Announcement[];
  isOrganizerPreview?: boolean;
  onClosePreview?: () => void;
}

export const ParticipantCourseView: React.FC<ParticipantCourseViewProps> = ({
  course,
  scheduleDays = [],
  sessions = [],
  announcements = [],
  isOrganizerPreview = false,
  onClosePreview,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'announcements' | 'my-info' | 'logistics' | 'resources'>('overview');

  // Selected Schedule Day
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  // Participant Phone Verification Session
  const [verifiedData, setVerifiedData] = useState<VerifiedParticipantData | null>(null);

  // Copied toast indicators
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Participant Read/Unread Announcement Tracking
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [announcementFilter, setAnnouncementFilter] = useState<'ALL' | 'IMPORTANT' | 'SCHEDULE' | 'RESOURCES' | 'UNREAD'>('ALL');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [copiedAnnId, setCopiedAnnId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Interactive Checklist State (persisted locally per course)
  const [checklistItems, setChecklistItems] = useState<Array<{ text: string; done: boolean }>>([]);

  // Live session status
  const sessionStatus = calculateCourseSessionStatus(course, scheduleDays, sessions);

  // Load verified participant session & read announcement status from storage on mount
  useEffect(() => {
    const saved = platformStorage.getParticipantSession(course.id);
    if (saved) {
      setVerifiedData(saved);
    }
    setReadAnnouncementIds(platformStorage.getReadAnnouncementIds(course.id));
  }, [course.id]);

  // Initialize interactive checklist from course instructions
  useEffect(() => {
    const storedChecklistKey = `mykursus_checklist_${course.id}`;
    const rawStored = localStorage.getItem(storedChecklistKey);
    if (rawStored) {
      try {
        setChecklistItems(JSON.parse(rawStored));
        return;
      } catch (e) {
        // fallback to parse
      }
    }

    const parsed = parseRequirementsList(course.instructions);
    if (parsed.length > 0) {
      const initial = parsed.map(text => ({ text, done: false }));
      setChecklistItems(initial);
      localStorage.setItem(storedChecklistKey, JSON.stringify(initial));
    } else {
      setChecklistItems([]);
    }
  }, [course.id, course.instructions]);

  const toggleChecklistItem = (index: number) => {
    const updated = checklistItems.map((item, idx) => 
      idx === index ? { ...item, done: !item.done } : item
    );
    setChecklistItems(updated);
    localStorage.setItem(`mykursus_checklist_${course.id}`, JSON.stringify(updated));
  };

  const handleCopyWifiPassword = (password: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  const handleCopyCourseLink = () => {
    const url = `${window.location.origin}/course/${course.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleVerified = (data: VerifiedParticipantData) => {
    setVerifiedData(data);
    platformStorage.setParticipantSession(course.id, data);
  };

  const handleLogoutParticipant = () => {
    setVerifiedData(null);
    platformStorage.clearParticipantSession(course.id);
  };

  // Check which optional modules are active
  const isModuleEnabled = (key: CourseModuleKey) => {
    return (course.modules || []).some(m => m.key === key && m.enabled);
  };

  const isAccommodationActive = isModuleEnabled(CourseModuleKey.ACCOMMODATION);
  const isResourcesActive = isModuleEnabled(CourseModuleKey.RESOURCES);
  const isApproved = course.approvalStatus === ApprovalStatus.APPROVED;

  // Filter sessions by selected day & search
  const filteredSessions = (sessions || []).filter(s => {
    const matchesDay = selectedDayNumber === 0 || s.dayNumber === selectedDayNumber;
    const matchesSearch = !scheduleSearchQuery.trim() || 
      s.title.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
      (s.facilitatorName && s.facilitatorName.toLowerCase().includes(scheduleSearchQuery.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));
    return matchesDay && matchesSearch;
  });

  // Collect public course resources from storage
  const directResources = platformStorage.getResourcesByCourseId(course.id).filter(r => r.isPublic);

  // Combine direct resources + session presentation links
  const allMaterials = [
    ...directResources.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      url: r.fileUrl,
      sessionId: r.sessionId,
      fileSizeMb: r.fileSizeMb,
      isDirect: true,
      dayNumber: undefined,
      time: undefined,
      facilitator: undefined,
    })),
    ...(sessions || [])
      .filter(s => s.presentationUrl && s.presentationUrl.trim().length > 0)
      .map(s => ({
        id: 'sess-pres-' + s.id,
        title: `Slaid Sesi ${s.sessionNumber}: ${s.title}`,
        category: 'SLIDES' as const,
        url: s.presentationUrl as string,
        sessionId: s.id,
        fileSizeMb: undefined,
        dayNumber: s.dayNumber,
        time: `${s.startTime} - ${s.endTime}`,
        facilitator: s.facilitatorName,
        isDirect: false,
      })),
  ];

  // Published announcements only - course isolated and excluding drafts
  const publishedAnnouncements = (announcements || [])
    .filter(a => a.courseId === course.id && a.status !== 'DRAFT' && a.isPublic !== false)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const unreadAnnouncements = publishedAnnouncements.filter(a => !readAnnouncementIds.includes(a.id));
  const unreadCount = unreadAnnouncements.length;

  // Active Important Alert: highest priority unread alert (URGENT or IMPORTANT)
  const activeHighAlert = publishedAnnouncements.find(
    a => (a.priority === 'URGENT' || a.priority === 'CRITICAL' || a.priority === 'IMPORTANT') && !readAnnouncementIds.includes(a.id)
  );

  const handleMarkAsRead = (id: string) => {
    platformStorage.markAnnouncementAsRead(course.id, id);
    setReadAnnouncementIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleMarkAllAsRead = () => {
    const allIds = publishedAnnouncements.map(a => a.id);
    platformStorage.markAllAnnouncementsAsRead(course.id, allIds);
    setReadAnnouncementIds(allIds);
  };

  const handleCopyAnnouncementWhatsApp = (ann: Announcement) => {
    const linkedSession = sessions.find(s => s.id === ann.relatedSessionId);
    const linkedResource = directResources.find(r => r.id === ann.relatedResourceId);
    const text = formatWhatsAppAnnouncement(course, ann, linkedSession, linkedResource);
    navigator.clipboard.writeText(text);
    setCopiedAnnId(ann.id);
    setTimeout(() => setCopiedAnnId(null), 2500);
  };

  const handleCopyCourseShare = () => {
    const text = formatWhatsAppCourseShare(course);
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  const openWhatsAppDirect = () => {
    const text = formatWhatsAppCourseShare(course);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter announcements for the Announcements Tab
  const filteredAnnouncements = publishedAnnouncements.filter(ann => {
    if (announcementFilter === 'IMPORTANT') {
      if (ann.priority !== 'IMPORTANT' && ann.priority !== 'URGENT' && ann.priority !== 'CRITICAL') return false;
    } else if (announcementFilter === 'SCHEDULE') {
      if (ann.category !== 'SCHEDULE_CHANGE' && ann.category !== 'LOCATION_CHANGE' && !ann.relatedSessionId) return false;
    } else if (announcementFilter === 'RESOURCES') {
      if (ann.category !== 'RESOURCES' && !ann.relatedResourceId) return false;
    } else if (announcementFilter === 'UNREAD') {
      if (readAnnouncementIds.includes(ann.id)) return false;
    }

    if (announcementSearch.trim()) {
      const q = announcementSearch.toLowerCase();
      const matchTitle = ann.title.toLowerCase().includes(q);
      const matchContent = ann.content.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-16">
      {/* Top Slug Bar & Status Warning if unapproved */}
      <header className="bg-zinc-950 text-white border-b-2 border-zinc-900 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-blue-600 text-white shrink-0">
              MYKURSUS
            </span>
            <span className="font-mono text-xs text-zinc-300 truncate">
              /course/{course.slug}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyCourseLink}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              title="Salin Pautan Kursus"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Pautan Disalin!' : 'Kongsi Pautan'}</span>
            </button>

            {onClosePreview && (
              <button
                onClick={onClosePreview}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-[11px] font-bold"
              >
                Tutup
              </button>
            )}
          </div>
        </div>

        {/* Governance / Preview Status Notice */}
        {!isApproved && (
          <div className="bg-amber-400 text-amber-950 px-4 py-2 text-xs font-medium border-t border-amber-500">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-900 shrink-0" />
                <span>
                  <strong>Pratonton Penganjur:</strong> Kursus berstatus <strong>{course.approvalStatus}</strong> dan belum diluluskan oleh Master Admin untuk paparan awam.
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Course Header / Identity Card */}
      <section className="bg-white border-b-2 border-zinc-900 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {course.code && (
              <span className="px-2.5 py-0.5 bg-zinc-900 text-white font-mono text-xs font-bold uppercase">
                {course.code}
              </span>
            )}
            <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
              course.status === CourseStatus.ACTIVE 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                : course.status === CourseStatus.COMPLETED
                ? 'bg-zinc-200 text-zinc-800 border-zinc-400'
                : 'bg-blue-100 text-blue-900 border-blue-300'
            }`}>
              {course.status === CourseStatus.ACTIVE ? 'Sedang Berlangsung' : course.status === CourseStatus.COMPLETED ? 'Selesai' : 'Akan Datang'}
            </span>

            {course.isFeaturedActive && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider">
                Spotlight
              </span>
            )}

            {verifiedData && (
              <span className="ml-auto px-2.5 py-0.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{verifiedData.name}</span>
              </span>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className={`${verifiedData ? '' : 'ml-auto'} px-2.5 py-1 text-xs font-bold border-2 border-zinc-900 bg-white hover:bg-zinc-100 flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-colors cursor-pointer`}
              title="Kongsi Pautan atau Teks WhatsApp Kursus"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-900" />
              <span>Kongsi</span>
            </button>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-zinc-950 leading-tight">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="text-sm sm:text-base text-zinc-600 font-medium mt-1 leading-normal">
                {course.subtitle}
              </p>
            )}
          </div>

          {/* Core Info Bar: Date, Venue, Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-zinc-200 text-xs">
            <div className="flex items-start gap-2.5 p-2 bg-zinc-50 border border-zinc-200">
              <Calendar className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Tarikh Kursus:</span>
                <span className="font-bold text-zinc-900">{course.startDate} hingga {course.endDate}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 bg-zinc-50 border border-zinc-200">
              <MapPin className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Lokasi Kursus:</span>
                <span className="font-bold text-zinc-900 truncate block">{course.venueName}</span>
                {course.venueDetails?.hallName && (
                  <span className="text-[11px] text-zinc-600 block">{course.venueDetails.hallName}</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 bg-zinc-50 border border-zinc-200 sm:col-span-2 md:col-span-1">
              <Building className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Penganjur:</span>
                <span className="font-bold text-zinc-900 truncate block">
                  {course.organizerId === 'org-ppki-01' ? 'Pusat Pembangunan Kemahiran Insaniah (PPKI)' : 'Urus Setia Penganjur Kursus'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live / Current Session Spotlight Banner */}
        <div className="bg-zinc-900 text-white border-t-2 border-zinc-900 px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {sessionStatus.currentSession ? (
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                    Sedang Berlangsung Sekarang:
                  </span>
                  <span className="font-bold text-sm text-white">
                    {sessionStatus.currentSession.title}
                  </span>
                  <span className="text-zinc-400 ml-2 font-mono">
                    ({sessionStatus.currentSession.startTime} - {sessionStatus.currentSession.endTime})
                  </span>
                </div>
              </div>
            ) : sessionStatus.nextSession ? (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                    Sesi Seterusnya:
                  </span>
                  <span className="font-bold text-sm text-white">
                    {sessionStatus.nextSession.title}
                  </span>
                  <span className="text-zinc-400 ml-2 font-mono">
                    ({sessionStatus.nextSession.startTime} - {sessionStatus.nextSession.endTime})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>{sessionStatus.statusLabel}</span>
              </div>
            )}

            <button
              onClick={() => setActiveTab('schedule')}
              className="self-start sm:self-auto text-blue-400 hover:text-white font-bold text-xs flex items-center gap-1 shrink-0"
            >
              <span>Lihat Jadual Penuh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar (Scrollable on mobile) */}
        <nav className="border-t border-zinc-200 bg-white">
          <div className="max-w-4xl mx-auto flex overflow-x-auto no-scrollbar text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Ringkasan</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Jadual & Sesi ({sessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'announcements'
                  ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Hebahan</span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse">
                  {unreadCount}
                </span>
              ) : publishedAnnouncements.length > 0 ? (
                <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-700 text-[10px] font-bold rounded-full">
                  {publishedAnnouncements.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('my-info')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'my-info'
                  ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                  : verifiedData
                  ? 'border-transparent text-emerald-700 hover:bg-emerald-50'
                  : 'border-transparent text-amber-800 hover:text-amber-950 hover:bg-amber-50'
              }`}
            >
              {verifiedData ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-700" />}
              <span>Maklumat Saya</span>
              {verifiedData && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'logistics'
                  ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Lokasi & Urus Setia</span>
            </button>

            {allMaterials.length > 0 && (
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'resources'
                    ? 'border-zinc-950 text-zinc-950 bg-zinc-50'
                    : 'border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Bahan Kursus ({allMaterials.length})</span>
              </button>
            )}
          </div>
        </nav>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* Prominent Alert Banner for Urgent/Important Announcements */}
        {activeHighAlert && (
          <div 
            className={`mb-6 p-4 border-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row items-start justify-between gap-3 ${
              activeHighAlert.priority === 'URGENT' || activeHighAlert.priority === 'CRITICAL'
                ? 'bg-red-50/90 border-red-600 text-red-950'
                : 'bg-amber-50/90 border-amber-500 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 shrink-0 border ${
                activeHighAlert.priority === 'URGENT' || activeHighAlert.priority === 'CRITICAL'
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-amber-500 text-zinc-950 border-amber-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${
                    activeHighAlert.priority === 'URGENT' || activeHighAlert.priority === 'CRITICAL'
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-amber-500 text-zinc-950 border-amber-600'
                  }`}>
                    {activeHighAlert.priority === 'URGENT' || activeHighAlert.priority === 'CRITICAL' ? 'MAKLUMAN SEGERA' : 'PERHATIAN PENTING'}
                  </span>

                  {activeHighAlert.category && (
                    <span className="text-[10px] font-mono font-bold bg-white/80 px-1.5 py-0.5 border border-zinc-300 uppercase">
                      {getCategoryLabel(activeHighAlert.category)}
                    </span>
                  )}

                  <span className="text-xs font-mono opacity-75">
                    {new Date(activeHighAlert.publishedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-sm font-black tracking-tight">
                  {activeHighAlert.title}
                </h4>

                <p className="text-xs leading-relaxed line-clamp-2">
                  {activeHighAlert.content}
                </p>

                {activeHighAlert.relatedSessionId && (() => {
                  const s = sessions.find(sess => sess.id === activeHighAlert.relatedSessionId);
                  if (!s) return null;
                  return (
                    <div className="mt-1.5 p-1.5 bg-white/90 border border-current text-[11px] font-medium flex items-center justify-between gap-2 flex-wrap">
                      <span>
                        <strong>Jadual Terkini:</strong> Hari {s.dayNumber} [Sesi {s.sessionNumber}] • {s.startTime}-{s.endTime} • {s.location || 'Dewan Utama'}
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab('schedule');
                          setSelectedDayNumber(s.dayNumber);
                        }}
                        className="text-blue-700 font-bold hover:underline shrink-0"
                      >
                        Buka Sesi dalam Jadual →
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setActiveTab('announcements')}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-current hover:bg-white/80 transition-colors"
              >
                Lihat Semua ({publishedAnnouncements.length})
              </button>
              <button
                onClick={() => handleMarkAsRead(activeHighAlert.id)}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                title="Tutup makluman ini dan tandakan sebagai telah dibaca"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tanda Dibaca</span>
              </button>
            </div>
          </div>
        )}
        {/* TAB 1: OVERVIEW & HIGHLIGHTS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Wi-Fi Banner (if provided) */}
            {course.venueDetails?.wifiSsid && (
              <div className="p-4 bg-zinc-900 text-white border-2 border-zinc-900 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-800 text-white shrink-0">
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Wi-Fi Tetamu Kursus:
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      SSID: {course.venueDetails.wifiSsid}
                    </span>
                    {course.venueDetails.wifiPassword && (
                      <span className="text-xs text-zinc-300 block font-mono">
                        Kata Laluan: {course.venueDetails.wifiPassword}
                      </span>
                    )}
                  </div>
                </div>

                {course.venueDetails.wifiPassword && (
                  <button
                    onClick={() => handleCopyWifiPassword(course.venueDetails?.wifiPassword || '')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    {copiedWifi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWifi ? 'Disalin!' : 'Salin Kata Laluan'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Unlocked Participant Status Card if already verified */}
            {verifiedData ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-700 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                    Status Anda:
                  </span>
                  <p className="text-base font-black text-emerald-950 uppercase">
                    {verifiedData.name} ({verifiedData.institutionOrAgency})
                  </p>
                  <p className="text-xs text-emerald-800 font-medium">
                    {verifiedData.roomNumber ? `Bilik Penginapan: No. ${verifiedData.roomNumber} • ` : ''}
                    {verifiedData.assignedGroup ? `Kumpulan: ${verifiedData.assignedGroup}` : 'Kumpulan Am'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('my-info')}
                  className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors shrink-0"
                >
                  Semak Maklumat Penuh
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white border-2 border-zinc-900 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                      Maklumat Bilik Hotel & Kumpulan Peserta
                    </h4>
                    <p className="text-xs text-zinc-600">
                      Masukkan nombor telefon berdaftar anda untuk melihat agihan bilik dan kumpulan bengkel anda.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('my-info')}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shrink-0"
                >
                  Sahkan Nombor Telefon
                </button>
              </div>
            )}

            {/* Description & Objectives */}
            {course.description && (
              <div className="p-5 bg-white border-2 border-zinc-900 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Mengenai Kursus Ini
                </h3>
                <p className="text-sm text-zinc-800 leading-relaxed font-normal">
                  {course.description}
                </p>

                {course.objectives && course.objectives.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                      Objektif Kursus:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-700">
                      {course.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Requirements Checklist */}
            {checklistItems.length > 0 && (
              <div className="p-5 bg-white border-2 border-zinc-900 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Keperluan & Senarai Semak Peserta
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                    {checklistItems.filter(i => i.done).length} / {checklistItems.length} Selesai
                  </span>
                </div>

                <p className="text-xs text-zinc-600">
                  Tandakan senarai keperluan berikut di telefon anda untuk memastikan persediaan lengkap sebelum dan semasa kursus:
                </p>

                <div className="space-y-2 pt-1">
                  {checklistItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      className={`w-full text-left p-3 border-2 transition-all flex items-start gap-3 cursor-pointer ${
                        item.done 
                          ? 'bg-zinc-50 border-zinc-300 text-zinc-400 line-through' 
                          : 'bg-white border-zinc-900 text-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      {item.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs font-medium leading-relaxed">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Announcements Preview */}
            {publishedAnnouncements.length > 0 && (
              <div className="p-5 bg-white border-2 border-zinc-900 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-zinc-900" />
                      <span>Hebahan Terkini ({publishedAnnouncements.length})</span>
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-600 text-white font-bold">
                        {unreadCount} BAHARU
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs text-blue-700 font-bold hover:underline"
                  >
                    Lihat Semua Hebahan →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {publishedAnnouncements.slice(0, 3).map((ann) => {
                    const isUnread = !readAnnouncementIds.includes(ann.id);
                    const meta = getPriorityMeta(ann.priority);
                    const linkedSession = sessions.find(s => s.id === ann.relatedSessionId);

                    return (
                      <div 
                        key={ann.id}
                        className={`p-3.5 border-2 transition-colors ${
                          ann.priority === 'CRITICAL' || ann.priority === 'URGENT'
                            ? 'border-red-600 bg-red-50/40'
                            : ann.priority === 'IMPORTANT'
                            ? 'border-amber-500 bg-amber-50/40'
                            : isUnread
                            ? 'border-blue-600 bg-blue-50/20'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Belum Dibaca" />
                            )}
                            <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 border ${meta.badgeBg}`}>
                              {meta.label}
                            </span>
                            {ann.category && (
                              <span className="text-[9px] font-mono font-medium text-zinc-500 uppercase">
                                • {getCategoryLabel(ann.category)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(ann.publishedAt).toLocaleDateString('ms-MY')}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-zinc-900">{ann.title}</h4>
                        <p className="text-xs text-zinc-700 mt-1 line-clamp-2 leading-relaxed">
                          {ann.content}
                        </p>

                        {linkedSession && (
                          <div className="mt-2 text-[11px] font-medium text-zinc-800 bg-white/80 p-1.5 border border-zinc-200 flex items-center justify-between gap-2">
                            <span>
                              <strong>Lokasi Terkini:</strong> {linkedSession.location || 'Dewan Utama'} ({linkedSession.startTime} - {linkedSession.endTime})
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab('schedule');
                                setSelectedDayNumber(linkedSession.dayNumber);
                              }}
                              className="text-blue-700 font-bold hover:underline shrink-0"
                            >
                              Jadual →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULE & SESSIONS */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Search & Filter Controls */}
            <div className="bg-white border-2 border-zinc-900 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Jadual & Pengisian Kursus
                </h3>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
                  <input
                    type="text"
                    value={scheduleSearchQuery}
                    onChange={(e) => setScheduleSearchQuery(e.target.value)}
                    placeholder="Cari sesi, penceramah, bilik..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white w-full sm:w-60"
                  />
                </div>
              </div>

              {/* Day Filter Switcher */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200">
                <button
                  onClick={() => setSelectedDayNumber(0)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-colors ${
                    selectedDayNumber === 0 
                      ? 'bg-zinc-900 text-white border-zinc-900' 
                      : 'bg-white text-zinc-700 border-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  Semua Hari
                </button>

                {(scheduleDays || []).map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayNumber(day.dayNumber)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-colors ${
                      selectedDayNumber === day.dayNumber
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Hari {day.dayNumber} ({day.date})
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center bg-white border-2 border-zinc-900">
                <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-900 uppercase">Tiada Sesi Dijumpai</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  {scheduleSearchQuery ? 'Cuba ubah kata kunci carian anda.' : 'Jadual bagi hari ini belum didaftarkan oleh penganjur.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group sessions by day */}
                {(scheduleDays || [])
                  .filter(d => selectedDayNumber === 0 || d.dayNumber === selectedDayNumber)
                  .map((day) => {
                    const daySessions = filteredSessions.filter(s => s.dayNumber === day.dayNumber);
                    if (daySessions.length === 0) return null;

                    return (
                      <div key={day.id} className="bg-white border-2 border-zinc-900 overflow-hidden shadow-xs">
                        {/* Day Header */}
                        <div className="p-4 bg-zinc-50 border-b-2 border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                              HARI {day.dayNumber}
                            </span>
                            <span className="text-sm font-black uppercase text-zinc-950">
                              {day.date}
                            </span>
                          </div>
                          {day.theme && (
                            <span className="text-xs text-zinc-600 font-medium italic">
                              Tema: {day.theme}
                            </span>
                          )}
                        </div>

                        {/* Day's Sessions Timeline */}
                        <div className="divide-y divide-zinc-200">
                          {daySessions.map((session) => {
                            const isCurrent = sessionStatus.currentSession?.id === session.id;
                            const isNext = sessionStatus.nextSession?.id === session.id;

                            return (
                              <div 
                                key={session.id} 
                                className={`p-4 transition-colors ${
                                  isCurrent 
                                    ? 'bg-emerald-50/60 border-l-4 border-l-emerald-600' 
                                    : isNext
                                    ? 'bg-blue-50/40 border-l-4 border-l-blue-600'
                                    : session.isBreakOrMeal
                                    ? 'bg-zinc-50/50'
                                    : 'hover:bg-zinc-50'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {isCurrent && (
                                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                          Sedang Berlangsung
                                        </span>
                                      )}
                                      {isNext && (
                                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider">
                                          Sesi Seterusnya
                                        </span>
                                      )}
                                      {session.isBreakOrMeal && (
                                        <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-700 text-[9px] font-bold uppercase">
                                          Rehat & Makan
                                        </span>
                                      )}
                                      {session.updatedAt && (
                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold uppercase">
                                          Pindaan Terkini
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-sm sm:text-base font-black text-zinc-950">
                                      {session.title}
                                    </h4>

                                    {session.description && (
                                      <p className="text-xs text-zinc-700 leading-relaxed">
                                        {session.description}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-zinc-600">
                                      {session.facilitatorName && (
                                        <span className="flex items-center gap-1 font-medium">
                                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                                          <span>{session.facilitatorName}</span>
                                        </span>
                                      )}

                                      {session.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                          <span>{session.location}</span>
                                        </span>
                                      )}
                                    </div>

                                    {session.presentationUrl && (
                                      <div className="pt-2">
                                        <a
                                          href={session.presentationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-100 border border-blue-600 text-blue-700 text-xs font-bold transition-colors"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Buka Slaid Pembentangan Sesi ↗</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  <div className="font-mono text-xs font-bold text-zinc-900 bg-white px-2.5 py-1 border-2 border-zinc-900 self-start shrink-0">
                                    {session.startTime} - {session.endTime}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANNOUNCEMENTS & NOTIFICATIONS CENTER */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {/* Header with Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-zinc-900 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-zinc-900" />
                    <span>Hebahan & Notifikasi Kursus ({publishedAnnouncements.length})</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-zinc-900 text-white">
                    SIARAN LANGSUNG
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Makluman operasi semasa, pindaan lokasi & jadual langsung daripada urus setia.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Tandakan semua hebahan sebagai telah dibaca"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tanda Semua Dibaca</span>
                  </button>
                )}

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Kongsi Maklumat Kursus ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Kongsi Hebahan</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border-2 border-zinc-900 p-3 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={announcementSearch}
                    onChange={(e) => setAnnouncementSearch(e.target.value)}
                    placeholder="Cari dalam tajuk atau kandungan hebahan..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs border border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  />
                  {announcementSearch && (
                    <button
                      onClick={() => setAnnouncementSearch('')}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  <button
                    onClick={() => setAnnouncementFilter('ALL')}
                    className={`px-2.5 py-1 font-bold whitespace-nowrap border transition-colors ${
                      announcementFilter === 'ALL'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    Semua ({publishedAnnouncements.length})
                  </button>

                  <button
                    onClick={() => setAnnouncementFilter('IMPORTANT')}
                    className={`px-2.5 py-1 font-bold whitespace-nowrap border transition-colors ${
                      announcementFilter === 'IMPORTANT'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Penting & Cemas ({publishedAnnouncements.filter(a => a.priority === 'IMPORTANT' || a.priority === 'URGENT' || a.priority === 'CRITICAL').length})
                  </button>

                  <button
                    onClick={() => setAnnouncementFilter('SCHEDULE')}
                    className={`px-2.5 py-1 font-bold whitespace-nowrap border transition-colors ${
                      announcementFilter === 'SCHEDULE'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    Jadual & Bilik ({publishedAnnouncements.filter(a => a.category === 'SCHEDULE_CHANGE' || a.category === 'LOCATION_CHANGE' || a.relatedSessionId).length})
                  </button>

                  <button
                    onClick={() => setAnnouncementFilter('RESOURCES')}
                    className={`px-2.5 py-1 font-bold whitespace-nowrap border transition-colors ${
                      announcementFilter === 'RESOURCES'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Bahan ({publishedAnnouncements.filter(a => a.category === 'RESOURCES' || a.relatedResourceId).length})
                  </button>

                  {unreadCount > 0 && (
                    <button
                      onClick={() => setAnnouncementFilter('UNREAD')}
                      className={`px-2.5 py-1 font-bold whitespace-nowrap border transition-colors ${
                        announcementFilter === 'UNREAD'
                          ? 'bg-red-600 text-white border-red-700'
                          : 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
                      }`}
                    >
                      Belum Dibaca ({unreadCount})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Announcements List */}
            {publishedAnnouncements.length === 0 ? (
              <div className="p-12 text-center bg-white border-2 border-zinc-900 shadow-xs">
                <Bell className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-900 uppercase">Tiada Pengumuman Buat Masa Ini</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Sebarang pengumuman operasi langsung atau pindaan bilik dan jadual daripada urus setia akan disiarkan secara terus di sini.
                </p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="p-8 text-center bg-white border-2 border-zinc-900 shadow-xs space-y-3">
                <p className="text-xs text-zinc-600 font-medium">
                  Tiada hebahan sepadan dengan carian atau kriteria penapis yang dipilih.
                </p>
                <button
                  onClick={() => {
                    setAnnouncementFilter('ALL');
                    setAnnouncementSearch('');
                  }}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
                >
                  Set Semula Penapis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((ann) => {
                  const isUnread = !readAnnouncementIds.includes(ann.id);
                  const meta = getPriorityMeta(ann.priority);
                  const linkedSession = sessions.find(s => s.id === ann.relatedSessionId);
                  const linkedResource = directResources.find(r => r.id === ann.relatedResourceId);

                  return (
                    <div
                      key={ann.id}
                      className={`p-5 bg-white border-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3 transition-colors ${
                        ann.priority === 'CRITICAL' || ann.priority === 'URGENT'
                          ? 'border-red-600 bg-red-50/20'
                          : ann.priority === 'IMPORTANT'
                          ? 'border-amber-500 bg-amber-50/20'
                          : isUnread
                          ? 'border-blue-600 bg-blue-50/10'
                          : 'border-zinc-900'
                      }`}
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isUnread && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-black uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              BAHARU
                            </span>
                          )}

                          <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${meta.badgeBg}`}>
                            {meta.label}
                          </span>

                          {ann.category && (
                            <span className="text-[10px] font-mono font-bold uppercase bg-zinc-100 text-zinc-700 px-2 py-0.5 border border-zinc-300">
                              {getCategoryLabel(ann.category)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(ann.publishedAt).toLocaleString('ms-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Main Title & Content */}
                      <div>
                        <h4 className="text-base font-black text-zinc-950">
                          {ann.title}
                        </h4>

                        <div className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed mt-1.5">
                          {ann.content}
                        </div>
                      </div>

                      {/* Authoritative Single Source of Truth: Linked Session Info */}
                      {linkedSession && (
                        <div className="p-3 bg-zinc-50 border-2 border-zinc-900 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-700" />
                              Maklumat Sesi Terkini (Jadual Rasmi)
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300">
                              BERKUASA
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-black text-zinc-900">
                                Hari {linkedSession.dayNumber} [Sesi {linkedSession.sessionNumber}] — {linkedSession.title}
                              </p>
                              <p className="text-xs text-zinc-600 mt-0.5">
                                ⏰ {linkedSession.startTime} - {linkedSession.endTime} • 📍 Lokasi Rasmi: <strong className="text-zinc-900">{linkedSession.location || 'Dewan Utama'}</strong>
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setActiveTab('schedule');
                                setSelectedDayNumber(linkedSession.dayNumber);
                              }}
                              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto"
                            >
                              <span>Lihat Jadual</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Authoritative Single Source of Truth: Linked Resource */}
                      {linkedResource && (
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block">Bahan Berkaitan Hebahan Ini:</span>
                              <span className="text-xs font-black text-emerald-950 block">{linkedResource.title}</span>
                            </div>
                          </div>

                          <a
                            href={linkedResource.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Bahan</span>
                          </a>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Diterbitkan oleh: <strong className="text-zinc-700">{ann.authorName || 'Urus Setia Kursus'}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyAnnouncementWhatsApp(ann)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Salin hebahan ini dalam format mesej WhatsApp"
                          >
                            {copiedAnnId === ann.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Salin WhatsApp</span>
                              </>
                            )}
                          </button>

                          {isUnread ? (
                            <button
                              onClick={() => handleMarkAsRead(ann.id)}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tanda Dibaca</span>
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                              <Check className="w-3 h-3 text-zinc-400" />
                              Telah Dibaca
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY INFORMATION (Option A phone verification) */}
        {activeTab === 'my-info' && (
          <MyInformationTab
            course={course}
            verifiedData={verifiedData}
            onVerified={handleVerified}
            onLogout={handleLogoutParticipant}
          />
        )}

        {/* TAB 5: LOGISTICS, WI-FI, CONTACTS, ACCOMMODATION */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {/* Venue Card */}
            <div className="bg-white border-2 border-zinc-900 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-zinc-900">
                <MapPin className="w-5 h-5 text-zinc-900" />
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Lokasi & Fasiliti Kursus
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-base text-zinc-950">{course.venueName}</p>
                {course.venueAddress && (
                  <p className="text-zinc-700 leading-relaxed">{course.venueAddress}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-200">
                  {course.venueDetails?.hallName && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Dewan / Bilik:</span>
                      <span className="font-bold text-zinc-900">{course.venueDetails.hallName}</span>
                    </div>
                  )}

                  {course.venueDetails?.floor && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Aras / Tingkat:</span>
                      <span className="font-bold text-zinc-900">{course.venueDetails.floor}</span>
                    </div>
                  )}

                  {course.venueDetails?.parkingInfo && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Maklumat Tempat Letak Kereta:</span>
                      <span className="text-zinc-700 leading-relaxed">{course.venueDetails.parkingInfo}</span>
                    </div>
                  )}

                  {course.venueDetails?.directions && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Panduan Pengangkutan / Arah:</span>
                      <span className="text-zinc-700 leading-relaxed">{course.venueDetails.directions}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      course.venueName + (course.venueAddress ? ' ' + course.venueAddress : '')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Peta Google / Panduan Arah ↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Wi-Fi Card (if provided) */}
            {course.venueDetails?.wifiSsid && (
              <div className="bg-white border-2 border-zinc-900 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-zinc-900">
                  <Wifi className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                    Akses Wi-Fi Dewan Kursus
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-zinc-50 border-2 border-zinc-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Nama Rangkaian (SSID):
                    </span>
                    <span className="text-base font-black font-mono text-zinc-950 select-all">
                      {course.venueDetails.wifiSsid}
                    </span>
                  </div>

                  {course.venueDetails.wifiPassword && (
                    <div className="p-4 bg-zinc-50 border-2 border-zinc-900 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Kata Laluan:
                        </span>
                        <span className="text-base font-black font-mono text-zinc-950 select-all">
                          {course.venueDetails.wifiPassword}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyWifiPassword(course.venueDetails?.wifiPassword || '')}
                        className="px-3 py-1.5 bg-white hover:bg-zinc-100 border-2 border-zinc-900 text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        {copiedWifi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWifi ? 'Disalin!' : 'Salin'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accommodation Card (if enabled) */}
            {isAccommodationActive && course.accommodationDetails?.providerName && (
              <div className="bg-white border-2 border-zinc-900 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-900">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-zinc-900" />
                    <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                      Maklumat Penginapan & Hotel
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveTab('my-info')}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Semak Bilik Saya</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="font-bold text-base text-zinc-950">
                    {course.accommodationDetails.providerName}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.accommodationDetails.checkInTime && (
                      <div className="p-3 bg-zinc-50 border border-zinc-200">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Daftar Masuk (Check-in):</span>
                        <span className="font-bold text-zinc-900">{course.accommodationDetails.checkInTime}</span>
                      </div>
                    )}

                    {course.accommodationDetails.checkOutTime && (
                      <div className="p-3 bg-zinc-50 border border-zinc-200">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Daftar Keluar (Check-out):</span>
                        <span className="font-bold text-zinc-900">{course.accommodationDetails.checkOutTime}</span>
                      </div>
                    )}

                    {course.accommodationDetails.roomTypes && (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Jenis Bilik:</span>
                        <span className="font-medium text-zinc-800">{course.accommodationDetails.roomTypes}</span>
                      </div>
                    )}

                    {course.accommodationDetails.notes && (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Arahan Khas Penginapan:</span>
                        <span className="text-zinc-700 leading-relaxed">{course.accommodationDetails.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Secretariat Contacts */}
            {course.contacts && course.contacts.length > 0 && (
              <div className="bg-white border-2 border-zinc-900 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-zinc-900">
                  <Phone className="w-5 h-5 text-zinc-900" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                    Hubungi Urus Setia Kursus
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.contacts.map((c) => (
                    <div key={c.id} className="p-4 bg-zinc-50 border-2 border-zinc-900 space-y-3">
                      <div>
                        <h4 className="text-sm font-black text-zinc-950">{c.name}</h4>
                        <p className="text-xs text-zinc-600 font-medium">{c.position}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200">
                        <a
                          href={`tel:${c.phone}`}
                          className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Panggil</span>
                        </a>

                        {c.whatsapp && (
                          <a
                            href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-zinc-700" />
                            <span>Emel</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MATERIALS & RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-900">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Bahan Pembentangan, Slaid & Dokumen Rujukan
                </h3>
                <p className="text-xs text-zinc-600">
                  Pautan rasmi slaid pembentangan, templat aktiviti dan dokumen kursus yang dimuat naik penganjur & penceramah.
                </p>
              </div>
            </div>

            {allMaterials.length === 0 ? (
              <div className="p-8 text-center bg-white border-2 border-zinc-900">
                <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-900 uppercase">Tiada Bahan Slaid Dimuat Naik</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Penceramah dan urus setia belum mengemaskini pautan bahan bagi kursus ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allMaterials.map((res) => {
                  const linkedSession = res.sessionId ? sessions.find(s => s.id === res.sessionId) : null;

                  return (
                    <div key={res.id} className="p-4 bg-white border-2 border-zinc-900 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border ${
                            res.category === 'SLIDES'
                              ? 'bg-blue-100 text-blue-900 border-blue-200'
                              : res.category === 'DOCUMENT'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : res.category === 'TEMPLATE'
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-purple-100 text-purple-900 border-purple-200'
                          }`}>
                            {res.category}
                          </span>

                          {linkedSession && (
                            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 px-1.5 py-0.5 border border-zinc-200">
                              Hari {linkedSession.dayNumber} [Sesi {linkedSession.sessionNumber}]
                            </span>
                          )}

                          {res.dayNumber && !linkedSession && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold font-mono border border-blue-200">
                              Hari {res.dayNumber} • {res.time}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-zinc-950">{res.title}</h4>
                        {res.facilitator && (
                          <p className="text-xs text-zinc-600">Penceramah: {res.facilitator}</p>
                        )}
                        {res.fileSizeMb && (
                          <p className="text-[11px] font-mono text-zinc-400">Saiz: ~{res.fileSizeMb} MB</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-200">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Bahan / Slaid ↗</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation for Mobile Devices */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-zinc-900 p-2 sm:hidden shadow-lg">
        <div className="grid grid-cols-4 gap-1 text-[10px] font-bold uppercase text-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 flex flex-col items-center gap-0.5 ${
              activeTab === 'overview' ? 'text-zinc-950 font-black' : 'text-zinc-500'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-1.5 flex flex-col items-center gap-0.5 ${
              activeTab === 'schedule' ? 'text-zinc-950 font-black' : 'text-zinc-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadual</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-1.5 flex flex-col items-center gap-0.5 relative ${
              activeTab === 'announcements' ? 'text-zinc-950 font-black' : 'text-zinc-500'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Hebahan</span>
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute top-1 right-5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('my-info')}
            className={`py-1.5 flex flex-col items-center gap-0.5 ${
              activeTab === 'my-info' ? 'text-emerald-700 font-black' : 'text-zinc-500'
            }`}
          >
            {verifiedData ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-700" />}
            <span>Bilik Saya</span>
          </button>
        </div>
      </div>

      {/* Share Course Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-zinc-950 w-full max-w-md shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-900">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-zinc-900" />
                <h3 className="text-sm font-black uppercase text-zinc-950">Kongsi Pautan Kursus</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Kongsi pautan rasmi portal kursus atau salin ringkasan mesej berstruktur untuk hebahan di kumpulan WhatsApp peserta.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 border border-zinc-300 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Pautan Langsung Portal:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="w-full text-xs font-mono bg-white border border-zinc-300 px-2 py-1 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Pautan kursus telah disalin!');
                    }}
                    className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold shrink-0 hover:bg-zinc-800"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Format Mesej WhatsApp:</span>
                  <button
                    onClick={handleCopyCourseShare}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedShareText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Salin Mesej</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto p-2.5 bg-white border border-zinc-200 text-xs text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {formatWhatsAppCourseShare(course)}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
