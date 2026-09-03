import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  Lock, 
  Eye, 
  Edit3, 
  Save, 
  Star, 
  GitPullRequest,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  Course, 
  Organizer, 
  CourseStatus, 
  ApprovalStatus, 
  Participant, 
  CourseEnrollment, 
  SessionItem, 
  ScheduleDay,
  ApprovalChangeRequest,
  UserRole
} from '../../types';

interface CourseDetailReviewProps {
  course: Course;
  organizers: Organizer[];
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  sessions: SessionItem[];
  scheduleDays: ScheduleDay[];
  changeRequests: ApprovalChangeRequest[];
  currentRole: UserRole;
  onBack: () => void;
  onApprove: (courseId: string, notes?: string) => void;
  onRequestChanges: (courseId: string, notes: string) => void;
  onReject: (courseId: string, notes: string) => void;
  onUpdateStatus: (courseId: string, newStatus: CourseStatus) => void;
  onToggleFeatured: (courseId: string) => void;
  onUpdateDates: (courseId: string, startDate: string, endDate: string) => void;
  onUpdateVenue: (courseId: string, venueName: string, venueAddress?: string) => void;
  onAssignOrganizer: (courseId: string, organizerId: string) => void;
  onUpdateSlug: (courseId: string, newSlug: string) => void;
  onReviewChangeRequest: (crId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
}

export const CourseDetailReview: React.FC<CourseDetailReviewProps> = ({
  course,
  organizers,
  enrollments,
  sessions,
  scheduleDays,
  changeRequests,
  currentRole,
  onBack,
  onApprove,
  onRequestChanges,
  onReject,
  onUpdateStatus,
  onToggleFeatured,
  onUpdateDates,
  onUpdateVenue,
  onAssignOrganizer,
  onUpdateSlug,
  onReviewChangeRequest,
}) => {
  const currentOrg = organizers.find(o => o.id === course.organizerId);

  // States for Master Admin Direct Governance Edits
  const [editingDates, setEditingDates] = useState(false);
  const [startDate, setStartDate] = useState(course.startDate);
  const [endDate, setEndDate] = useState(course.endDate);

  const [editingVenue, setEditingVenue] = useState(false);
  const [venueName, setVenueName] = useState(course.venueName);
  const [venueAddress, setVenueAddress] = useState(course.venueAddress || '');

  const [editingSlug, setEditingSlug] = useState(false);
  const [slug, setSlug] = useState(course.slug);
  const [slugError, setSlugError] = useState<string | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState(course.organizerId);
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  const [showReviewModal, setShowReviewModal] = useState<'APPROVE' | 'CHANGES' | 'REJECT' | null>(null);

  // Security check helper: prompt states unauthorized if non-Master Admin attempts actions
  const checkAuth = (): boolean => {
    if (currentRole !== UserRole.MASTER_ADMIN) {
      alert(`AKSES DITOLAK: Peranan "${currentRole}" tidak mempunyai kebenaran untuk menjalankan tindakan Master Admin!`);
      return false;
    }
    return true;
  };

  const handleSaveDates = () => {
    if (!checkAuth()) return;
    onUpdateDates(course.id, startDate, endDate);
    setEditingDates(false);
  };

  const handleSaveVenue = () => {
    if (!checkAuth()) return;
    onUpdateVenue(course.id, venueName, venueAddress);
    setEditingVenue(false);
  };

  const handleSaveSlug = () => {
    if (!checkAuth()) return;
    try {
      onUpdateSlug(course.id, slug);
      setEditingSlug(false);
      setSlugError(null);
    } catch (err: any) {
      setSlugError(err.message);
    }
  };

  const handleAssignOrganizer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!checkAuth()) return;
    const newOrgId = e.target.value;
    setSelectedOrgId(newOrgId);
    onAssignOrganizer(course.id, newOrgId);
  };

  const handleStatusTransition = (newStatus: CourseStatus) => {
    if (!checkAuth()) return;
    if (course.status === CourseStatus.ARCHIVED && newStatus === CourseStatus.ACTIVE) {
      if (!window.confirm('PERHATIAN: Anda sedang mengaktifkan semula kursus yang telah diarkibkan. Teruskan?')) {
        return;
      }
    }
    onUpdateStatus(course.id, newStatus);
  };

  const handleConfirmReview = () => {
    if (!checkAuth()) return;
    if (showReviewModal === 'APPROVE') {
      onApprove(course.id, reviewNoteInput || 'Diluluskan oleh Master Admin.');
    } else if (showReviewModal === 'CHANGES') {
      if (!reviewNoteInput.trim()) {
        alert('Sila nyatakan catatan pindaan yang diperlukan oleh penganjur.');
        return;
      }
      onRequestChanges(course.id, reviewNoteInput);
    } else if (showReviewModal === 'REJECT') {
      if (!reviewNoteInput.trim()) {
        alert('Sila nyatakan sebab penolakan.');
        return;
      }
      onReject(course.id, reviewNoteInput);
    }
    setShowReviewModal(null);
    setReviewNoteInput('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Quick Actions Bar */}
      <div className="bg-white border-2 border-zinc-900 p-4 sm:p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 text-zinc-800"
            title="Kembali ke Senarai Kursus"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-zinc-900 text-white uppercase">
                {course.code || 'KOD'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Semakan Tadbir Urus Master Admin
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950 line-clamp-1">
              {course.title}
            </h2>
          </div>
        </div>

        {/* Action Controls for Master Admin Approval */}
        <div className="flex flex-wrap items-center gap-2">
          {course.approvalStatus === ApprovalStatus.SUBMITTED && (
            <>
              <button
                onClick={() => setShowReviewModal('APPROVE')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Luluskan Kursus</span>
              </button>
              <button
                onClick={() => setShowReviewModal('CHANGES')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Minta Pindaan</span>
              </button>
              <button
                onClick={() => setShowReviewModal('REJECT')}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1.5 shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak</span>
              </button>
            </>
          )}

          {course.approvalStatus === ApprovalStatus.APPROVED && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>STATUS: DILULUSKAN</span>
              </span>
              <button
                onClick={() => {
                  if (checkAuth()) {
                    onToggleFeatured(course.id);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1 ${
                  course.isFeaturedActive
                    ? 'bg-amber-100 text-amber-900 border-amber-500'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${course.isFeaturedActive ? 'fill-amber-500' : ''}`} />
                <span>{course.isFeaturedActive ? 'Featured Spotlight' : 'Jadikan Featured'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Core Governance & Inspection */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Official Dates & Venue Governance */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Tadbir Urus Tarikh & Lokasi Rasmi
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-900 uppercase">
                Perlu Kelulusan Master Admin
              </span>
            </div>

            <div className="space-y-4">
              {/* Dates Control */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-700 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Tarikh Rasmi Kursus</span>
                  </span>
                  {!editingDates ? (
                    <button
                      onClick={() => setEditingDates(true)}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Kemaskini</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSaveDates}
                        className="px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Simpan</span>
                      </button>
                      <button
                        onClick={() => {
                          setStartDate(course.startDate);
                          setEndDate(course.endDate);
                          setEditingDates(false);
                        }}
                        className="px-2 py-1 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>

                {!editingDates ? (
                  <p className="font-mono text-sm font-bold text-zinc-950">
                    {course.startDate} hingga {course.endDate}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500">Mula:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white border border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500">Tamat:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white border border-zinc-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Venue Control */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-700 uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Lokasi & Alamat Rasmi</span>
                  </span>
                  {!editingVenue ? (
                    <button
                      onClick={() => setEditingVenue(true)}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Kemaskini</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSaveVenue}
                        className="px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Simpan</span>
                      </button>
                      <button
                        onClick={() => {
                          setVenueName(course.venueName);
                          setVenueAddress(course.venueAddress || '');
                          setEditingVenue(false);
                        }}
                        className="px-2 py-1 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>

                {!editingVenue ? (
                  <div>
                    <p className="font-bold text-zinc-950 text-sm">{course.venueName}</p>
                    {course.venueAddress && (
                      <p className="text-xs text-zinc-600 mt-0.5">{course.venueAddress}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500">Nama Tempat/Hotel:</label>
                      <input
                        type="text"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        className="w-full text-xs font-bold p-1.5 bg-white border border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500">Alamat Penuh:</label>
                      <input
                        type="text"
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-zinc-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Participant Cohort & Privacy Inspection (Option A Verification) */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b-2 border-zinc-900 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Senarai Kohort Peserta ({enrollments.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[9px] font-bold uppercase border border-zinc-300">
                  Data Umum (Nama/Agensi)
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold uppercase border border-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Privasi (Bilik/Kumpulan)
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              Mengikut keputusan produk <strong>OPTION A</strong>, peserta melihat maklumat awam kursus secara terbuka melalui slug. Maklumat peribadi (bilik, rakan sebilik, kumpulan) dilindungi dan hanya boleh diakses melalui pengesahan nombor telefon peserta.
            </p>

            {enrollments.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
                Tiada peserta didaftarkan lagi dalam kursus ini.
              </div>
            ) : (
              <div className="border border-zinc-900 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-900 font-bold uppercase text-[9px] sticky top-0 border-b border-zinc-900">
                    <tr>
                      <th className="p-2 border-r border-zinc-300">#</th>
                      <th className="p-2 border-r border-zinc-300">Nama & Institusi</th>
                      <th className="p-2 border-r border-zinc-300">No. Telefon (ID Sah)</th>
                      <th className="p-2 border-r border-zinc-300 bg-amber-50 text-amber-900">No. Bilik</th>
                      <th className="p-2 bg-amber-50 text-amber-900">Rakan Sebilik / Kumpulan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {enrollments.map((item, idx) => (
                      <tr key={item.participant.id} className="hover:bg-zinc-50">
                        <td className="p-2 font-mono text-[10px] text-zinc-400 border-r border-zinc-200">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-semibold text-zinc-900 border-r border-zinc-200">
                          <p className="text-xs">{item.participant.name}</p>
                          <p className="text-[10px] text-zinc-500">{item.participant.institutionOrAgency}</p>
                        </td>
                        <td className="p-2 font-mono text-[10px] text-zinc-700 border-r border-zinc-200">
                          {item.participant.phone}
                        </td>
                        <td className="p-2 font-mono text-xs font-bold text-amber-950 bg-amber-50/40 border-r border-zinc-200">
                          {item.enrollment.roomNumber || '—'}
                        </td>
                        <td className="p-2 text-xs text-amber-900 bg-amber-50/40">
                          <p className="font-medium">{item.enrollment.roommateName || '—'}</p>
                          <p className="text-[10px] text-zinc-500">{item.enrollment.assignedGroup || '—'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Schedule Days & Sessions Overview */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Jadual & Sesi Kursus ({sessions.length} Sesi)
                </h3>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
                Tiada sesi jadual dimasukkan oleh penganjur.
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleDays.map((day) => {
                  const daySessions = sessions.filter(s => s.dayNumber === day.dayNumber);
                  return (
                    <div key={day.id} className="border border-zinc-300 p-3 bg-zinc-50">
                      <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5 mb-2">
                        <span className="text-xs font-bold uppercase text-zinc-900">
                          Hari {day.dayNumber} ({day.date})
                        </span>
                        <span className="text-[10px] text-zinc-500 italic">{day.theme}</span>
                      </div>
                      <div className="space-y-1.5">
                        {daySessions.map((s) => (
                          <div key={s.id} className="p-2 bg-white border border-zinc-200 flex justify-between text-xs">
                            <div>
                              <span className="font-bold text-zinc-900">{s.title}</span>
                              {s.facilitatorName && (
                                <p className="text-[10px] text-zinc-500">Penceramah: {s.facilitatorName}</p>
                              )}
                            </div>
                            <span className="font-mono text-[10px] font-bold text-zinc-600 shrink-0">
                              {s.startTime} - {s.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Lifecycle, Ownership, Slug, and Staged Changes */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Status & Lifecycle Management */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-3">
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                Kawalan Kitaran Hayat (Status)
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-600">
                {course.status}
              </span>
            </div>

            <p className="text-xs text-zinc-600 mb-4">
              Master Admin mempunyai kuasa mutlak untuk mengawal status operasi kursus pada bila-bila masa.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatusTransition(CourseStatus.UPCOMING)}
                className={`py-2 px-3 text-xs font-bold uppercase border-2 text-center transition-all ${
                  course.status === CourseStatus.UPCOMING
                    ? 'bg-blue-600 text-white border-blue-900'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Upcoming
              </button>

              <button
                onClick={() => handleStatusTransition(CourseStatus.ACTIVE)}
                className={`py-2 px-3 text-xs font-bold uppercase border-2 text-center transition-all ${
                  course.status === CourseStatus.ACTIVE
                    ? 'bg-emerald-600 text-white border-emerald-900'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Active (Live)
              </button>

              <button
                onClick={() => handleStatusTransition(CourseStatus.COMPLETED)}
                className={`py-2 px-3 text-xs font-bold uppercase border-2 text-center transition-all ${
                  course.status === CourseStatus.COMPLETED
                    ? 'bg-zinc-800 text-white border-zinc-950'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Completed
              </button>

              <button
                onClick={() => handleStatusTransition(CourseStatus.ARCHIVED)}
                className={`py-2 px-3 text-xs font-bold uppercase border-2 text-center transition-all ${
                  course.status === CourseStatus.ARCHIVED
                    ? 'bg-zinc-950 text-white border-black'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Course Ownership Control */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-3">
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                Pemilikan Kursus (Penganjur)
              </h3>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              Setiap kursus terikat kepada satu entiti penganjur berdaftar. Master Admin boleh mengagihkan semula pemilikan ini.
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Penganjur Ditugaskan:
              </label>
              <select
                value={selectedOrgId}
                onChange={handleAssignOrganizer}
                className="w-full text-xs font-bold py-2 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none cursor-pointer"
              >
                {organizers.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Public Slug Oversight */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-3">
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                Pengawasan Slug URL Awam
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-900 uppercase">
                Tindakan Berisiko Tinggi
              </span>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              Pautan awam peserta diakses melalui slug unik ini. Mengubah slug selepas penerbitan akan memecahkan pautan dan kod QR sedia ada.
            </p>

            <div className="p-3 bg-zinc-50 border border-zinc-300 font-mono text-xs">
              <span className="text-zinc-500 text-[10px] block uppercase font-bold">Pautan URL Awam:</span>
              <span className="text-blue-700 font-bold break-all">/course/{course.slug}</span>
            </div>

            {slugError && (
              <p className="text-xs text-red-700 font-bold mt-2">{slugError}</p>
            )}

            <div className="mt-3">
              {!editingSlug ? (
                <button
                  onClick={() => setEditingSlug(true)}
                  className="text-xs font-bold text-zinc-700 hover:text-zinc-950 underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Ubah Slug (Memerlukan Pengesahan Pentadbir)</span>
                </button>
              ) : (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full text-xs font-mono p-2 bg-white border-2 border-zinc-900"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSlug}
                      className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold uppercase"
                    >
                      Sahkan Pertukaran Slug
                    </button>
                    <button
                      onClick={() => {
                        setSlug(course.slug);
                        setEditingSlug(false);
                      }}
                      className="px-3 py-1.5 bg-zinc-200 text-zinc-700 text-xs font-bold uppercase"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending High-Risk Change Requests for this Course */}
          {changeRequests.length > 0 && (
            <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-3">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                    Pindaan Berperingkat (Staged)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-900 uppercase">
                  Pending Review
                </span>
              </div>

              <div className="space-y-3">
                {changeRequests.map((cr) => (
                  <div key={cr.id} className="p-3 border-2 border-zinc-900 bg-amber-50/50 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Medan: {cr.targetField}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Status: {cr.status}</span>
                    </div>

                    <div className="text-xs font-mono p-2 bg-white border border-zinc-300 space-y-1">
                      <div>
                        <span className="text-[10px] text-zinc-400 block font-bold">SEMASA (Diterbitkan):</span>
                        <span className="text-zinc-700">{cr.currentValue}</span>
                      </div>
                      <div className="pt-1 border-t border-zinc-200">
                        <span className="text-[10px] text-blue-600 block font-bold">CADANGAN BARU:</span>
                        <span className="text-blue-900 font-bold">{cr.proposedValue}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 italic">
                      Sebab permohonan: "{cr.reason}"
                    </p>

                    {cr.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (checkAuth()) {
                              onReviewChangeRequest(cr.id, 'APPROVED', 'Diluluskan oleh Master Admin.');
                            }
                          }}
                          className="w-1/2 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700"
                        >
                          Luluskan & Kemaskini
                        </button>
                        <button
                          onClick={() => {
                            if (checkAuth()) {
                              const reason = prompt('Sila masukkan ulasan penolakan:');
                              if (reason) {
                                onReviewChangeRequest(cr.id, 'REJECTED', reason);
                              }
                            }
                          }}
                          className="w-1/2 py-1.5 bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase hover:bg-zinc-300"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal Dialog for Approval / Changes / Rejection */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
              {showReviewModal === 'APPROVE' && 'Luluskan Kursus Untuk Penerbitan'}
              {showReviewModal === 'CHANGES' && 'Minta Pindaan Daripada Penganjur'}
              {showReviewModal === 'REJECT' && 'Tolak Permohonan Kursus'}
            </h3>

            <p className="text-xs text-zinc-600">
              {showReviewModal === 'APPROVE' && 'Kursus akan diluluskan dan diterbitkan ke alamat slug awam rasmi. Status operasi akan menjadi AKTIF.'}
              {showReviewModal === 'CHANGES' && 'Penganjur akan dimaklumkan tentang catatan pindaan yang perlu diselesaikan sebelum semakan semula.'}
              {showReviewModal === 'REJECT' && 'Permohonan kursus ini akan ditolak secara rasmi. Tindakan ini akan direkodkan dalam log audit.'}
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Catatan / Sebab Semakan Pentadbir:
              </label>
              <textarea
                rows={3}
                value={reviewNoteInput}
                onChange={(e) => setReviewNoteInput(e.target.value)}
                placeholder="Masukkan ulasan rasmi Master Admin..."
                className="w-full p-2 text-xs border-2 border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowReviewModal(null);
                  setReviewNoteInput('');
                }}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold uppercase border-2 border-zinc-900"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-4 py-2 text-white text-xs font-bold uppercase border-2 border-zinc-900 ${
                  showReviewModal === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  showReviewModal === 'CHANGES' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                Sahkan Tindakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
