import React, { useState } from 'react';
import { 
  PlusCircle, 
  X, 
  Calendar, 
  MapPin, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { Course, CourseModuleKey, CourseModuleConfig, Organizer } from '../../types';

interface CreateCourseModalProps {
  currentOrganizer: Organizer;
  onSaveDraft: (courseData: Partial<Course>) => void;
  onClose: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  currentOrganizer,
  onSaveDraft,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [instructions, setInstructions] = useState('');

  // Pluggable Modules
  const [enabledModules, setEnabledModules] = useState<Record<CourseModuleKey, boolean>>({
    [CourseModuleKey.OVERVIEW]: true,
    [CourseModuleKey.SCHEDULE]: true,
    [CourseModuleKey.SESSIONS]: true,
    [CourseModuleKey.PARTICIPANTS]: true,
    [CourseModuleKey.ANNOUNCEMENTS]: true,
    [CourseModuleKey.ACCOMMODATION]: true,
    [CourseModuleKey.VENUE_LOGISTICS]: true,
    [CourseModuleKey.WIFI_ACCESS]: true,
    [CourseModuleKey.TRAVEL_MEALS]: false,
    [CourseModuleKey.SECRETARIAT]: true,
    [CourseModuleKey.RESOURCES]: false,
  });

  const [errors, setErrors] = useState<{ title?: string }>({});

  // Computed slug preview
  const previewSlug = (customSlug || title || 'kursus-baharu')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const toggleModule = (key: CourseModuleKey) => {
    setEnabledModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'Tajuk kursus diperlukan untuk menyimpan draf.' });
      return;
    }

    // Build modules array
    const modules: CourseModuleConfig[] = Object.entries(enabledModules).map(([key, enabled], index) => ({
      key: key as CourseModuleKey,
      enabled: Boolean(enabled),
      order: index + 1
    }));

    onSaveDraft({
      title: title.trim(),
      subtitle: subtitle.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      instructions: instructions.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || startDate || new Date().toISOString().split('T')[0],
      venueName: venueName.trim() || 'Lokasi Akan Ditentukan',
      venueAddress: venueAddress.trim(),
      slug: previewSlug,
      organizerId: currentOrganizer.id, // Strictly tied to current organizer
      modules,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 p-3 sm:p-6 backdrop-blur-xs flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white border-2 border-zinc-900 shadow-2xl my-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-4 sm:p-5 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-bold text-white border border-blue-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Cipta Kursus Baharu (Draf)</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  STATUS: DRAFT
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Penganjur Berdaftar: <strong className="text-white">{currentOrganizer.name}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white p-1"
            title="Tutup Borang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Ownership Notice */}
          <div className="bg-blue-50 border border-blue-300 p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Ketetapan Hak Milik DCOREV1:</strong> Kursus ini akan diikat secara automatik kepada akaun organisasi anda (<strong>{currentOrganizer.name}</strong>). Hak milik tidak boleh dipindah milik sewenang-wenangnya.
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-1.5">
              <FileText className="w-4 h-4 text-zinc-700" />
              1. Maklumat Asas Kursus
            </h3>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Tajuk Kursus <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({});
                }}
                placeholder="cth. Kursus Transformasi Pedagogi MPU2412 KIAR"
                className={`w-full p-2.5 text-sm border-2 ${errors.title ? 'border-red-600 bg-red-50' : 'border-zinc-300 focus:border-zinc-900'} focus:outline-hidden font-medium`}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Kod Kursus / Rujukan (Pilihan)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="cth. MPU2412 atau KPTM-2026-09"
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tajuk Kecil / Kategori (Pilihan)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="cth. Bengkel Latihan Pensyarah"
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Penerangan Ringkas / Sinopsis Kursus
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Penerangan objektif dan hasil pembelajaran kursus..."
                className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Dates & Venue */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-1.5">
              <Calendar className="w-4 h-4 text-zinc-700" />
              2. Tarikh & Lokasi (Boleh Dikemaskini Sebelum Dihantar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tarikh Mula
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tarikh Tamat
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Nama Lokasi / Tempat Kursus
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="cth. Tamu Hotel & Suites Kuala Lumpur"
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Alamat Lengkap (Pilihan)
                </label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="cth. 120 Jalan Raja Abdullah, Kampung Baru, 50300 KL"
                  className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: URL Slug Configuration */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-1.5">
              <Sparkles className="w-4 h-4 text-zinc-700" />
              3. Pautan URL Unik Peserta (Option A Public Slug)
            </h3>
            <div className="bg-zinc-100 p-3 border border-zinc-300 flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-500 select-none">/course/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={previewSlug}
                className="flex-1 bg-white px-2 py-1 border border-zinc-300 font-bold text-blue-700 focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Pautan ini akan digunakan oleh peserta untuk mengakses maklumat kursus secara terus.
            </p>
          </div>

          {/* Section 4: Pluggable Modules Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-1.5">
              <Sliders className="w-4 h-4 text-zinc-700" />
              4. Modul Operasi Aktif (Pilihan Bebas Penganjur)
            </h3>
            <p className="text-xs text-zinc-600">
              Pilih modul yang bersesuaian dengan keperluan kursus anda. Modul yang dinyahaktif tidak akan memaparkan UI yang kosong:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { key: CourseModuleKey.ACCOMMODATION, label: 'Penginapan & Bilik', desc: 'Bilik hotel & rakan sebilik peserta' },
                { key: CourseModuleKey.WIFI_ACCESS, label: 'Akses Wi-Fi', desc: 'Kata laluan Wi-Fi & rangkaian' },
                { key: CourseModuleKey.SECRETARIAT, label: 'Urus Setia', desc: 'Nombor pegawai & talian bantuan' },
                { key: CourseModuleKey.ANNOUNCEMENTS, label: 'Pengumuman Langsung', desc: 'Hebahan pantas tanpa sekatan kelulusan' },
                { key: CourseModuleKey.SESSIONS, label: 'Sesi & Penceramah', desc: 'Jadual terperinci & pautan slaid' },
                { key: CourseModuleKey.TRAVEL_MEALS, label: 'Tuntutan & Makanan', desc: 'Maklumat makan minum & tiket perjalanan' },
              ].map((m) => (
                <label
                  key={m.key}
                  className={`p-3 border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    enabledModules[m.key]
                      ? 'bg-blue-50/50 border-blue-600 text-zinc-900'
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledModules[m.key] || false}
                    onChange={() => toggleModule(m.key)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-zinc-500 leading-tight">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t-2 border-zinc-900 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-zinc-400" />
              <span>Draf boleh disimpan bila-bila masa dan disambung kemudian.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 border border-zinc-300 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 border-2 border-zinc-900 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simpan Sebagai Draf (Save Draft)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
