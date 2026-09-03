import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lock,
  Sparkles
} from 'lucide-react';
import { Course, ApprovalStatus } from '../../types';

interface CourseInfoTabProps {
  course: Course;
  onUpdateCourse: (updates: Partial<Course>) => void;
  onRequestOfficialChange: (targetField: 'DATES' | 'VENUE', proposedValue: string, reason: string) => void;
}

export const CourseInfoTab: React.FC<CourseInfoTabProps> = ({
  course,
  onUpdateCourse,
  onRequestOfficialChange,
}) => {
  const isGoverned = course.approvalStatus === ApprovalStatus.SUBMITTED || course.approvalStatus === ApprovalStatus.APPROVED;

  // Local form state
  const [title, setTitle] = useState(course.title);
  const [subtitle, setSubtitle] = useState(course.subtitle || '');
  const [code, setCode] = useState(course.code || '');
  const [description, setDescription] = useState(course.description || '');
  const [instructions, setInstructions] = useState(course.instructions || '');
  const [objectives, setObjectives] = useState<string[]>(course.objectives || []);
  const [newObjective, setNewObjective] = useState('');

  // Dates & Venue (Direct edit if Draft, or staged modal if Governed)
  const [startDate, setStartDate] = useState(course.startDate);
  const [endDate, setEndDate] = useState(course.endDate);
  const [venueName, setVenueName] = useState(course.venueName);
  const [venueAddress, setVenueAddress] = useState(course.venueAddress || '');

  // Change request modal state
  const [showChangeModal, setShowChangeModal] = useState<'DATES' | 'VENUE' | null>(null);
  const [proposedValue, setProposedValue] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives([...objectives, newObjective.trim()]);
    setNewObjective('');
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSaveOperationalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Course> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      instructions: instructions.trim(),
      objectives,
      venueAddress: venueAddress.trim(),
    };

    // If still in draft, can update dates and venue directly
    if (!isGoverned) {
      updates.startDate = startDate;
      updates.endDate = endDate;
      updates.venueName = venueName.trim();
    }

    onUpdateCourse(updates);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleOpenChangeModal = (field: 'DATES' | 'VENUE') => {
    setShowChangeModal(field);
    setProposedValue(field === 'DATES' ? `${startDate} hingga ${endDate}` : venueName);
    setChangeReason('');
  };

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangeModal || !proposedValue.trim() || !changeReason.trim()) return;

    onRequestOfficialChange(showChangeModal, proposedValue.trim(), changeReason.trim());
    setShowChangeModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Governed notice if course is SUBMITTED or APPROVED */}
      {isGoverned && (
        <div className="bg-amber-50 border-2 border-amber-500 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)]">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>Tadbir Urus Rasmi Aktif:</strong> Kursus ini berstatus <strong>{course.approvalStatus}</strong>. Maklumat sinopsis, objektif dan arahan boleh dikemaskini terus, manakala <strong>Tarikh Rasmi</strong> dan <strong>Lokasi Rasmi</strong> memerlukan kelulusan Master Admin melalui permohonan pindaan.
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveOperationalInfo} className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-6">
        {/* Basic Title & Code */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-800" />
              <span>Maklumat Asas Kursus</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">ID: {course.id}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Tajuk Kursus <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Tajuk Kecil / Kategori
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="cth. Bengkel Transformasi Pensyarah"
                className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Kod Kursus / Rujukan Fail
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="cth. MPU2412"
                className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Sinopsis / Penerangan Kursus
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Huraikan latar belakang dan kepentingan kursus ini..."
              className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Objectives */}
        <div className="space-y-3 pt-2 border-t border-zinc-200">
          <h3 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-800" />
            <span>Objektif Kursus (Learning Outcomes)</span>
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddObjective(); } }}
              placeholder="Tambah objektif kursus (tekan Enter atau butang Tambah)..."
              className="flex-1 p-2 text-xs border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
            />
            <button
              type="button"
              onClick={handleAddObjective}
              className="px-3 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {objectives.length > 0 ? (
            <ul className="space-y-1.5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-zinc-500">{i + 1}.</span>
                    <span className="text-zinc-800">{obj}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(i)}
                    className="text-zinc-400 hover:text-red-600 p-1"
                    title="Padam Objektif"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 italic">Tiada objektif khusus dimasukkan.</p>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2 pt-2 border-t border-zinc-200">
          <label className="block text-xs font-bold text-zinc-900">
            Arahan Khas & Keperluan Peralatan Peserta
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="cth. Membawa komputer riba, pakaian rasmi pejabat pada hari 1-2, dan batik pada hari ke-3."
            className="w-full p-2.5 text-sm border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
          />
        </div>

        {/* Official Dates & Venue Block */}
        <div className="space-y-4 pt-4 border-t-2 border-zinc-900 bg-zinc-50 p-4 border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-black uppercase text-zinc-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-800" />
              <span>Tarikh & Lokasi Rasmi Kursus</span>
            </h3>
            {isGoverned && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-200 text-amber-900 font-bold border border-amber-300">
                TERIKAT KELULUSAN MASTER ADMIN
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Tarikh Mula Kursus
              </label>
              <input
                type="date"
                value={startDate}
                disabled={isGoverned}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full p-2 text-xs border font-mono ${isGoverned ? 'bg-zinc-200 text-zinc-600 border-zinc-300 cursor-not-allowed' : 'bg-white border-zinc-300'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Tarikh Tamat Kursus
              </label>
              <input
                type="date"
                value={endDate}
                disabled={isGoverned}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full p-2 text-xs border font-mono ${isGoverned ? 'bg-zinc-200 text-zinc-600 border-zinc-300 cursor-not-allowed' : 'bg-white border-zinc-300'}`}
              />
            </div>
          </div>

          {isGoverned && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenChangeModal('DATES')}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mohon Pindaan Tarikh Rasmi</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Nama Tempat / Hotel / Pusat Latihan
              </label>
              <input
                type="text"
                value={venueName}
                disabled={isGoverned}
                onChange={(e) => setVenueName(e.target.value)}
                className={`w-full p-2 text-xs border ${isGoverned ? 'bg-zinc-200 text-zinc-600 border-zinc-300 cursor-not-allowed' : 'bg-white border-zinc-300'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Alamat Penuh (Pilihan)
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full p-2 text-xs border border-zinc-300 bg-white"
              />
            </div>
          </div>

          {isGoverned && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenChangeModal('VENUE')}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mohon Pindaan Lokasi Rasmi</span>
              </button>
            </div>
          )}
        </div>

        {/* Submit Save Button */}
        <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Maklumat berjaya dikemaskini!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold border-2 border-zinc-900 hover:bg-zinc-800 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Simpan Perubahan Kursus</span>
          </button>
        </div>
      </form>

      {/* Change Request Modal (Section 17) */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-lg bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Permohonan Pindaan Rasmi ({showChangeModal})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangeModal(null)}
                className="text-zinc-400 hover:text-zinc-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Pindaan tarikh atau lokasi rasmi akan dihantar kepada Master Admin sebagai permohonan bertapis (staged request). Nilai rasmi semasa kekal sehingga diluluskan.
            </p>

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Nilai Pindaan yang Dicadangkan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  required
                  placeholder="Masukkan cadangan tarikh atau lokasi baharu..."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Sebab & Kewajaran Pindaan <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Jelaskan sebab pertukaran (cth. Pengubahsuaian dewan, perubahan cuti umum, dll)..."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                  Hantar Permohonan Pindaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
