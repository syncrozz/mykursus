import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Edit, 
  Link, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';
import { Course, ResourceMaterial, SessionItem, Announcement } from '../../types';
import { Bell } from 'lucide-react';

interface ResourcesTabProps {
  course: Course;
  resources: ResourceMaterial[];
  sessions: SessionItem[];
  onSaveResource: (resource: ResourceMaterial) => void;
  onDeleteResource: (id: string) => void;
  onPublishAnnouncement?: (announcement: Announcement) => void;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  course,
  resources,
  sessions,
  onSaveResource,
  onDeleteResource,
  onPublishAnnouncement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceMaterial | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'SLIDES' | 'DOCUMENT' | 'TEMPLATE' | 'EXTERNAL_LINK'>('SLIDES');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSizeMb, setFileSizeMb] = useState<number | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [broadcastResource, setBroadcastResource] = useState(false);

  const openAddModal = () => {
    setEditingResource(null);
    setTitle('');
    setCategory('SLIDES');
    setFileUrl('');
    setFileSizeMb(undefined);
    setSessionId('');
    setIsPublic(true);
    setBroadcastResource(false);
    setShowModal(true);
  };

  const openEditModal = (res: ResourceMaterial) => {
    setEditingResource(res);
    setTitle(res.title);
    setCategory(res.category);
    setFileUrl(res.fileUrl);
    setFileSizeMb(res.fileSizeMb);
    setSessionId(res.sessionId || '');
    setIsPublic(res.isPublic);
    setBroadcastResource(false);
    setShowModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    let cleanUrl = fileUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const finalResourceId = editingResource?.id || 'res-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const payload: ResourceMaterial = {
      id: finalResourceId,
      courseId: course.id,
      title: title.trim(),
      category,
      fileUrl: cleanUrl,
      fileSizeMb: fileSizeMb ? Number(fileSizeMb) : undefined,
      sessionId: sessionId || undefined,
      isPublic,
      createdAt: editingResource?.createdAt || new Date().toISOString(),
    };

    onSaveResource(payload);

    if (broadcastResource && onPublishAnnouncement) {
      const linkedSession = sessions.find(s => s.id === sessionId);
      onPublishAnnouncement({
        id: 'ann-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        courseId: course.id,
        title: `Bahan Baharu: ${title.trim()}`,
        content: `Bahan kursus baharu telah dimuat naik untuk peserta: "${title.trim()}". Sila buka tab Bahan Kursus untuk memuat turun atau membaca rujukan tersebut.${linkedSession ? ` (Berkaitan Hari ${linkedSession.dayNumber} [Sesi ${linkedSession.sessionNumber}])` : ''}`,
        priority: 'NORMAL',
        category: 'RESOURCES',
        relatedResourceId: finalResourceId,
        relatedSessionId: sessionId || undefined,
        isPublic: true,
        publishedAt: new Date().toISOString(),
        authorUserId: 'organizer-current',
        authorName: 'Urus Setia Bahan',
        status: 'PUBLISHED',
      });
    }

    setShowModal(false);
  };

  const filteredResources = (resources || []).filter(r => {
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fileUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-900" />
              <span>Pengurusan Bahan, Slaid & Pautan Kursus ({resources.length})</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              TERBIT LANGSUNG (LIVE)
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Muat naik pautan slaid pembentangan Google Slides/Canva, dokumen PDF rujukan, templat tugasan dan fail sokongan.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold border-2 border-zinc-900 hover:bg-blue-700 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Bahan / Slaid</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tajuk bahan atau pautan..."
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'SLIDES', 'DOCUMENT', 'TEMPLATE', 'EXTERNAL_LINK'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all ${
                categoryFilter === cat
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
              }`}
            >
              {cat === 'ALL' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3">
          <FileText className="w-10 h-10 text-zinc-400 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 uppercase">
            Tiada Bahan Rujukan Ditemui
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {resources.length === 0 
              ? 'Belum ada sebarang fail slaid atau pautan rujukan diterbitkan bagi kursus ini.'
              : 'Tiada bahan menepati carian atau tapisan kategori.'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
          >
            + Terbitkan Bahan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => {
            const linkedSession = sessions.find(s => s.id === res.sessionId);

            return (
              <div
                key={res.id}
                className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${
                      res.category === 'SLIDES'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : res.category === 'DOCUMENT'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : res.category === 'TEMPLATE'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-purple-100 text-purple-900 border-purple-300'
                    }`}>
                      {res.category}
                    </span>

                    {linkedSession ? (
                      <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 border border-zinc-300">
                        Hari {linkedSession.dayNumber} • Sesi {linkedSession.sessionNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">
                        Bahan Umum Kursus
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-zinc-950">
                    {res.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono break-all">
                    <Link className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate"
                    >
                      {res.fileUrl}
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-2">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uji Pautan ↗</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(res)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded"
                      title="Sunting"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Padam bahan "${res.title}"?`)) {
                          onDeleteResource(res.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Padam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-lg bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 uppercase">
                {editingResource ? 'Sunting Bahan Kursus' : 'Terbitkan Bahan / Slaid Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tajuk Dokumen / Slaid: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Slaid Pembentangan Sesi 2: Rubrik Penilaian PBL"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Kategori Bahan:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                  >
                    <option value="SLIDES">SLIDES (Slaid Pembentangan)</option>
                    <option value="DOCUMENT">DOCUMENT (PDF / Garis Panduan)</option>
                    <option value="TEMPLATE">TEMPLATE (Templat / Borang)</option>
                    <option value="EXTERNAL_LINK">EXTERNAL_LINK (Portal Luar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Pautkan ke Sesi (Pilihan):
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                  >
                    <option value="">-- Tiada (Bahan Umum) --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Hari {s.dayNumber} [Sesi {s.sessionNumber}] - {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Pautan URL Fail / Dokumen: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/... atau https://drive.google.com/..."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  required
                />
              </div>

              {onPublishAnnouncement && (
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer p-2 bg-emerald-50/70 border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={broadcastResource}
                      onChange={(e) => setBroadcastResource(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5 text-emerald-600" />
                        Hebahkan bahan baharu ini kepada peserta (Cipta Pengumuman)
                      </span>
                      <span className="text-[10px] text-emerald-800 block">
                        Peserta akan menerima notifikasi pautan pantas ke dokumen/slaid ini.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {editingResource ? 'Simpan Pindaan' : 'Terbitkan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
