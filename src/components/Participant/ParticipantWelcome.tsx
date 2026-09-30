import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  HelpCircle, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Radio, 
  Copy, 
  Check, 
  Building, 
  Lock, 
  Users, 
  History, 
  Compass, 
  Info,
  CalendarCheck2
} from 'lucide-react';
import { Course, CourseStatus } from '../../types';
import { platformStorage } from '../../services/storage';
import { formatDateRangeDMY } from '../../utils/dateFormatter';

interface ParticipantWelcomeProps {
  onSelectCourse: (course: Course) => void;
  onSearchSlug: (slug: string) => void;
  onNavigateToOrganizer?: () => void;
  onNavigateToAdmin?: () => void;
}

export const ParticipantWelcome: React.FC<ParticipantWelcomeProps> = ({
  onSelectCourse,
  onSearchSlug,
  onNavigateToOrganizer,
  onNavigateToAdmin
}) => {
  const [slugInput, setSlugInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
  const [phoneSearchResults, setPhoneSearchResults] = useState<Array<{
    course: Course;
    participantName: string;
    enrollmentStatus: string;
  }> | null>(null);
  const [phoneSearched, setPhoneSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'ongoing' | 'upcoming' | 'past' | 'lookup'>('ongoing');
  const [selectedLiveIndex, setSelectedLiveIndex] = useState(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Live real-time clock synced with system time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // System date string in YYYY-MM-DD
  const liveYear = currentTime.getFullYear();
  const liveMonth = String(currentTime.getMonth() + 1).padStart(2, '0');
  const liveDay = String(currentTime.getDate()).padStart(2, '0');
  const liveDateStr = `${liveYear}-${liveMonth}-${liveDay}`;

  const liveTimeFormatted = currentTime.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const liveDateFormatted = currentTime.toLocaleDateString('ms-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Load courses and organizers
  const allCourses = platformStorage.getCourses();
  const organizers = platformStorage.getOrganizers();

  // Strict tally with live system date
  const isOngoing = (c: Course) => {
    if (!c.startDate || !c.endDate) return false;
    const cleanStart = c.startDate.trim();
    const cleanEnd = c.endDate.trim();
    // Strictly live: current system date must fall between startDate and endDate
    return cleanStart <= liveDateStr && liveDateStr <= cleanEnd && c.status !== CourseStatus.COMPLETED && c.status !== CourseStatus.ARCHIVED;
  };

  const isUpcoming = (c: Course) => {
    if (!c.startDate) return false;
    const cleanStart = c.startDate.trim();
    return cleanStart > liveDateStr && !isOngoing(c);
  };

  const isPast = (c: Course) => {
    if (!c.endDate) return false;
    const cleanEnd = c.endDate.trim();
    return (cleanEnd < liveDateStr || c.status === CourseStatus.COMPLETED || c.status === CourseStatus.ARCHIVED) && !isOngoing(c);
  };

  const ongoingCourses = allCourses.filter(isOngoing);
  const upcomingCourses = allCourses.filter(isUpcoming);
  const pastCourses = allCourses.filter(isPast);

  // Active live course (ONLY exists if a course is currently scheduled today!)
  const currentLiveCourse = ongoingCourses.length > 0 ? (ongoingCourses[selectedLiveIndex] || ongoingCourses[0]) : null;

  // Metadata for the active live course (if any)
  const liveOrganizer = currentLiveCourse 
    ? organizers.find(o => o.id === currentLiveCourse.organizerId) 
    : null;
  const liveEnrollments = currentLiveCourse 
    ? platformStorage.getEnrollmentsByCourseId(currentLiveCourse.id) 
    : [];
  const liveDays = currentLiveCourse 
    ? platformStorage.getScheduleDaysByCourseId(currentLiveCourse.id) 
    : [];
  const liveSessions = currentLiveCourse 
    ? platformStorage.getSessionsByCourseId(currentLiveCourse.id) 
    : [];

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}${window.location.pathname}#/course/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2500);
      }).catch(() => {});
    }
  };

  const handleSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slugInput.trim().toLowerCase().replace(/^#?\/?course\/?/, '').replace(/\/+$/, '').split('?')[0];
    if (clean) {
      onSearchSlug(clean);
    }
  };

  const handlePhoneCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setPhoneCheckLoading(true);
    setPhoneSearched(false);

    try {
      let results = platformStorage.findCoursesForParticipantPhone(phoneInput.trim());

      if (results.length === 0) {
        await platformStorage.syncFromCloud().catch(() => {});
        results = platformStorage.findCoursesForParticipantPhone(phoneInput.trim());
      }

      setPhoneSearchResults(results);
      setPhoneSearched(true);
    } finally {
      setPhoneCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between font-sans">
      {/* Top Banner / Announcement with Live System Time */}
      <div className="bg-zinc-950 text-white border-b-2 border-zinc-900 py-2 px-4 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <p className="font-medium tracking-wide flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Portal Rasmi MyKursus — Hab Pengurusan & Panduan Kursus Peserta</span>
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Masa Sistem: <strong>{liveTimeFormatted}</strong> ({liveDateFormatted})</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center my-auto">
        <div className="bg-white border-2 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
          
          {/* Header Hero Section */}
          <div className="p-6 sm:p-7 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white border-b-2 border-zinc-900 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="flex items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-14 h-14 bg-white text-zinc-900 border-2 border-zinc-900 flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]">
                  <GraduationCap className="w-8 h-8 text-zinc-900" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-zinc-950" />
                    <span>Portal Capaian Kursus Rasmi</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                    Pintu Gerbang Peserta & Hab Kursus
                  </h1>
                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                    Sistem disegerak secara langsung mengikut tarikh & masa sebenar ({liveDateFormatted}).
                  </p>
                </div>
              </div>

              {/* Fast Direct Access for Admin / Organizer */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-center sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                {onNavigateToOrganizer && (
                  <button
                    type="button"
                    onClick={onNavigateToOrganizer}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Buka Ruang Kerja Urus Setia & Penganjur"
                  >
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Urus Setia</span>
                  </button>
                )}
                {onNavigateToAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Buka Kawalan Tadbir Urus Master Admin"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Master Admin</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Action Hub (Targeted CSS element) */}
          <div className="p-5 sm:p-7 space-y-6">

            {/* Categorization Tabs: Sedang Berlangsung vs Akan Datang vs Lepas */}
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCategory('ongoing')}
                  className={`px-3.5 py-1.5 font-black uppercase tracking-wider flex items-center gap-2 border-2 border-zinc-900 transition-all cursor-pointer ${
                    activeCategory === 'ongoing'
                      ? 'bg-rose-600 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {ongoingCourses.length > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${ongoingCourses.length > 0 ? 'bg-white' : 'bg-zinc-400'}`}></span>
                  </span>
                  <span>Sedang Berlangsung</span>
                  <span className={`px-1.5 py-0.2 font-mono text-[10px] font-bold ${activeCategory === 'ongoing' ? 'bg-rose-800 text-white' : 'bg-zinc-200 text-zinc-800'}`}>
                    {ongoingCourses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory('upcoming')}
                  className={`px-3.5 py-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-zinc-900 transition-all cursor-pointer ${
                    activeCategory === 'upcoming'
                      ? 'bg-amber-400 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Akan Datang</span>
                  <span className={`px-1.5 py-0.2 font-mono text-[10px] font-bold ${activeCategory === 'upcoming' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-200 text-zinc-800'}`}>
                    {upcomingCourses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory('past')}
                  className={`px-3.5 py-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-zinc-900 transition-all cursor-pointer ${
                    activeCategory === 'past'
                      ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Kursus Lepas</span>
                  <span className={`px-1.5 py-0.2 font-mono text-[10px] font-bold ${activeCategory === 'past' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-800'}`}>
                    {pastCourses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory('lookup')}
                  className={`px-3.5 py-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-zinc-900 transition-all cursor-pointer ${
                    activeCategory === 'lookup'
                      ? 'bg-blue-600 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Carian & Semakan ID</span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 font-mono hidden md:flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-zinc-400" />
                <span>Hab Operasi Kursus</span>
              </div>
            </div>

            {/* TAB 1: KURSUS SEDANG BERLANGSUNG (LIVE HERO FOCUS) */}
            {activeCategory === 'ongoing' && (
              <div className="space-y-6">
                {currentLiveCourse ? (
                  /* Case A: Ada kursus yang SEDANG BERLANGSUNG pada tarikh sebenar hari ini */
                  <div className="border-3 border-zinc-950 bg-white shadow-[5px_5px_0px_0px_rgba(225,29,72,1)] overflow-hidden">
                    
                    {/* Live Header Bar */}
                    <div className="p-3 bg-rose-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-zinc-950">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider">
                          LIVE KURSUS SEDANG BERLANGSUNG HARI INI
                        </span>
                      </div>

                      {/* Course Switcher if multiple live courses exist */}
                      {ongoingCourses.length > 1 && (
                        <div className="flex items-center gap-1 bg-rose-800/80 p-0.5 border border-rose-400 text-xs">
                          <span className="text-[10px] font-bold px-1.5 uppercase opacity-90">Pilih Kursus:</span>
                          {ongoingCourses.map((c, idx) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedLiveIndex(idx)}
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                selectedLiveIndex === idx 
                                  ? 'bg-white text-rose-900 shadow-xs' 
                                  : 'text-rose-100 hover:text-white'
                              }`}
                            >
                              #{idx + 1} {c.code || c.slug}
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="text-[11px] font-mono font-bold bg-rose-950/60 px-2 py-0.5 border border-rose-400/50">
                        {currentLiveCourse.code || `KOD: ${currentLiveCourse.slug.toUpperCase()}`}
                      </span>
                    </div>

                    {/* Central Live Course Hero Content */}
                    <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-rose-50/30 via-white to-white">
                      
                      <div className="space-y-2">
                        {liveOrganizer && (
                          <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{liveOrganizer.name} ({liveOrganizer.code})</span>
                          </div>
                        )}
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950 leading-snug">
                          {currentLiveCourse.title}
                        </h2>
                        {currentLiveCourse.subtitle && (
                          <p className="text-sm font-semibold text-zinc-700">
                            {currentLiveCourse.subtitle}
                          </p>
                        )}
                        {currentLiveCourse.description && (
                          <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl line-clamp-2">
                            {currentLiveCourse.description}
                          </p>
                        )}
                      </div>

                      {/* 4-Column Operational Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-2 border-zinc-900 p-4 bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-rose-600" />
                            <span>Tarikh & Tempoh</span>
                          </span>
                          <div className="text-xs font-black text-zinc-900">
                            {formatDateRangeDMY(currentLiveCourse.startDate, currentLiveCourse.endDate)}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            Hari Ini Berlangsung
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-600" />
                            <span>Lokasi / Dewan</span>
                          </span>
                          <div className="text-xs font-black text-zinc-900 truncate" title={currentLiveCourse.venueName}>
                            {currentLiveCourse.venueName}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate" title={currentLiveCourse.venueDetails?.hallName || 'Bilik Kursus Utama'}>
                            {currentLiveCourse.venueDetails?.hallName || 'Bilik Kursus Utama'}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <Users className="w-3 h-3 text-rose-600" />
                            <span>Peserta Berdaftar</span>
                          </span>
                          <div className="text-xs font-black text-zinc-900 font-mono">
                            {liveEnrollments.length} Orang
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Penginapan & Kehadiran Aktif
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-rose-600" />
                            <span>Sesi & Pengisian</span>
                          </span>
                          <div className="text-xs font-black text-zinc-900 font-mono">
                            {liveDays.length} Hari • {liveSessions.length} Sesi
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            Pusat Operasi Aktif
                          </div>
                        </div>
                      </div>

                      {/* Primary Call to Action Button & Direct Link */}
                      <div className="space-y-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectCourse(currentLiveCourse)}
                          className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
                        >
                          <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
                          <span>Masuk ke Kursus Live Ini Sekarang</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-zinc-100 border border-zinc-300 text-xs">
                          <div className="flex items-center gap-2 text-zinc-700 truncate w-full sm:w-auto">
                            <span className="font-bold shrink-0">Pautan Terus Peserta:</span>
                            <span className="font-mono text-zinc-900 bg-white px-2 py-0.5 border border-zinc-300 truncate">
                              /{currentLiveCourse.slug}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(currentLiveCourse.slug)}
                              className="px-3 py-1 bg-white hover:bg-zinc-50 border border-zinc-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer text-zinc-800"
                            >
                              {copiedSlug === currentLiveCourse.slug ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-600" />
                                  <span>Salin Pautan</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveCategory('lookup')}
                              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] border border-zinc-900 transition-colors cursor-pointer"
                            >
                              Semak ID Peserta
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* Case B: Tiada kursus yang sedang berlangsung pada tarikh sistem hari ini */
                  <div className="border-2 border-zinc-900 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
                    
                    {/* Live System Time Synchronization Status Monitor */}
                    <div className="p-3 bg-zinc-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-zinc-900">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          Sistem Segerak Live & Tally Tarikh Sebenar
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-zinc-300">
                        {liveDateFormatted} • {liveTimeFormatted} MYT
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6 text-center">
                      <div className="w-16 h-16 bg-zinc-100 text-zinc-600 border-2 border-zinc-900 flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                        <CalendarCheck2 className="w-8 h-8 text-zinc-800" />
                      </div>

                      <div className="space-y-2 max-w-2xl mx-auto">
                        <div className="inline-block px-2.5 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-700 text-[11px] font-mono font-bold uppercase tracking-wider">
                          Tarikh Semasa: {liveDateStr}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-zinc-950">
                          Tiada Kursus Sedang Berlangsung Pada Hari Ini
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                          Sistem MyKursus telah diselaraskan secara automatik dengan tarikh dan masa sebenar. Kursus hanya akan dipaparkan secara <strong>LIVE</strong> di sini apabila tarikh sistem memasuki tempoh tarikh mula hingga tarikh tamat sesuatu kursus.
                        </p>
                      </div>

                      {/* Notice regarding KIAR 2026 being a past course */}
                      <div className="p-4 bg-amber-50/70 border-2 border-dashed border-amber-400 text-left max-w-2xl mx-auto space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase tracking-wider">
                          <Info className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Status Kursus Transformasi Pedagogi MPU2412 KIAR:</span>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed">
                          Kursus <strong>MPU2412 KIAR</strong> (tarikh: <strong>09-09-2026 hingga 11-09-2026</strong>) telah selesai dijalankan dan kini diarkibkan di dalam tab <strong>Kursus Lepas</strong>.
                        </p>
                      </div>

                      {/* Direct Action Hub to access Past and Upcoming Courses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveCategory('past')}
                          className="p-4 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-950 text-left flex items-center justify-between gap-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] group"
                        >
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-amber-400" />
                              <span>Arkib Kursus Lepas ({pastCourses.length})</span>
                            </div>
                            <div className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                              Buka Kursus Lepas & KIAR 2026
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCategory('upcoming')}
                          className="p-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 border-2 border-zinc-950 text-left flex items-center justify-between gap-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] group"
                        >
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-900" />
                              <span>Jadual Kursus Akan Tiba ({upcomingCourses.length})</span>
                            </div>
                            <div className="text-xs sm:text-sm font-black text-zinc-950 group-hover:translate-x-0.5 transition-transform">
                              Lihat Kursus Akan Datang
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-900 group-hover:translate-x-1 transition-transform shrink-0" />
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* Quick Secondary Access Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('upcoming')}
                    className="p-3 bg-amber-50 hover:bg-amber-100/80 border-2 border-zinc-900 text-left flex items-center justify-between gap-3 cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] group"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>Kursus Seterusnya ({upcomingCourses.length})</span>
                      </div>
                      <div className="text-xs font-black text-zinc-950 group-hover:text-amber-900">
                        Lihat Senarai Kursus Akan Datang
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('past')}
                    className="p-3 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-900 text-left flex items-center justify-between gap-3 cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] group"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3 text-zinc-500" />
                        <span>Arkib Kursus Lepas ({pastCourses.length})</span>
                      </div>
                      <div className="text-xs font-black text-zinc-950 group-hover:text-blue-900">
                        Semak Rekod Kursus Lepas Termasuk KIAR
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KURSUS AKAN DATANG (UPCOMING COURSES) */}
            {activeCategory === 'upcoming' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-zinc-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Senarai Kursus Akan Datang</span>
                    </h3>
                    <p className="text-xs text-zinc-600">
                      Kursus yang dijadualkan berlangsung selepas tarikh hari ini ({liveDateStr}).
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900">
                    {upcomingCourses.length} Kursus
                  </span>
                </div>

                {upcomingCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upcomingCourses.map((c, idx) => (
                      <div
                        key={`${c.id}-${idx}`}
                        className="text-left p-4 bg-white border-2 border-zinc-900 flex flex-col justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 border border-zinc-200">
                              /{c.slug}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-400 text-zinc-950 uppercase tracking-wider">
                              Akan Datang
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-zinc-950 line-clamp-2">
                            {c.title}
                          </h4>
                          {c.subtitle && (
                            <p className="text-xs text-zinc-600 line-clamp-1">{c.subtitle}</p>
                          )}
                        </div>

                        <div className="space-y-2 border-t border-zinc-200 pt-2.5">
                          <div className="text-[11px] text-zinc-600 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="font-semibold">{formatDateRangeDMY(c.startDate, c.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate">{c.venueName || 'Lokasi Ditetapkan Urus Setia'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectCourse(c)}
                              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Lihat Info Kursus</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(c.slug)}
                              title="Salin Pautan Kursus Ini"
                              className="p-2 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                            >
                              {copiedSlug === c.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-50 border-2 border-dashed border-zinc-300 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
                    <h4 className="text-sm font-bold text-zinc-800">
                      Tiada Kursus Akan Datang Buat Masa Ini
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Semua jadual latihan terkini akan dipaparkan di sini sebaik sahaja disahkan oleh urus setia.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: KURSUS LEPAS (PAST / COMPLETED COURSES) */}
            {activeCategory === 'past' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-zinc-950 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-zinc-700" />
                      <span>Arkib Rekod Kursus Lepas</span>
                    </h3>
                    <p className="text-xs text-zinc-600">
                      Pautan kursus yang telah selesai dijalankan (termasuk MPU2412 KIAR 2026) untuk rujukan bahan edaran dan rekod kehadiran.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-zinc-200 border border-zinc-300 text-zinc-800">
                    {pastCourses.length} Kursus
                  </span>
                </div>

                {pastCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pastCourses.map((c, idx) => (
                      <div
                        key={`${c.id}-${idx}`}
                        className="text-left p-4 bg-zinc-50 border-2 border-zinc-900 flex flex-col justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-200 px-1.5 py-0.5">
                              /{c.slug}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-300 text-zinc-800 uppercase tracking-wider">
                              Selesai / Arkib
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-950 line-clamp-2">
                            {c.title}
                          </h4>
                          {c.subtitle && (
                            <p className="text-xs text-zinc-600 line-clamp-1">{c.subtitle}</p>
                          )}
                        </div>

                        <div className="space-y-2 border-t border-zinc-200 pt-2.5">
                          <div className="text-[11px] text-zinc-600 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="font-semibold">{formatDateRangeDMY(c.startDate, c.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate">{c.venueName || 'Lokasi Kursus'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectCourse(c)}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Buka Arkib Kursus</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(c.slug)}
                              title="Salin Pautan Kursus Ini"
                              className="p-2 border border-zinc-300 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                            >
                              {copiedSlug === c.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-50 border-2 border-dashed border-zinc-300 text-center space-y-2">
                    <History className="w-8 h-8 text-zinc-400 mx-auto" />
                    <h4 className="text-sm font-bold text-zinc-800">
                      Tiada Rekod Kursus Lepas
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Semua kursus yang telah selesai dijalankan akan diarkibkan di sini.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CARIAN KOD & SEMAKAN PENDAFTARAN */}
            {activeCategory === 'lookup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Option 1: Search by Slug / Course Code */}
                  <div className="p-5 border-2 border-zinc-900 bg-zinc-50 flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <h2 className="text-sm font-black uppercase text-zinc-950">Akses Pautan Kursus</h2>
                          <p className="text-[11px] text-zinc-500">Mempunyai kod atau pautan daripada urus setia?</p>
                        </div>
                      </div>

                      <form onSubmit={handleSlugSubmit} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                            Kod / Slug Kursus:
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-xs font-mono font-bold bg-zinc-200 border-2 border-r-0 border-zinc-900 text-zinc-700">
                              /
                            </span>
                            <input
                              type="text"
                              value={slugInput}
                              onChange={(e) => setSlugInput(e.target.value)}
                              placeholder="contoh: kiar-2026"
                              className="flex-1 px-3 py-2 text-xs font-mono font-bold border-2 border-zinc-900 focus:outline-none focus:bg-white bg-white"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Petua: Masukkan hujung pautan, cth: <em>kiar-2026</em> atau tajuk kursus.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={!slugInput.trim()}
                          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                        >
                          <Search className="w-4 h-4" />
                          <span>Buka Halaman Kursus</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Option 2: Verify Registration by Mobile Number or Staff/Salary ID */}
                  <div className="p-5 border-2 border-zinc-900 bg-amber-50/50 flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <h2 className="text-sm font-black uppercase text-zinc-950">Semak No. Telefon / No. Gaji</h2>
                          <p className="text-[11px] text-zinc-600">Semak rekod pendaftaran kursus anda</p>
                        </div>
                      </div>

                      <form onSubmit={handlePhoneCheck} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                            Nombor Telefon atau No. Gaji / ID Peserta:
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="cth: 0192345671 atau No. Gaji (cth: 275330)"
                              className="w-full pl-9 pr-3 py-2 text-xs font-bold border-2 border-zinc-900 focus:outline-none focus:bg-white bg-white"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Sistem mencari padanan rekod mengikut No. Telefon atau No. Gaji / ID rasmi.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={phoneCheckLoading || !phoneInput.trim()}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                        >
                          {phoneCheckLoading ? (
                            <span>Sedang Menyemak...</span>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Semak Status Pendaftaran</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                </div>

                {/* Results for Phone Number Search (if searched) */}
                {phoneSearched && (
                  <div className="p-4 border-2 border-zinc-900 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-800">
                        Hasil Carian Pendaftaran Peserta:
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-500">
                        {phoneSearchResults?.length || 0} Kursus Ditemui
                      </span>
                    </div>

                    {phoneSearchResults && phoneSearchResults.length > 0 ? (
                      <div className="space-y-2">
                        {phoneSearchResults.map((res, idx) => (
                          <div
                            key={`${res.course.id}-${idx}`}
                            className="p-3.5 bg-emerald-50 border-2 border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white uppercase tracking-wider">
                                  Disahkan Terdaftar
                                </span>
                                <span className="text-xs font-bold text-zinc-700">
                                  Nama: <strong>{res.participantName}</strong>
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-zinc-950">
                                {res.course.title}
                              </h3>
                              <p className="text-[11px] text-zinc-600 flex items-center gap-2">
                                <span>📅 {formatDateRangeDMY(res.course.startDate, res.course.endDate)}</span>
                                <span>•</span>
                                <span>📍 {res.course.venueName || 'Lokasi Ditetapkan Urus Setia'}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onSelectCourse(res.course)}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                            >
                              <span>Masuk ke Kursus</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 text-center space-y-1">
                        <p className="text-xs font-bold text-zinc-700">
                          Tiada rekod pendaftaran aktif ditemui untuk "{phoneInput}".
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Sila pastikan format No. Telefon atau No. Gaji betul, atau hubungi Urus Setia kursus anda untuk pengesahan rekod.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direct Support & Organizer Link */}
            <div className="p-4 bg-zinc-100 border border-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-700">
                <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>
                  Perlukan bantuan pendaftaran atau tidak pasti kod kursus anda?
                </span>
              </div>
              <div className="flex items-center gap-3">
                {onNavigateToOrganizer && (
                  <button
                    type="button"
                    onClick={onNavigateToOrganizer}
                    className="text-zinc-600 hover:text-zinc-950 text-xs font-bold underline cursor-pointer"
                  >
                    Log Masuk Penganjur
                  </button>
                )}
                {onNavigateToAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="text-zinc-600 hover:text-zinc-950 text-xs font-bold underline cursor-pointer"
                  >
                    Pentadbir
                  </button>
                )}
                <a
                  href="https://wa.me/?text=Salam%20Urus%20Setia%20MyKursus,%20saya%20memerlukan%20bantuan%20mengenai%20pendaftaran%20kursus."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Urus Setia</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-500 border-t border-zinc-200 bg-white">
        <p>MyKursus Platform • Hab Pengurusan Latihan & Kursus • Hak Cipta Terpelihara © 2026</p>
      </footer>
    </div>
  );
};
