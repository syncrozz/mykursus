import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  PlusCircle, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { 
  Course, 
  CourseStatus, 
  ApprovalStatus, 
  Organizer 
} from '../../types';

interface OrganizerDashboardProps {
  currentOrganizer?: Organizer;
  courses: Course[];
  getParticipantCount: (courseId: string) => number;
  onSelectCourse: (course: Course) => void;
  onOpenCreateModal: () => void;
  onOpenPublicPreview: (course: Course) => void;
  onLoadPilot: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentOrganizer,
  courses,
  getParticipantCount,
  onSelectCourse,
  onOpenCreateModal,
  onOpenPublicPreview,
  onLoadPilot,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTION_REQUIRED' | 'DRAFT' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter courses strictly for this organizer
  const orgId = currentOrganizer?.id;
  const organizerCourses = (courses || []).filter(c => orgId ? c.organizerId === orgId : true);

  // Filter based on tab and search query
  const filteredCourses = organizerCourses.filter(c => {
    // Search match
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.title.toLowerCase().includes(query) || 
      (c.code && c.code.toLowerCase().includes(query)) ||
      c.venueName.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'ACTION_REQUIRED') {
      return c.approvalStatus === ApprovalStatus.CHANGES_REQUIRED || c.approvalStatus === ApprovalStatus.SUBMITTED;
    }
    if (filterTab === 'DRAFT') {
      return c.approvalStatus === ApprovalStatus.DRAFT;
    }
    if (filterTab === 'APPROVED') {
      return c.approvalStatus === ApprovalStatus.APPROVED;
    }
    if (filterTab === 'COMPLETED') {
      return c.status === CourseStatus.COMPLETED || c.status === CourseStatus.ARCHIVED;
    }
    return true;
  });

  // Calculate high-level counters
  const totalCount = organizerCourses.length;
  const draftCount = organizerCourses.filter(c => c.approvalStatus === ApprovalStatus.DRAFT).length;
  const pendingCount = organizerCourses.filter(c => c.approvalStatus === ApprovalStatus.SUBMITTED).length;
  const changesReqCount = organizerCourses.filter(c => c.approvalStatus === ApprovalStatus.CHANGES_REQUIRED).length;
  const approvedCount = organizerCourses.filter(c => c.approvalStatus === ApprovalStatus.APPROVED).length;
  const completedCount = organizerCourses.filter(c => c.status === CourseStatus.COMPLETED).length;

  const actionRequiredCount = pendingCount + changesReqCount;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Semua Kursus
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Di bawah seliaan anda
          </div>
        </div>

        <div className={`border-2 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] ${
          actionRequiredCount > 0 ? 'bg-amber-50 border-amber-600' : 'bg-white border-zinc-900'
        }`}>
          <div className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Perlu Tindakan</span>
            {actionRequiredCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
            {actionRequiredCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            {changesReqCount} pindaan • {pendingCount} semakan
          </div>
        </div>

        <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Draf
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
            {draftCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Belum dihantar
          </div>
        </div>

        <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
            Diluluskan / Aktif
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
            {approvedCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            Pautan awam sedia
          </div>
        </div>

        <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Selesai / Arkib
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
            {completedCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Tamat program
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-zinc-900 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterTab === 'ALL'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
            }`}
          >
            Semua ({totalCount})
          </button>

          <button
            onClick={() => setFilterTab('ACTION_REQUIRED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterTab === 'ACTION_REQUIRED'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>Perlu Tindakan ({actionRequiredCount})</span>
            {changesReqCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setFilterTab('DRAFT')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterTab === 'DRAFT'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
            }`}
          >
            Draf ({draftCount})
          </button>

          <button
            onClick={() => setFilterTab('APPROVED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterTab === 'APPROVED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Diluluskan ({approvedCount})
          </button>

          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterTab === 'COMPLETED'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tajuk, kod, lokasi..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
          />
        </div>
      </div>

      {/* Courses List or Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 sm:p-12 text-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="w-14 h-14 bg-zinc-100 border-2 border-zinc-900 text-zinc-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 mb-1">
            {organizerCourses.length === 0 
              ? 'Tiada Kursus Ditemui Bagi Penganjur Ini' 
              : 'Tiada Kursus Sepadan Dengan Carian / Tapisan'}
          </h3>
          <p className="text-xs text-zinc-600 max-w-md mx-auto mb-6">
            {organizerCourses.length === 0 
              ? `Anda sedang log masuk sebagai ${currentOrganizer?.name || 'Penganjur'}. Penganjur ini belum mencipta sebarang draf atau kursus.` 
              : 'Cuba tukar kata kunci carian atau tetapkan semula tapisan status di atas.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold border-2 border-zinc-900 hover:bg-blue-700 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cipta Kursus Pertama Anda</span>
            </button>

            {organizerCourses.length === 0 && currentOrganizer?.id === 'org-ppki-01' && (
              <button
                onClick={onLoadPilot}
                className="px-4 py-2.5 bg-amber-100 text-amber-900 border-2 border-amber-600 text-xs font-bold hover:bg-amber-200 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Muat Data Penanda Aras Pilot KIAR 2026</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(filteredCourses || []).map((course) => {
            const pCount = getParticipantCount(course.id);
            const isChangesRequired = course.approvalStatus === ApprovalStatus.CHANGES_REQUIRED;
            const isSubmitted = course.approvalStatus === ApprovalStatus.SUBMITTED;
            const isApproved = course.approvalStatus === ApprovalStatus.APPROVED;
            const isDraft = course.approvalStatus === ApprovalStatus.DRAFT;

            return (
              <div 
                key={course.id}
                className={`bg-white border-2 flex flex-col justify-between transition-all shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] ${
                  isChangesRequired 
                    ? 'border-red-600 ring-2 ring-red-300' 
                    : isSubmitted 
                    ? 'border-amber-600' 
                    : 'border-zinc-900'
                }`}
              >
                {/* Card Top / Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {course.code && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300">
                            {course.code}
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold truncate max-w-[200px]">
                          /course/{course.slug}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-snug">
                        {course.title}
                      </h3>
                      {course.subtitle && (
                        <p className="text-xs text-zinc-600 font-medium">
                          {course.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {/* Governance status */}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                        isApproved 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400' 
                          : isChangesRequired 
                          ? 'bg-red-100 text-red-900 border-red-400 animate-pulse' 
                          : isSubmitted 
                          ? 'bg-amber-100 text-amber-900 border-amber-400' 
                          : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                      }`}>
                        {course.approvalStatus}
                      </span>

                      {/* Operational status */}
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-50 text-zinc-600 border border-zinc-200 font-bold uppercase">
                        {course.status}
                      </span>
                    </div>
                  </div>

                  {/* Date, Venue, Participants meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-zinc-600 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {course.startDate} – {course.endDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate text-[11px]">
                        {course.venueName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-bold text-[11px]">
                        {pCount} Peserta Berdaftar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Action Callout Banner (DCOREV1 Section 04) */}
                <div className={`px-4 py-2.5 text-xs flex items-center justify-between gap-2 border-b ${
                  isChangesRequired 
                    ? 'bg-red-50 text-red-900 border-red-200' 
                    : isSubmitted 
                    ? 'bg-amber-50 text-amber-900 border-amber-200' 
                    : isApproved 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isChangesRequired ? (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : isSubmitted ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">
                      {isChangesRequired ? (
                        <><strong>Pindaan Diperlukan:</strong> {course.reviewNotes || 'Sila semak ulasan Master Admin dan kemaskini kursus.'}</>
                      ) : isSubmitted ? (
                        <><strong>Dalam Semakan:</strong> Menunggu kelulusan Master Admin. Pindaan operasi tetap dibenarkan.</>
                      ) : isApproved ? (
                        <><strong>Telah Diluluskan:</strong> Pautan awam aktif. Anda bebas mengurus peserta dan jadual langsung.</>
                      ) : (
                        <><strong>Draf:</strong> Lengkapkan maklumat kursus dan hantar untuk semakan Master Admin.</>
                      )}
                    </span>
                  </div>

                  {course.hasPendingChanges && (
                    <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 bg-amber-500 text-white shrink-0">
                      Pindaan Tertangguh
                    </span>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="p-3 bg-zinc-50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenPublicPreview(course)}
                    className="px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-300 flex items-center gap-1.5 transition-all"
                    title="Uji Paparan Awam Peserta (Option A)"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Pratonton Awam</span>
                  </button>

                  <button
                    onClick={() => onSelectCourse(course)}
                    className="px-4 py-1.5 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 border-2 border-zinc-900 flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all"
                  >
                    <span>Buka Workspace Kursus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
