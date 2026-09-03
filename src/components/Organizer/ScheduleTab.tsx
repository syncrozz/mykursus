import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Link, 
  FileText, 
  Coffee, 
  CheckCircle2, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ScheduleDay, SessionItem, Course, Announcement } from '../../types';
import { Bell } from 'lucide-react';

interface ScheduleTabProps {
  course: Course;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  onSaveDay: (day: ScheduleDay) => void;
  onDeleteDay: (dayId: string) => void;
  onSaveSession: (session: SessionItem) => void;
  onDeleteSession: (sessionId: string) => void;
  onPublishAnnouncement?: (announcement: Announcement) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  course,
  scheduleDays,
  sessions,
  onSaveDay,
  onDeleteDay,
  onSaveSession,
  onDeleteSession,
  onPublishAnnouncement,
}) => {
  const sortedDays = [...(scheduleDays || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const [activeDayNumber, setActiveDayNumber] = useState<number>(sortedDays[0]?.dayNumber || 1);

  // Modal states for Session
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);

  // Session form fields
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:30');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [location, setLocation] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [materialsNote, setMaterialsNote] = useState('');
  const [isBreakOrMeal, setIsBreakOrMeal] = useState(false);
  const [broadcastChange, setBroadcastChange] = useState(false);

  // Add Day modal
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayDate, setNewDayDate] = useState(course.startDate || '');
  const [newDayTheme, setNewDayTheme] = useState('');

  const currentDaySessions = (sessions || [])
    .filter(s => s.dayNumber === activeDayNumber)
    .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

  const openAddSessionModal = () => {
    setEditingSession(null);
    setSessionNumber(currentDaySessions.length + 1);
    setStartTime('09:00');
    setEndTime('10:30');
    setSessionTitle('');
    setSessionDesc('');
    setFacilitator('');
    setLocation(course.venueDetails?.hallName || '');
    setPresentationUrl('');
    setMaterialsNote('');
    setIsBreakOrMeal(false);
    setBroadcastChange(false);
    setShowSessionModal(true);
  };

  const openEditSessionModal = (s: SessionItem) => {
    setEditingSession(s);
    setSessionNumber(s.sessionNumber);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setSessionTitle(s.title);
    setSessionDesc(s.description || '');
    setFacilitator(s.facilitatorName || '');
    setLocation(s.location || '');
    setPresentationUrl(s.presentationUrl || '');
    setMaterialsNote(s.materialsNote || '');
    setIsBreakOrMeal(Boolean(s.isBreakOrMeal));
    setBroadcastChange(false);
    setShowSessionModal(true);
  };

  const handleSaveSessionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    let cleanUrl = presentationUrl.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const finalSessionId = editingSession?.id || 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    onSaveSession({
      id: finalSessionId,
      courseId: course.id,
      dayNumber: activeDayNumber,
      sessionNumber,
      startTime,
      endTime,
      title: sessionTitle.trim(),
      description: sessionDesc.trim(),
      facilitatorName: facilitator.trim(),
      location: location.trim(),
      presentationUrl: cleanUrl,
      materialsNote: materialsNote.trim(),
      isBreakOrMeal,
      updatedAt: new Date().toISOString(),
    });

    if (broadcastChange && onPublishAnnouncement) {
      const isLocChange = editingSession && editingSession.location !== location.trim();
      onPublishAnnouncement({
        id: 'ann-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        courseId: course.id,
        title: `Pindaan Sesi ${sessionNumber}: ${sessionTitle.trim()}`,
        content: `Makluman maklumat terkini bagi Sesi ${sessionNumber}: "${sessionTitle.trim()}".\n• Waktu: ${startTime} - ${endTime}\n• Lokasi Rasmi: ${location.trim() || 'Sila rujuk jadual'}\n• Penceramah/Fasilitator: ${facilitator.trim() || '-'}\nSila layari tab Jadual untuk melihat susunan terperinci.`,
        priority: 'IMPORTANT',
        category: isLocChange ? 'LOCATION_CHANGE' : 'SCHEDULE_CHANGE',
        relatedSessionId: finalSessionId,
        isPublic: true,
        publishedAt: new Date().toISOString(),
        authorUserId: 'organizer-current',
        authorName: 'Urus Setia Jadual',
        status: 'PUBLISHED',
      });
    }

    setShowSessionModal(false);
  };

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    const nextDayNum = sortedDays.length + 1;
    onSaveDay({
      id: 'day-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId: course.id,
      dayNumber: nextDayNum,
      date: newDayDate || course.startDate,
      theme: newDayTheme.trim() || `Hari ${nextDayNum}`,
    });
    setActiveDayNumber(nextDayNum);
    setShowAddDayModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Day Selector & Management */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-zinc-600 uppercase mr-1">Hari Kursus:</span>
          {sortedDays.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDayNumber(day.dayNumber)}
              className={`px-3.5 py-1.5 text-xs font-bold transition-all border-2 ${
                activeDayNumber === day.dayNumber
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <span>Hari {day.dayNumber}</span>
              <span className="ml-1.5 text-[10px] opacity-75 font-mono">({day.date})</span>
            </button>
          ))}

          <button
            onClick={() => {
              setNewDayDate(course.endDate || course.startDate);
              setNewDayTheme('');
              setShowAddDayModal(true);
            }}
            className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 flex items-center gap-1"
            title="Tambah Hari Kursus Baharu"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Hari</span>
          </button>
        </div>

        <div>
          <button
            onClick={openAddSessionModal}
            className="px-3.5 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 border-2 border-zinc-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Sesi Hari {activeDayNumber}</span>
          </button>
        </div>
      </div>

      {/* Active Day Info Header */}
      {sortedDays.find(d => d.dayNumber === activeDayNumber) && (
        <div className="bg-zinc-50 border border-zinc-200 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">Tema Hari {activeDayNumber}:</span>
            <span className="text-zinc-700 font-medium">
              {sortedDays.find(d => d.dayNumber === activeDayNumber)?.theme || 'Tiada tema khusus'}
            </span>
          </div>
          {sortedDays.length > 1 && (
            <button
              onClick={() => {
                const targetDay = sortedDays.find(d => d.dayNumber === activeDayNumber);
                if (targetDay && confirm(`Padam Hari ${activeDayNumber}? Semua sesi hari ini akan turut dipadam.`)) {
                  onDeleteDay(targetDay.id);
                  setActiveDayNumber(sortedDays[0]?.dayNumber || 1);
                }
              }}
              className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Padam Hari Ini</span>
            </button>
          )}
        </div>
      )}

      {/* Sessions Timeline List */}
      {currentDaySessions.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <Clock className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-900">Tiada Sesi Dijadualkan</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Belum ada sesi ceramah, bengkel, atau slot rehat yang dimasukkan untuk Hari {activeDayNumber}.
          </p>
          <button
            onClick={openAddSessionModal}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
          >
            + Tambah Sesi Pertama Hari Ini
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDaySessions.map((session) => (
            <div
              key={session.id}
              className={`bg-white border-2 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                session.isBreakOrMeal ? 'border-amber-400 bg-amber-50/40' : 'border-zinc-900'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {session.startTime} – {session.endTime}
                  </span>

                  {session.isBreakOrMeal ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-200 text-amber-900 font-bold border border-amber-400 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      REHAT / MAKAN
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 font-bold border border-blue-300">
                      SESI {session.sessionNumber}
                    </span>
                  )}

                  {session.location && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {session.location}
                    </span>
                  )}

                  {session.updatedAt && (
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                      Pindaan Operasi
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-zinc-900">
                  {session.title}
                </h4>

                {session.facilitatorName && (
                  <div className="text-xs text-zinc-700 flex items-center gap-1 font-medium">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span>Penceramah / Fasilitator: {session.facilitatorName}</span>
                  </div>
                )}

                {session.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2">
                    {session.description}
                  </p>
                )}

                {/* Presentation link and materials notice */}
                {session.presentationUrl && (
                  <div className="pt-1">
                    <a
                      href={session.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-bold underline font-mono"
                    >
                      <Link className="w-3 h-3" />
                      <span>Pautan Pembentangan: {session.presentationUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => openEditSessionModal(session)}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Padam sesi "${session.title}"?`)) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200"
                  title="Padam Sesi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-lg bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{editingSession ? 'Edit Sesi Kursus' : `Tambah Sesi (Hari ${activeDayNumber})`}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSessionForm} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    No. Sesi
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Masa Mula
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Masa Tamat
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tajuk Sesi / Slot <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                  placeholder="cth. Sesi 1: Penstrukturan Silibus Berasaskan CLO"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Penceramah / Fasilitator
                  </label>
                  <input
                    type="text"
                    value={facilitator}
                    onChange={(e) => setFacilitator(e.target.value)}
                    placeholder="cth. Prof. Madya Dr. Zulkifli"
                    className="w-full p-2 text-xs border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Bilik / Lokasi Slot
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="cth. Ballroom Aras 2"
                    className="w-full p-2 text-xs border border-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Pautan Slaid / Bahan Pembentangan (Live Presentation URL)
                </label>
                <input
                  type="url"
                  value={presentationUrl}
                  onChange={(e) => setPresentationUrl(e.target.value)}
                  placeholder="https://slides.google.com/... atau https://canva.com/..."
                  className="w-full p-2 text-xs border border-zinc-300 font-mono text-blue-700"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Boleh dikemaskini terus semasa acara berlangsung tanpa sekatan kelulusan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Huraian / Nota Slot
                </label>
                <textarea
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  rows={2}
                  placeholder="Ringkasan aktiviti bagi slot ini..."
                  className="w-full p-2 text-xs border border-zinc-300"
                />
              </div>

              <div className="pt-1 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreakOrMeal}
                    onChange={(e) => setIsBreakOrMeal(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-800">
                    Ini adalah slot Rehat / Minum Pagi / Makan Tengah Hari
                  </span>
                </label>

                {onPublishAnnouncement && (
                  <label className="flex items-start gap-2 cursor-pointer p-2 bg-blue-50/70 border border-blue-200">
                    <input
                      type="checkbox"
                      checked={broadcastChange}
                      onChange={(e) => setBroadcastChange(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-blue-950 flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        Hebahkan maklumat sesi ini kepada peserta (Cipta Pengumuman)
                      </span>
                      <span className="text-[10px] text-blue-800 block">
                        Pengumuman rasmi akan disiarkan terus ke portal peserta bagi memaklumkan jadual dan bilik terkini.
                      </span>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
                >
                  Simpan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-sm bg-white border-2 border-zinc-900 p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-black text-zinc-900 border-b border-zinc-200 pb-2">
              Tambah Hari Kursus (Hari {sortedDays.length + 1})
            </h3>
            <form onSubmit={handleAddDay} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">Tarikh</label>
                <input
                  type="date"
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  required
                  className="w-full p-2 text-xs border font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">Tema Hari</label>
                <input
                  type="text"
                  value={newDayTheme}
                  onChange={(e) => setNewDayTheme(e.target.value)}
                  placeholder="cth. Bengkel Amali & Pembentangan"
                  className="w-full p-2 text-xs border"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="px-3 py-1 text-xs text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-bold bg-zinc-900 text-white"
                >
                  Simpan Hari
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
