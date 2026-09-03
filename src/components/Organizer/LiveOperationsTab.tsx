import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  MapPin, 
  User, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Bell, 
  Radio, 
  Sparkles, 
  Share2, 
  Coffee,
  ChevronRight,
  Edit2,
  Trash2,
  RefreshCw,
  Info,
  Sliders
} from 'lucide-react';
import { Course, ScheduleDay, SessionItem, Announcement, CourseEnrollment } from '../../types';
import { calculateCourseSessionStatus, SessionStatusInfo } from '../../utils/courseHelpers';
import { QuickOperationalUpdateModal } from './QuickOperationalUpdateModal';

interface LiveOperationsTabProps {
  course: Course;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  announcements: Announcement[];
  enrollments: CourseEnrollment[];
  onUpdateSession: (session: SessionItem) => void;
  onSaveAnnouncement: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onOpenPublicPreview: () => void;
  onNavigateToScheduleTab: () => void;
  onNavigateToAnnouncementsTab: () => void;
}

export const LiveOperationsTab: React.FC<LiveOperationsTabProps> = ({
  course,
  scheduleDays,
  sessions,
  announcements,
  enrollments,
  onUpdateSession,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onOpenPublicPreview,
  onNavigateToScheduleTab,
  onNavigateToAnnouncementsTab,
}) => {
  // Real-time ticking state
  const [currentSystemTime, setCurrentSystemTime] = useState<Date>(new Date());
  const [useSimulationTime, setUseSimulationTime] = useState<boolean>(false);
  const [simulatedDateStr, setSimulatedDateStr] = useState<string>(
    scheduleDays[0]?.date || course.startDate || new Date().toISOString().split('T')[0]
  );
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('09:15');

  // Quick Operational Update Modal state
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);

  // Quick Inline Edit Session state
  const [editingSessionQuick, setEditingSessionQuick] = useState<SessionItem | null>(null);
  const [quickLocation, setQuickLocation] = useState('');
  const [quickPresentationUrl, setQuickPresentationUrl] = useState('');

  // Auto-refresh timer every 15 seconds for live status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSystemTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective date for session status
  const effectiveDate = React.useMemo(() => {
    if (!useSimulationTime) {
      return currentSystemTime;
    }
    const [year, month, day] = simulatedDateStr.split('-').map(Number);
    const [hour, min] = simulatedTimeStr.split(':').map(Number);
    const d = new Date(year, (month || 1) - 1, day || 1, hour || 0, min || 0, 0);
    return d;
  }, [useSimulationTime, currentSystemTime, simulatedDateStr, simulatedTimeStr]);

  // Session status computation
  const statusInfo: SessionStatusInfo = calculateCourseSessionStatus(
    course,
    scheduleDays,
    sessions,
    effectiveDate
  );

  const { currentSession, nextSession, todaySessions, completedSessions, upcomingSessions } = statusInfo;

  // Stats calculation
  const totalEnrolled = enrollments.length;
  const attendanceConfirmedCount = enrollments.filter(e => e.attendanceConfirmed).length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((attendanceConfirmedCount / totalEnrolled) * 100) : 0;

  // Selected Day for Schedule view in this cockpit
  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    statusInfo.todayDay?.dayNumber || scheduleDays[0]?.dayNumber || 1
  );

  const displayedDaySessions = (sessions || [])
    .filter(s => s.dayNumber === selectedDayNum)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleSaveInlineQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSessionQuick) return;

    let cleanUrl = quickPresentationUrl.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    onUpdateSession({
      ...editingSessionQuick,
      location: quickLocation.trim(),
      presentationUrl: cleanUrl,
      updatedAt: new Date().toISOString(),
    });

    setEditingSessionQuick(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP LIVE COCKPIT HERO */}
      <div className="bg-zinc-900 text-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-zinc-950 text-[10px] font-mono font-black uppercase tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>KURSUS OPERASI LANGSUNG (LIVE)</span>
              </span>

              <span className="text-xs font-mono text-zinc-400">
                Masa Sistem: {currentSystemTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              Pusat Kawalan Operasi Acara & Sesi
            </h2>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Urus pindaan bilik, pautan slaid penceramah, pengumuman segera dan status kehadiran secara masa-nyata tanpa sebarang kekangan kelulusan Master Admin.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowQuickModal(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-transform active:translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Kemaskini Pantas Operasi</span>
            </button>

            <button
              onClick={onOpenPublicPreview}
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-colors"
              title="Buka Paparan Peserta"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Paparan Peserta</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div className="bg-zinc-800/60 p-2.5 border border-zinc-700">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Kehadiran Disahkan</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-emerald-400">{attendanceConfirmedCount}</span>
              <span className="text-[10px] text-zinc-400">/ {totalEnrolled} peserta ({attendanceRate}%)</span>
            </div>
          </div>

          <div className="bg-zinc-800/60 p-2.5 border border-zinc-700">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Jumlah Sesi Kursus</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-white">{sessions.length} Sesi</span>
              <span className="text-[10px] text-zinc-400">({scheduleDays.length} Hari)</span>
            </div>
          </div>

          <div className="bg-zinc-800/60 p-2.5 border border-zinc-700">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Status Semasa</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-zinc-200 truncate">{statusInfo.statusLabel}</span>
            </div>
          </div>

          <div className="bg-zinc-800/60 p-2.5 border border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Pengumuman Aktif</span>
              <span className="text-base font-black text-amber-300 mt-0.5 block">{announcements.length} Hebahan</span>
            </div>
            <button
              onClick={onNavigateToAnnouncementsTab}
              className="text-[10px] font-mono text-zinc-300 hover:text-white underline"
            >
              Urus
            </button>
          </div>
        </div>

        {/* Time Simulation / Test Controller */}
        <div className="bg-zinc-950 p-3 border border-zinc-800 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px] text-zinc-300 font-bold uppercase">
              Ujian Simulasi Waktu Acara:
            </span>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={useSimulationTime}
                onChange={(e) => setUseSimulationTime(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-500 rounded"
              />
              <span>Aktifkan Simulasi Waktu</span>
            </label>
          </div>

          {useSimulationTime && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={simulatedDateStr}
                onChange={(e) => setSimulatedDateStr(e.target.value)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono"
              />
              <input
                type="time"
                value={simulatedTimeStr}
                onChange={(e) => setSimulatedTimeStr(e.target.value)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono"
              />
              <span className="text-[10px] font-mono text-amber-400">
                (Membolehkan ujian sesi tanpa menunggu masa sebenar)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. CURRENT SESSION & NEXT SESSION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CURRENT SESSION CARD */}
        <div className={`border-2 p-5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between ${
          currentSession 
            ? 'bg-emerald-50/50 border-emerald-600' 
            : 'bg-white border-zinc-900'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${currentSession ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'}`} />
                <span className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900">
                  SESI SEDANG BERLANGSUNG
                </span>
              </div>

              {currentSession && statusInfo.currentSessionRemainingMinutes !== undefined && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-200 text-emerald-950 border border-emerald-300">
                  Baki ~{statusInfo.currentSessionRemainingMinutes} Minit
                </span>
              )}
            </div>

            {currentSession ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-900 font-bold mb-1">
                    <span>Hari {currentSession.dayNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {currentSession.startTime} - {currentSession.endTime}
                    </span>
                    <span>•</span>
                    <span>Sesi {currentSession.sessionNumber}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-zinc-950 leading-snug">
                    {currentSession.title}
                  </h3>

                  {currentSession.description && (
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                      {currentSession.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 border border-zinc-300">
                  <div className="flex items-center gap-2 text-zinc-800">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Lokasi Semasa:</span>
                      <span className="font-bold">{currentSession.location || course.venueDetails?.hallName || 'Dewan Utama'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-800">
                    <User className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Penceramah / Fasilitator:</span>
                      <span className="font-bold">{currentSession.facilitatorName || 'Urus Setia'}</span>
                    </div>
                  </div>
                </div>

                {currentSession.presentationUrl ? (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                    <span className="text-blue-900 font-semibold truncate flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      Slaid aktif sedia diakses peserta
                    </span>
                    <a
                      href={currentSession.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-700 hover:underline shrink-0"
                    >
                      Buka Slaid ↗
                    </a>
                  </div>
                ) : (
                  <div className="p-2.5 bg-zinc-100 border border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
                    <span>Pautan slaid belum dilampirkan bagi sesi ini.</span>
                    <button
                      onClick={() => {
                        setEditingSessionQuick(currentSession);
                        setQuickLocation(currentSession.location || '');
                        setQuickPresentationUrl('');
                      }}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      + Tambah Slaid
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Coffee className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-900 uppercase">
                  Tiada sesi sedang berlangsung pada masa ini
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Acara mungkin sedang dalam waktu rehat atau di luar waktu jadual sesi harian.
                </p>
              </div>
            )}
          </div>

          {currentSession && (
            <div className="pt-4 mt-4 border-t border-emerald-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setEditingSessionQuick(currentSession);
                  setQuickLocation(currentSession.location || '');
                  setQuickPresentationUrl(currentSession.presentationUrl || '');
                }}
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-900 text-xs font-bold text-zinc-900 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Pinda Lokasi / Slaid</span>
              </button>

              <button
                onClick={() => setShowQuickModal(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Hebah Kepada Peserta</span>
              </button>
            </div>
          )}
        </div>

        {/* NEXT SESSION CARD */}
        <div className="bg-white border-2 border-zinc-900 p-5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                SESI SETERUSNYA
              </span>

              {nextSession && statusInfo.minutesUntilNextSession !== undefined && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200">
                  Bermula dalam ~{statusInfo.minutesUntilNextSession} Minit
                </span>
              )}
            </div>

            {nextSession ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 font-bold mb-1">
                    <span>Hari {nextSession.dayNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {nextSession.startTime} - {nextSession.endTime}
                    </span>
                    <span>•</span>
                    <span>Sesi {nextSession.sessionNumber}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-zinc-950 leading-snug">
                    {nextSession.title}
                  </h3>

                  {nextSession.description && (
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                      {nextSession.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-zinc-50 p-3 border border-zinc-200">
                  <div className="flex items-center gap-2 text-zinc-800">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Bilik / Dewan:</span>
                      <span className="font-bold">{nextSession.location || course.venueDetails?.hallName || 'Dewan Utama'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-800">
                    <User className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Fasilitator / Penceramah:</span>
                      <span className="font-bold">{nextSession.facilitatorName || 'Akan diumumkan'}</span>
                    </div>
                  </div>
                </div>

                {nextSession.presentationUrl && (
                  <div className="p-2 bg-zinc-100 text-xs text-zinc-700 flex items-center justify-between">
                    <span className="truncate">Slaid: {nextSession.presentationUrl}</span>
                    <a
                      href={nextSession.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-700 hover:underline shrink-0 ml-2"
                    >
                      Buka ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-900 uppercase">
                  Semua sesi kursus telah selesai
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Tiada sesi berjadual berikutnya untuk kursus ini.
                </p>
              </div>
            )}
          </div>

          {nextSession && (
            <div className="pt-4 mt-4 border-t border-zinc-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setEditingSessionQuick(nextSession);
                  setQuickLocation(nextSession.location || '');
                  setQuickPresentationUrl(nextSession.presentationUrl || '');
                }}
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-900 text-xs font-bold text-zinc-900 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Pinda Lokasi Sesi Awal</span>
              </button>

              <button
                onClick={onNavigateToScheduleTab}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-bold flex items-center gap-1"
              >
                <span>Lihat Semua Jadual</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. TODAY'S SCHEDULE & QUICK REAL-TIME TABLE */}
      <div className="bg-white border-2 border-zinc-900 p-5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                Kawalan Jadual Sesi (Hari {selectedDayNum})
              </h3>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              Sebarang pindaan masa, bilik atau pautan slaid akan segera dikemaskini dalam pangkalan data kursus tunggal DCOREV1.
            </p>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {scheduleDays.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayNum(day.dayNumber)}
                className={`px-3 py-1 text-xs font-mono font-bold border-2 transition-all ${
                  selectedDayNum === day.dayNumber
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:border-zinc-900'
                }`}
              >
                Hari {day.dayNumber} ({day.date})
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {displayedDaySessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Tiada sesi didaftarkan untuk Hari {selectedDayNum}.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 border border-zinc-200">
            {displayedDaySessions.map((session) => {
              const isCurrent = currentSession?.id === session.id;
              const isPast = completedSessions.some(s => s.id === session.id);
              const isNext = nextSession?.id === session.id;

              return (
                <div
                  key={session.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isCurrent 
                      ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' 
                      : isNext 
                      ? 'bg-blue-50/50 border-l-4 border-l-blue-600' 
                      : isPast 
                      ? 'bg-zinc-50/60 opacity-80' 
                      : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-zinc-900">
                        {session.startTime} - {session.endTime}
                      </span>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-200 text-zinc-800 font-bold">
                        Sesi {session.sessionNumber}
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-600 text-white animate-pulse">
                          LIVE SEKARANG
                        </span>
                      )}

                      {isNext && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-600 text-white">
                          SETERUSNYA
                        </span>
                      )}

                      {isPast && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-200 text-zinc-600">
                          Selesai
                        </span>
                      )}

                      {session.updatedAt && (
                        <span className="text-[10px] text-amber-800 font-mono italic">
                          Dikemaskini operasi
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-zinc-950">
                      {session.title}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-zinc-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{session.location || course.venueDetails?.hallName || 'Dewan Utama'}</span>
                      </span>

                      {session.facilitatorName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{session.facilitatorName}</span>
                        </span>
                      )}

                      {session.presentationUrl && (
                        <a
                          href={session.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Pautan Slaid</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingSessionQuick(session);
                        setQuickLocation(session.location || '');
                        setQuickPresentationUrl(session.presentationUrl || '');
                      }}
                      className="px-2.5 py-1.5 bg-white border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Kemaskini Pantas</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. RECENT OPERATIONAL ANNOUNCEMENTS WIDGET */}
      <div className="bg-white border-2 border-zinc-900 p-5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-900" />
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
              Hebahan Operasi Terkini
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickModal(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
            >
              + Hebahan Baharu
            </button>
            <button
              onClick={onNavigateToAnnouncementsTab}
              className="text-xs text-zinc-600 hover:underline font-bold"
            >
              Lihat Semua ({announcements.length}) →
            </button>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            Tiada pengumuman operasi diterbitkan lagi. Klik "Kemaskini Pantas Operasi" untuk membuat hebahan segera.
          </div>
        ) : (
          <div className="space-y-2.5">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className={`p-3 border-2 flex items-start justify-between gap-3 ${
                  ann.priority === 'CRITICAL'
                    ? 'border-red-600 bg-red-50/40'
                    : ann.priority === 'URGENT'
                    ? 'border-amber-500 bg-amber-50/40'
                    : 'border-zinc-300 bg-zinc-50/50'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${
                      ann.priority === 'CRITICAL'
                        ? 'bg-red-600 text-white border-red-700'
                        : ann.priority === 'URGENT'
                        ? 'bg-amber-500 text-zinc-950 border-amber-600'
                        : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                    }`}>
                      {ann.priority}
                    </span>

                    <span className="text-[11px] font-mono text-zinc-500">
                      {new Date(ann.publishedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })} • {ann.authorName || 'Urus Setia'}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                    {ann.title}
                  </h4>

                  <p className="text-xs text-zinc-700 line-clamp-2">
                    {ann.content}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Padam hebahan "${ann.title}"?`)) {
                      onDeleteAnnouncement(ann.id);
                    }
                  }}
                  className="p-1 text-zinc-400 hover:text-red-600"
                  title="Padam"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK OPERATIONAL UPDATE MODAL */}
      {showQuickModal && (
        <QuickOperationalUpdateModal
          course={course}
          sessions={sessions}
          currentSession={currentSession}
          nextSession={nextSession}
          onPublishAnnouncement={onSaveAnnouncement}
          onUpdateSession={onUpdateSession}
          onClose={() => setShowQuickModal(false)}
        />
      )}

      {/* INLINE QUICK EDIT SESSION MODAL */}
      {editingSessionQuick && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 uppercase">
                Kemaskini Pantas Sesi: {editingSessionQuick.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Hari {editingSessionQuick.dayNumber} [Sesi {editingSessionQuick.sessionNumber}] • {editingSessionQuick.startTime} - {editingSessionQuick.endTime}
              </p>
            </div>

            <form onSubmit={handleSaveInlineQuickEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Bilik / Dewan Sesi:
                </label>
                <input
                  type="text"
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder="cth. Bilik Mawar Aras 3"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Pautan Slaid Pembentangan (URL):
                </label>
                <input
                  type="text"
                  value={quickPresentationUrl}
                  onChange={(e) => setQuickPresentationUrl(e.target.value)}
                  placeholder="cth. https://docs.google.com/presentation/d/..."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingSessionQuick(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  Simpan Serta-Merta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
