import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  Building2,
  X,
  ShieldCheck
} from 'lucide-react';
import { Organizer, Course, UserRole } from '../../types';

interface OrganizerManagementProps {
  organizers: Organizer[];
  courses: Course[];
  currentRole: UserRole;
  onSaveOrganizer: (organizer: Organizer) => void;
  onDeleteOrganizer: (id: string) => void;
  onSelectCourse: (course: Course) => void;
}

export const OrganizerManagement: React.FC<OrganizerManagementProps> = ({
  organizers,
  courses,
  currentRole,
  onSaveOrganizer,
  onDeleteOrganizer,
  onSelectCourse,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkAuth = (): boolean => {
    if (currentRole !== UserRole.MASTER_ADMIN) {
      alert(`AKSES DITOLAK: Peranan "${currentRole}" tidak dibenarkan mengurus penganjur platform!`);
      return false;
    }
    return true;
  };

  const handleCreateOrganizer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth()) return;

    if (!name.trim() || !code.trim() || !email.trim()) {
      setError('Sila lengkapkan Nama Organisasi, Kod Penganjur, dan Emel.');
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (organizers.some(o => o.code.toUpperCase() === cleanCode)) {
      setError(`Kod penganjur "${cleanCode}" telah digunakan.`);
      return;
    }

    const newOrg: Organizer = {
      id: 'org-' + Date.now(),
      name: name.trim(),
      code: cleanCode,
      contactEmail: email.trim(),
      contactPhone: phone.trim(),
      pin: pin.trim() || '1234',
      description: description.trim(),
      memberUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveOrganizer(newOrg);
    setShowAddModal(false);
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setPin('1234');
    setDescription('');
    setError(null);
  };

  const handleDelete = (org: Organizer) => {
    if (!checkAuth()) return;
    const orgCourses = courses.filter(c => c.organizerId === org.id);
    if (orgCourses.length > 0) {
      alert(`Tidak boleh memadam penganjur "${org.name}" kerana terdapat ${orgCourses.length} kursus yang ditugaskan kepada mereka. Sila agihkan semula kursus terlebih dahulu.`);
      return;
    }

    if (window.confirm(`Adakah anda pasti mahu memadam penganjur "${org.name}" secara kekal?`)) {
      onDeleteOrganizer(org.id);
    }
  };

  return (
    <div className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-xs flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b-2 border-zinc-900">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950">
            Pengurusan Penganjur Kursus ({organizers.length})
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Entiti penganjur rasmi yang mengurus dan menerbitkan kursus di platform MyKursus.
          </p>
        </div>

        <button
          onClick={() => {
            if (checkAuth()) {
              setShowAddModal(true);
            }
          }}
          className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Daftar Penganjur Baru</span>
        </button>
      </div>

      {/* Organizer List */}
      {organizers.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-300 text-zinc-500 flex flex-col items-center justify-center gap-2">
          <Building2 className="w-8 h-8 text-zinc-300" />
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-700">
            Tiada organizer tersedia.
          </p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Klik &quot;Daftar Penganjur Baru&quot; untuk mewujudkan entiti penganjur pertama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizers.map((org) => {
            const orgCourses = courses.filter(c => c.organizerId === org.id);
            return (
              <div 
                key={org.id} 
                className="p-4 border-2 border-zinc-900 bg-white flex flex-col justify-between hover:border-zinc-950 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-zinc-900 text-white uppercase">
                        {org.code}
                      </span>
                      <h4 className="text-sm font-black text-zinc-950 uppercase mt-1">
                        {org.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDelete(org)}
                      title="Padam Penganjur"
                      className="text-zinc-400 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {org.description && (
                    <p className="text-xs text-zinc-600 mb-3 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-zinc-600 border-t border-zinc-100 pt-2 font-mono">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{org.contactEmail}</span>
                    </p>
                    <p className="flex items-center justify-between text-[11px] text-zinc-700 bg-zinc-50 px-2 py-0.5 border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold">PIN Akses:</span>
                      <span className="font-bold text-emerald-700 font-mono tracking-wider">{org.pin || '1234'}</span>
                    </p>
                    {org.contactPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{org.contactPhone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-zinc-100">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Kursus Dimiliki:
                    </span>
                    <span className="font-bold text-zinc-900 px-1.5 py-0.2 bg-zinc-100 border border-zinc-300">
                      {orgCourses.length}
                    </span>
                  </div>

                  {orgCourses.length > 0 ? (
                    <div className="space-y-1">
                      {orgCourses.map((c, idx) => (
                        <div 
                          key={`${c.id}-${idx}`}
                          onClick={() => onSelectCourse(c)}
                          className="text-[11px] font-medium text-zinc-800 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 truncate"
                        >
                          <BookOpen className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic">Tiada kursus ditugaskan.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Organizer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-zinc-900" />
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
                Daftar Penganjur Baru
              </h3>
            </div>

            {error && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-800 text-red-900 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrganizer} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Nama Penuh Organisasi / Bahagian *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Pusat Pembangunan Kemahiran Insaniah"
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Kod Singkatan Penganjur *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="cth. PPKI"
                  className="w-full text-xs font-mono font-bold p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Emel Perhubungan Rasmi *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ppki@kptm.edu.my"
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  PIN Keselamatan Log Masuk Penganjur (Lalai: 1234)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full text-xs font-mono font-bold p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Digunakan oleh penganjur untuk log masuk ke Ruang Penganjur.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  No. Telefon
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+603-9283 7188"
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Keterangan / Skop Penganjur
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan peranan penganjur..."
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2 text-xs font-bold uppercase bg-zinc-100 border border-zinc-900 text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-bold uppercase bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-800"
                >
                  Daftar Penganjur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
