import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send,
  Sparkles,
  Lock,
  Globe,
  Search,
  Filter,
  Calendar,
  X,
  Share2,
  Copy,
  Check,
  FileText,
  MapPin,
  Coffee,
  MessageSquare
} from 'lucide-react';
import { Announcement, Course, SessionItem, ResourceMaterial, AnnouncementPriority, AnnouncementCategory } from '../../types';
import { getPriorityMeta, getCategoryLabel, formatWhatsAppAnnouncement } from '../../utils/communicationHelpers';

interface AnnouncementsTabProps {
  course: Course;
  announcements: Announcement[];
  sessions?: SessionItem[];
  resources?: ResourceMaterial[];
  onSaveAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  course,
  announcements,
  sessions = [],
  resources = [],
  onSaveAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | AnnouncementPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AnnouncementCategory>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState<AnnouncementCategory>('GENERAL');
  const [relatedSessionId, setRelatedSessionId] = useState<string>('');
  const [relatedResourceId, setRelatedResourceId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // WhatsApp copy toast
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setPriority('NORMAL');
    setIsPublic(true);
    setCategory('GENERAL');
    setRelatedSessionId('');
    setRelatedResourceId('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setPriority(ann.priority);
    setIsPublic(ann.isPublic);
    setCategory(ann.category || 'GENERAL');
    setRelatedSessionId(ann.relatedSessionId || '');
    setRelatedResourceId(ann.relatedResourceId || '');
    setFormError('');
    setShowModal(true);
  };

  // Quick Template Injector
  const applyTemplate = (type: 'LOCATION' | 'SLIDES' | 'BREAK' | 'HALL') => {
    const defaultSession = sessions[0];
    if (type === 'LOCATION') {
      setTitle(defaultSession ? `Pindaan Bilik: Sesi ${defaultSession.sessionNumber} (${defaultSession.title})` : 'Pindaan Lokasi / Bilik Sesi');
      setCategory('LOCATION_CHANGE');
      setPriority('IMPORTANT');
      setContent(
        `Dimaklumkan bahawa ${defaultSession ? `Sesi ${defaultSession.sessionNumber}` : 'sesi kursus'} kini berpindah ke bilik/dewan baharu. Sila pastikan semua peserta berkumpul di lokasi terkini seperti yang tertera dalam jadual.`
      );
      if (defaultSession) setRelatedSessionId(defaultSession.id);
    } else if (type === 'SLIDES') {
      setTitle('Slaid Pembentangan Sedia Dimuat Turun');
      setCategory('RESOURCES');
      setPriority('NORMAL');
      setContent(
        'Bahan edaran dan slaid pembentangan bagi sesi hari ini telah dimuat naik. Peserta boleh mengakses dan memuat turun bahan melalui tab Bahan Kursus.'
      );
    } else if (type === 'BREAK') {
      setTitle('Waktu Rehat & Minum');
      setCategory('SCHEDULE_CHANGE');
      setPriority('NORMAL');
      setContent(
        'Sesi rehat dan jamuan minum telah bermula di ruang legar/foyer aras utama. Sesi seterusnya akan bermula tepat pada waktu jadual yang ditetapkan.'
      );
    } else if (type === 'HALL') {
      setTitle('Peringatan Segera: Sila Ambil Tempat di Dewan Utama');
      setCategory('URGENT');
      setPriority('URGENT');
      setContent(
        'Perhatian kepada semua peserta, waktu rehat telah tamat. Mohon semua peserta segera kembali dan mengambil tempat di dewan utama untuk meneruskan sesi.'
      );
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length < 3) {
      setFormError('Tajuk pengumuman mestilah sekurang-kurangnya 3 aksara.');
      return;
    }
    if (cleanContent.length < 5) {
      setFormError('Kandungan pengumuman mestilah sekurang-kurangnya 5 aksara.');
      return;
    }

    const payload: Announcement = {
      id: editingAnnouncement?.id || 'ann-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId: course.id,
      title: cleanTitle,
      content: cleanContent,
      priority,
      isPublic,
      publishedAt: editingAnnouncement?.publishedAt || new Date().toISOString(),
      updatedAt: editingAnnouncement ? new Date().toISOString() : undefined,
      authorUserId: 'organizer-current',
      authorName: 'Urus Setia Bertugas',
      category,
      relatedSessionId: relatedSessionId || undefined,
      relatedResourceId: relatedResourceId || undefined,
      status: 'PUBLISHED',
    };

    onSaveAnnouncement(payload);
    setShowModal(false);
  };

  const handleCopyWhatsApp = (ann: Announcement) => {
    const linkedSession = sessions.find(s => s.id === ann.relatedSessionId);
    const linkedResource = resources.find(r => r.id === ann.relatedResourceId);
    const text = formatWhatsAppAnnouncement(course, ann, linkedSession, linkedResource);

    navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredAnnouncements = (announcements || []).filter(ann => {
    const matchesPriority = priorityFilter === 'ALL' || ann.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || ann.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-zinc-800" />
              <span>Pengumuman & Makluman Langsung ({announcements.length})</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              BEBAS BOTTLENECK (TERUS KE PESERTA)
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Hebahan segera untuk peserta kursus. Terus kelihatan di portal peserta dan boleh disalin untuk WhatsApp.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold border-2 border-zinc-900 hover:bg-blue-700 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cipta Pengumuman</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengumuman mengikut tajuk atau kandungan..."
              className="w-full pl-9 pr-3 py-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Keutamaan:</span>
            {(['ALL', 'NORMAL', 'IMPORTANT', 'URGENT'] as const).map((p) => {
              const label = p === 'ALL' ? 'Semua' : p === 'NORMAL' ? 'Biasa' : p === 'IMPORTANT' ? 'Penting' : 'Segera';
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p as any)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all ${
                    priorityFilter === p
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Kategori:</span>
          {(['ALL', 'GENERAL', 'LOCATION_CHANGE', 'SCHEDULE_CHANGE', 'RESOURCES', 'URGENT'] as const).map((c) => {
            const label = c === 'ALL' ? 'Semua Kategori' : getCategoryLabel(c);
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c as any)}
                className={`px-2.5 py-1 text-[11px] font-bold border rounded-full whitespace-nowrap transition-colors ${
                  categoryFilter === c
                    ? 'bg-blue-50 border-blue-600 text-blue-900'
                    : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Announcements Feed */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3">
          <Bell className="w-10 h-10 text-zinc-400 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 uppercase">
            Tiada Pengumuman Ditemui
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {announcements.length === 0
              ? 'Gunakan modul ini untuk menyampaikan info pendaftaran, perubahan bilik/dewan, atau peringatan muat turun bahan kepada peserta.'
              : 'Tiada pengumuman sepadan dengan carian atau penapis keutamaan.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
          >
            + Terbitkan Pengumuman Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((ann) => {
            const linkedSession = sessions.find(s => s.id === ann.relatedSessionId);
            const linkedResource = resources.find(r => r.id === ann.relatedResourceId);
            const meta = getPriorityMeta(ann.priority);
            const catLabel = getCategoryLabel(ann.category);
            const isCopied = copiedId === ann.id;

            return (
              <div
                key={ann.id}
                className={`bg-white border-2 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all ${meta.cardBorder} ${meta.cardBg}`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                      {meta.label}
                    </span>

                    <span className="text-[10px] font-mono font-bold text-zinc-700 bg-zinc-200 px-1.5 py-0.5 uppercase">
                      {catLabel}
                    </span>

                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.publishedAt).toLocaleString('ms-MY')}
                    </span>

                    {ann.updatedAt && (
                      <span className="text-[10px] font-mono text-amber-700 italic font-bold">
                        (Dikemaskini)
                      </span>
                    )}

                    {ann.isPublic ? (
                      <span className="text-[10px] text-blue-700 flex items-center gap-1 font-semibold">
                        <Globe className="w-3 h-3" />
                        Awam (Semua Peserta)
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Dalaman Sahaja
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-zinc-900">
                    {ann.title}
                  </h4>

                  <p className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>

                  {/* Linked Single Source of Truth References */}
                  {(linkedSession || linkedResource) && (
                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                      {linkedSession && (
                        <div className="p-2 bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-900">
                          <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="font-medium">
                            <strong>Sesi Terlibat:</strong> Hari {linkedSession.dayNumber} [Sesi {linkedSession.sessionNumber}] — {linkedSession.title} 
                            {linkedSession.location && ` (${linkedSession.location})`}
                          </span>
                        </div>
                      )}

                      {linkedResource && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900">
                          <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-medium">
                            <strong>Bahan Terpaut:</strong> {linkedResource.title} ({linkedResource.category})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleCopyWhatsApp(ann)}
                    className="px-2.5 py-1 text-xs font-bold border border-zinc-300 hover:border-zinc-900 bg-white hover:bg-zinc-50 flex items-center gap-1 text-zinc-800 transition-colors"
                    title="Salin mesej untuk diedarkan ke WhatsApp peserta"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Disalin!' : 'Salin WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(ann)}
                    className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded border border-transparent hover:border-zinc-300"
                    title="Sunting Pengumuman"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Padam pengumuman "${ann.title}"? Tindakan ini adalah kekal.`)) {
                        onDeleteAnnouncement(ann.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                    title="Padam Pengumuman Secara Kekal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center overflow-y-auto">
          <div className="w-full max-w-xl bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>{editingAnnouncement ? 'Sunting Pengumuman Kursus' : 'Terbitkan Pengumuman Baharu'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Ribbon */}
            {!editingAnnouncement && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Templat Pantas Urus Setia (Klik untuk Isi Pantas):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('LOCATION')}
                    className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-[11px] font-bold text-zinc-800 flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-red-600" />
                    <span>Pindaan Bilik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('SLIDES')}
                    className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-[11px] font-bold text-zinc-800 flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span>Slaid Pembentangan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('BREAK')}
                    className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-[11px] font-bold text-zinc-800 flex items-center gap-1"
                  >
                    <Coffee className="w-3 h-3 text-amber-600" />
                    <span>Waktu Rehat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('HALL')}
                    className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-[11px] font-bold text-zinc-800 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>Kembali ke Dewan</span>
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tajuk Pengumuman <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                  placeholder="cth. Pindaan Bilik Kuliah Sesi 4 ke Dewan Mawar"
                  className="w-full p-2.5 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Tahap Keutamaan (Priority)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                    className="w-full p-2.5 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="NORMAL">NORMAL (Makluman Am / Rutin)</option>
                    <option value="IMPORTANT">IMPORTANT (Perhatian Penting)</option>
                    <option value="URGENT">URGENT (Tindakan Segera / Cemas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Kategori Hebahan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full p-2.5 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="GENERAL">Makluman Am</option>
                    <option value="LOCATION_CHANGE">Pindaan Bilik / Lokasi</option>
                    <option value="SCHEDULE_CHANGE">Pindaan Waktu / Jadual</option>
                    <option value="RESOURCES">Bahan & Slaid Pembentangan</option>
                    <option value="URGENT">Arahan Penting Segera</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Pautkan ke Sesi (Pilihan)
                  </label>
                  <select
                    value={relatedSessionId}
                    onChange={(e) => setRelatedSessionId(e.target.value)}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="">-- Tiada Pautan Sesi (Umum) --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Hari {s.dayNumber} [Sesi {s.sessionNumber}] - {s.title}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Membolehkan peserta melihat maklumat lokasi terkini sesi secara langsung.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Pautkan ke Bahan Kursus (Pilihan)
                  </label>
                  <select
                    value={relatedResourceId}
                    onChange={(e) => setRelatedResourceId(e.target.value)}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="">-- Tiada Pautan Bahan --</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.category})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Menyediakan capaian satu-klik ke bahan rujukan atau fail.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Kandungan Pengumuman <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                  rows={4}
                  placeholder="Tuliskan butiran arahan, lokasi baharu, atau panduan kepada peserta..."
                  className="w-full p-2.5 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <span className="text-[11px] text-zinc-500 italic">
                  * Terus disiarkan tanpa kelulusan Master Admin.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 font-bold border border-zinc-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingAnnouncement ? 'Simpan Pindaan' : 'Terbitkan Sekarang'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
