import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  FileText, 
  Coffee, 
  Users, 
  Bell, 
  Send, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  X,
  Sparkles
} from 'lucide-react';
import { Course, SessionItem, Announcement, AnnouncementPriority } from '../../types';

interface QuickOperationalUpdateModalProps {
  course: Course;
  sessions: SessionItem[];
  currentSession: SessionItem | null;
  nextSession: SessionItem | null;
  onPublishAnnouncement: (announcement: Announcement) => void;
  onUpdateSession: (session: SessionItem) => void;
  onClose: () => void;
}

type TemplateType = 'LOCATION_CHANGE' | 'SLIDES_LINK' | 'BREAK_REMINDER' | 'HALL_CALL' | 'CUSTOM';

export const QuickOperationalUpdateModal: React.FC<QuickOperationalUpdateModalProps> = ({
  course,
  sessions,
  currentSession,
  nextSession,
  onPublishAnnouncement,
  onUpdateSession,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('LOCATION_CHANGE');
  const [step, setStep] = useState<'COMPOSE' | 'REVIEW'>('COMPOSE');

  // Form states
  const defaultTargetSession = currentSession || nextSession || sessions[0];
  const [targetSessionId, setTargetSessionId] = useState<string>(defaultTargetSession?.id || '');
  
  // Specific inputs
  const [newLocation, setNewLocation] = useState<string>('');
  const [presentationUrl, setPresentationUrl] = useState<string>('');
  const [breakTime, setBreakTime] = useState<string>('15:30');
  const [breakLocation, setBreakLocation] = useState<string>('Restoran Foyer Aras 2');
  
  // Announcement fields
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [priority, setPriority] = useState<AnnouncementPriority>('URGENT');
  const [autoUpdateSchedule, setAutoUpdateSchedule] = useState<boolean>(true);

  const activeTargetSession = sessions.find(s => s.id === targetSessionId);

  // Apply template defaults
  const handleSelectTemplate = (type: TemplateType) => {
    setSelectedTemplate(type);
    const target = activeTargetSession || sessions[0];

    if (type === 'LOCATION_CHANGE') {
      setTitle(`Pindaan Lokasi: ${target ? target.title : 'Sesi Kursus'}`);
      setPriority('URGENT');
      setNewLocation(target?.location || '');
      setContent(
        `Dimaklumkan bahawa ${target ? `Sesi ${target.sessionNumber} (${target.title})` : 'sesi seterusnya'} kini akan diadakan di [Sila masukkan bilik/lokasi baharu]. Peserta diminta bergerak ke lokasi ini.`
      );
    } else if (type === 'SLIDES_LINK') {
      setTitle(`Slaid Pembentangan: ${target ? target.title : 'Sesi Terkini'}`);
      setPriority('NORMAL');
      setContent(
        `Pautan bahan dan slaid pembentangan bagi ${target ? `Sesi ${target.sessionNumber}` : 'sesi ini'} kini telah dimuat naik dan sedia diakses oleh semua peserta melalui tab Bahan Kursus.`
      );
    } else if (type === 'BREAK_REMINDER') {
      setTitle('Waktu Rehat & Minum Petang');
      setPriority('NORMAL');
      setContent(
        `Waktu rehat dan minum petang bermula pada jam ${breakTime}. Jamuan disediakan di ${breakLocation}. Sesi berikutnya akan bermula tepat pada jadual.`
      );
    } else if (type === 'HALL_CALL') {
      setTitle('Peringatan: Kembali ke Dewan Utama');
      setPriority('CRITICAL');
      setContent(
        `Perhatian kepada semua peserta kursus, rehat telah tamat. Sila ambil tempat di dewan utama sekarang untuk memulakan sesi seterusnya.`
      );
    } else {
      setTitle('');
      setContent('');
      setPriority('URGENT');
    }
  };

  // Sync content dynamically when target session changes for location or slides
  const handleSessionChange = (sessId: string) => {
    setTargetSessionId(sessId);
    const sess = sessions.find(s => s.id === sessId);
    if (!sess) return;

    if (selectedTemplate === 'LOCATION_CHANGE') {
      setTitle(`Pindaan Lokasi: ${sess.title}`);
      setContent(
        `Dimaklumkan bahawa Sesi ${sess.sessionNumber} (${sess.title}) kini akan diadakan di ${newLocation || '[Lokasi Baharu]'}. Peserta diminta mengambil tempat di dewan/bilik tersebut.`
      );
    } else if (selectedTemplate === 'SLIDES_LINK') {
      setTitle(`Slaid Pembentangan Sedia Diakses: ${sess.title}`);
      setContent(
        `Pautan bahan dan slaid pembentangan bagi Sesi ${sess.sessionNumber} (${sess.title}) kini telah dimuat naik dan sedia diakses oleh semua peserta.`
      );
    }
  };

  const handleLocationInputChange = (val: string) => {
    setNewLocation(val);
    if (activeTargetSession && selectedTemplate === 'LOCATION_CHANGE') {
      setContent(
        `Dimaklumkan bahawa Sesi ${activeTargetSession.sessionNumber} (${activeTargetSession.title}) kini akan diadakan di ${val || '[Lokasi Baharu]'}. Peserta diminta mengambil tempat di bilik/dewan tersebut.`
      );
    }
  };

  const handleBreakTimeChange = (val: string) => {
    setBreakTime(val);
    if (selectedTemplate === 'BREAK_REMINDER') {
      setContent(
        `Waktu rehat dan minum petang bermula pada jam ${val}. Jamuan disediakan di ${breakLocation}. Sesi berikutnya akan bermula tepat pada jadual.`
      );
    }
  };

  const handleBreakLocationChange = (val: string) => {
    setBreakLocation(val);
    if (selectedTemplate === 'BREAK_REMINDER') {
      setContent(
        `Waktu rehat dan minum petang bermula pada jam ${breakTime}. Jamuan disediakan di ${val}. Sesi berikutnya akan bermula tepat pada jadual.`
      );
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Sila lengkapkan tajuk dan kandungan kemaskini pantas.');
      return;
    }
    setStep('REVIEW');
  };

  const handleExecutePublish = () => {
    // 1. If auto-update schedule is toggled and we have an active target session
    if (autoUpdateSchedule && activeTargetSession) {
      if (selectedTemplate === 'LOCATION_CHANGE' && newLocation.trim()) {
        onUpdateSession({
          ...activeTargetSession,
          location: newLocation.trim(),
          updatedAt: new Date().toISOString(),
        });
      } else if (selectedTemplate === 'SLIDES_LINK' && presentationUrl.trim()) {
        let cleanUrl = presentationUrl.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = 'https://' + cleanUrl;
        }
        onUpdateSession({
          ...activeTargetSession,
          presentationUrl: cleanUrl,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Publish Announcement directly (no Master Admin bottleneck)
    const newAnnouncement: Announcement = {
      id: 'ann-quick-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId: course.id,
      title: title.trim(),
      content: content.trim(),
      priority,
      isPublic: true,
      publishedAt: new Date().toISOString(),
      authorUserId: 'organizer-current',
      authorName: 'Urus Setia Bertugas',
      relatedSessionId: activeTargetSession?.id,
      category: selectedTemplate === 'LOCATION_CHANGE' 
        ? 'LOCATION_CHANGE' 
        : selectedTemplate === 'SLIDES_LINK' 
        ? 'RESOURCES' 
        : selectedTemplate === 'BREAK_REMINDER' 
        ? 'SCHEDULE_CHANGE' 
        : 'URGENT',
      status: 'PUBLISHED',
    };

    onPublishAnnouncement(newAnnouncement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border-2 border-zinc-900 shadow-2xl space-y-4 my-8">
        
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-400 text-zinc-950 font-black rounded-xs">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                Kemaskini Pantas Operasi (Quick Operational Update)
              </h3>
              <p className="text-[11px] text-zinc-300">
                Aliran: CIPTA → SEMAK → TERBITKAN (Bebas Bottleneck Kelulusan)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator */}
        <div className="px-6 pt-2">
          <div className="flex items-center gap-3 text-xs font-bold border-b border-zinc-200 pb-3">
            <button
              onClick={() => setStep('COMPOSE')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                step === 'COMPOSE' 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-zinc-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center font-mono text-[11px]">
                1
              </span>
              <span>1. Sedia Templat Maklumat</span>
            </button>

            <span className="text-zinc-300">→</span>

            <button
              disabled={!title.trim()}
              onClick={() => title.trim() && setStep('REVIEW')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                step === 'REVIEW' 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-zinc-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center font-mono text-[11px]">
                2
              </span>
              <span>2. Pratonton & Terbitkan Serta-merta</span>
            </button>
          </div>
        </div>

        {/* STEP 1: COMPOSE */}
        {step === 'COMPOSE' && (
          <form onSubmit={handleReview} className="p-6 pt-2 space-y-4">
            {/* Quick Template Selector */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-2">
                Pilih Jenis Pindaan Operasi Pantas:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('LOCATION_CHANGE')}
                  className={`p-2.5 text-left border-2 text-xs flex flex-col justify-between gap-1 transition-all ${
                    selectedTemplate === 'LOCATION_CHANGE'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]'
                      : 'border-zinc-300 bg-white hover:border-zinc-900 text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Tukar Bilik / Dewan
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Pindah lokasi sesi kursus
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('SLIDES_LINK')}
                  className={`p-2.5 text-left border-2 text-xs flex flex-col justify-between gap-1 transition-all ${
                    selectedTemplate === 'SLIDES_LINK'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]'
                      : 'border-zinc-300 bg-white hover:border-zinc-900 text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Pautan Slaid / Bahan
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Muat naik pautan pembentang
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('BREAK_REMINDER')}
                  className={`p-2.5 text-left border-2 text-xs flex flex-col justify-between gap-1 transition-all ${
                    selectedTemplate === 'BREAK_REMINDER'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]'
                      : 'border-zinc-300 bg-white hover:border-zinc-900 text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    Waktu Minum / Rehat
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Masa & lokasi santapan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('HALL_CALL')}
                  className={`p-2.5 text-left border-2 text-xs flex flex-col justify-between gap-1 transition-all ${
                    selectedTemplate === 'HALL_CALL'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]'
                      : 'border-zinc-300 bg-white hover:border-zinc-900 text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <Users className="w-3.5 h-3.5 text-red-600" />
                    Kembali ke Dewan
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Panggilan segera masuk sesi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('CUSTOM')}
                  className={`p-2.5 text-left border-2 text-xs flex flex-col justify-between gap-1 transition-all sm:col-span-2 ${
                    selectedTemplate === 'CUSTOM'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]'
                      : 'border-zinc-300 bg-white hover:border-zinc-900 text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <Bell className="w-3.5 h-3.5 text-purple-600" />
                    Hebahan Khas / Bebas
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Tulis arahan operasi khas urus setia
                  </span>
                </button>
              </div>
            </div>

            {/* Template Specific Inputs */}
            {(selectedTemplate === 'LOCATION_CHANGE' || selectedTemplate === 'SLIDES_LINK') && (
              <div className="bg-zinc-50 border-2 border-zinc-200 p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Pilih Sesi Sasaran:
                    </label>
                    <select
                      value={targetSessionId}
                      onChange={(e) => handleSessionChange(e.target.value)}
                      className="w-full p-2 text-xs border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden font-medium"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          Hari {s.dayNumber} [Sesi {s.sessionNumber}] - {s.title} ({s.startTime}-{s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplate === 'LOCATION_CHANGE' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">
                        Bilik / Lokasi Baharu: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => handleLocationInputChange(e.target.value)}
                        placeholder="cth. Bilik Seminar Mawar Aras 3"
                        className="w-full p-2 text-xs border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden font-medium"
                        required
                      />
                    </div>
                  )}

                  {selectedTemplate === 'SLIDES_LINK' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">
                        Pautan Slaid (URL): <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={presentationUrl}
                        onChange={(e) => setPresentationUrl(e.target.value)}
                        placeholder="cth. https://docs.google.com/presentation/d/..."
                        className="w-full p-2 text-xs border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden font-mono"
                        required
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-blue-900 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoUpdateSchedule}
                    onChange={(e) => setAutoUpdateSchedule(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                  />
                  <span>
                    Kemaskini jadual rasmi sesi ini secara automatik (DCOREV1 Single Authoritative Source)
                  </span>
                </label>
              </div>
            )}

            {selectedTemplate === 'BREAK_REMINDER' && (
              <div className="bg-zinc-50 border-2 border-zinc-200 p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Waktu Bermula Rehat:
                    </label>
                    <input
                      type="time"
                      value={breakTime}
                      onChange={(e) => handleBreakTimeChange(e.target.value)}
                      className="w-full p-2 text-xs border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Lokasi Jamuan:
                    </label>
                    <input
                      type="text"
                      value={breakLocation}
                      onChange={(e) => handleBreakLocationChange(e.target.value)}
                      placeholder="cth. Restoran Foyer Aras 2"
                      className="w-full p-2 text-xs border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Announcement Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tajuk Hebahan Kepada Peserta: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tajuk pengumuman ringkas dan padat"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tahap Keutamaan:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-bold bg-white"
                >
                  <option value="NORMAL">NORMAL (Makluman Am)</option>
                  <option value="IMPORTANT">IMPORTANT (Perhatian Penting)</option>
                  <option value="URGENT">URGENT (Penting / Tindakan)</option>
                  <option value="CRITICAL">CRITICAL (Segera / Kecemasan)</option>
                </select>
              </div>
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Mesej Kandungan: <span className="text-red-600">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Arahan terperinci untuk peserta..."
                className="w-full p-2.5 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden leading-relaxed"
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Operasi penganjur boleh diterbitkan terus tanpa kelulusan Master Admin.
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Semak Pratonton →</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW & PUBLISH */}
        {step === 'REVIEW' && (
          <div className="p-6 pt-2 space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Sila sahkan maklumat di bawah sebelum menerbitkan. Mesej ini akan terus dipaparkan di portal peserta secara masa-nyata.
              </span>
            </div>

            {/* Live Participant View Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold uppercase text-zinc-700">
                  Pratonton Paparan Peserta (Participant Live View):
                </span>
                <span className="text-[10px] font-mono bg-zinc-200 px-2 py-0.5 text-zinc-800">
                  /course/{course.slug}
                </span>
              </div>

              <div className={`p-4 border-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] bg-white ${
                priority === 'CRITICAL' 
                  ? 'border-red-600 bg-red-50/40' 
                  : priority === 'URGENT' 
                  ? 'border-amber-500 bg-amber-50/40' 
                  : 'border-zinc-900'
              }`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${
                    priority === 'CRITICAL'
                      ? 'bg-red-600 text-white border-red-700'
                      : priority === 'URGENT'
                      ? 'bg-amber-500 text-zinc-950 border-amber-600'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                  }`}>
                    {priority}
                  </span>

                  <span className="text-xs font-mono text-zinc-500">
                    Sebentar Tadi • Urus Setia Bertugas
                  </span>

                  {activeTargetSession && (
                    <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 border border-blue-200">
                      Hari {activeTargetSession.dayNumber} : Sesi {activeTargetSession.sessionNumber}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-zinc-950 mb-1">
                  {title}
                </h4>

                <p className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>

                {/* Additional badge if schedule session will be auto-updated */}
                {autoUpdateSchedule && activeTargetSession && selectedTemplate === 'LOCATION_CHANGE' && newLocation && (
                  <div className="mt-3 pt-2 border-t border-zinc-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jadual Sesi {activeTargetSession.sessionNumber} dikemaskini ke: {newLocation}</span>
                  </div>
                )}

                {autoUpdateSchedule && activeTargetSession && selectedTemplate === 'SLIDES_LINK' && presentationUrl && (
                  <div className="mt-3 pt-2 border-t border-zinc-200 text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pautan Slaid dilampirkan terus ke Sesi {activeTargetSession.sessionNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setStep('COMPOSE')}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 font-bold"
              >
                ← Ubah Maklumat
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecutePublish}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Terbitkan Serta-Merta (Live)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
