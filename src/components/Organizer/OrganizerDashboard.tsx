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
  Filter,
  Trash2,
  CheckSquare,
  Square
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
  onDeleteCourse?: (courseId: string) => void;
  onBulkDeleteCourses?: (courseIds: string[]) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentOrganizer,
  courses,
  getParticipantCount,
  onSelectCourse,
  onOpenCreateModal,
  onOpenPublicPreview,
  onLoadPilot,
  onDeleteCourse,
  onBulkDeleteCourses,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTION_REQUIRED' | 'DRAFT' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    courseIds: string[];
    title: string;
    count: number;
  } | null>(null);

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

  // Selection handlers
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedCourseIds.length === filteredCourses.length && filteredCourses.length > 0) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(filteredCourses.map(c => c.id));
    }
  };

  const handleSelectAllToDelete = () => {
    if (filteredCourses.length === 0) return;
    const allFilteredIds = filteredCourses.map(c => c.id);
    setSelectedCourseIds(allFilteredIds);
    setDeleteModal({
      isOpen: true,
      courseIds: allFilteredIds,
      title: `Padam Semua (${allFilteredIds.length}) Kursus Tersenarai`,
      count: allFilteredIds.length,
    });
  };

  const handleBulkDeleteSelected = () => {
    if (selectedCourseIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      courseIds: [...selectedCourseIds],
      title: `Padam (${selectedCourseIds.length}) Kursus Dipilih`,
      count: selectedCourseIds.length,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal || deleteModal.courseIds.length === 0) return;
    const targetIds = deleteModal.courseIds;
    if (onBulkDeleteCourses) {
      onBulkDeleteCourses(targetIds);
    } else if (onDeleteCourse) {
      targetIds.forEach(id => onDeleteCourse(id));
    }
    setSelectedCourseIds(prev => prev.filter(id => !targetIds.includes(id)));
    setDeleteModal(null);
  };

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

        {/* Search input & Bulk Action buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tajuk, kod, lokasi..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
            />
          </div>

          {filteredCourses.length > 0 && (
            <>
              <button
                id="btn-organizer-select-all"
                type="button"
                onClick={handleToggleSelectAll}
                className="px-2.5 py-1.5 text-xs font-bold border border-zinc-900 bg-zinc-50 hover:bg-zinc-100 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                title="Pilih Semua Kursus"
              >
                <CheckSquare className="w-3.5 h-3.5 text-zinc-700" />
                <span>
                  {selectedCourseIds.length === filteredCourses.length
                    ? 'Nyahpilih'
                    : 'Pilih Semua'}
                </span>
              </button>

              <button
                id="btn-organizer-select-all-delete"
                type="button"
                onClick={handleSelectAllToDelete}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-red-600 bg-red-50 hover:bg-red-100 text-red-900 flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(220,38,38,1)] cursor-pointer whitespace-nowrap transition-all"
                title="Pilih Semua Kursus dan Padam"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Pilih Semua untuk Padam</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Selection Banner */}
      {selectedCourseIds.length > 0 && (
        <div className="bg-red-50/90 border-2 border-red-600 p-3 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-red-950">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span>{selectedCourseIds.length} daripada {filteredCourses.length} kursus dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCourseIds(filteredCourses.map(c => c.id))}
              className="px-2.5 py-1 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-100 cursor-pointer"
            >
              Pilih Semua ({filteredCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCourseIds([])}
              className="px-2.5 py-1 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer"
            >
              Batal Pilihan
            </button>
            <button
              id="btn-organizer-delete-selected"
              type="button"
              onClick={handleBulkDeleteSelected}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-2 border-red-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer select-none active:translate-y-0.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam ({selectedCourseIds.length}) Kursus Dipilih</span>
            </button>
          </div>
        </div>
      )}

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
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCourseSelection(course.id);
                        }}
                        className="mt-1 w-4 h-4 text-zinc-900 border-2 border-zinc-900 rounded-none cursor-pointer focus:ring-0 shrink-0"
                        title="Pilih kursus ini untuk tindakan pukal"
                      />
                      <div className="space-y-1 min-w-0">
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
                <div className="p-3 bg-zinc-50 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenPublicPreview(course)}
                      className="px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Uji Paparan Awam Peserta (Option A)"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Pratonton Awam</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({
                          isOpen: true,
                          courseIds: [course.id],
                          title: `Padam Kursus "${course.title}"`,
                          count: 1,
                        });
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-700 hover:bg-red-50 border border-zinc-300 hover:border-red-400 transition-all cursor-pointer"
                      title="Padam Kursus Ini (DCOREV1)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectCourse(course)}
                    className="px-4 py-1.5 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 border-2 border-zinc-900 flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer"
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

      {/* In-App Delete Confirmation Modal (Bypasses iframe sandbox restrictions) */}
      {deleteModal?.isOpen && (
        <div 
          id="modal-confirm-delete-course"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteModal(null)}
        >
          <div 
            className="bg-white border-2 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] max-w-md w-full p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 border-2 border-red-600 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-zinc-900 leading-tight">
                  {deleteModal.title}
                </h3>
                <p className="text-[10px] font-mono font-bold text-red-700 uppercase tracking-wider">
                  DCOREV1: Deleted Means Deleted
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Adakah anda pasti mahu memadam <strong>{deleteModal.count}</strong> kursus ini secara kekal dari pangkalan data? Semua data berkaitan termasuk pendaftaran peserta dan rekod operasi akan dipadam sepenuhnya. Tindakan ini tidak boleh diundur.
            </p>

            {/* List preview */}
            <div className="max-h-36 overflow-y-auto border border-zinc-200 bg-zinc-50 p-2 text-[11px] font-mono divide-y divide-zinc-200">
              {courses.filter(c => deleteModal.courseIds.includes(c.id)).map(c => (
                <div key={c.id} className="py-1 flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-800 truncate">{c.title}</span>
                  {c.code && <span className="text-zinc-500 text-[10px] shrink-0">{c.code}</span>}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                id="btn-cancel-delete-course"
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-course-execute"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:bg-red-800 border-2 border-red-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-0.5 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Sahkan & Padam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
