import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Building, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Home, 
  User, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  HardDrive,
  CopyCheck,
  Check
} from 'lucide-react';
import { Participant, CourseEnrollment, Course } from '../../types';
import { exportParticipantsToCSV, auditCourseDuplicates } from '../../utils/dataPortability';
import { ImportCSVModal } from './DataSafety/ImportCSVModal';
import { BackupDataModal } from './DataSafety/BackupDataModal';
import { AuditDuplikasiModal } from './DataSafety/AuditDuplikasiModal';
import { platformStorage } from '../../services/storage';

interface ParticipantsTabProps {
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  onSaveParticipant: (participantData: Partial<Participant>, enrollmentData: Partial<CourseEnrollment>) => void;
  onDeleteParticipant: (participantId: string) => void;
  onBulkDeleteParticipants?: (participantIds: string[]) => void;
  onUpdateAllocations: (enrollmentId: string, allocations: Partial<CourseEnrollment>) => void;
  onBulkImportParticipants?: (rows: Array<{ participant: Partial<Participant>; enrollment: Partial<CourseEnrollment> }>) => void;
  onRestoreBackup?: (payload: any) => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  course,
  enrollments,
  onSaveParticipant,
  onDeleteParticipant,
  onBulkDeleteParticipants,
  onUpdateAllocations,
  onBulkImportParticipants,
  onRestoreBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'REGISTERED' | 'ATTENDED'>('ALL');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    participantIds: string[];
    title: string;
    count: number;
    namesPreview: string[];
  } | null>(null);

  // Data Safety Modal states
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<{ participant: Participant; enrollment: CourseEnrollment } | null>(null);

  const [showAllocationModal, setShowAllocationModal] = useState<{ participant: Participant; enrollment: CourseEnrollment } | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [designation, setDesignation] = useState('');
  const [salaryNumber, setSalaryNumber] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // Form states for Allocations
  const [roomNumber, setRoomNumber] = useState('');
  const [roommateName, setRoommateName] = useState('');
  const [assignedGroup, setAssignedGroup] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [secretariatNotes, setSecretariatNotes] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setEmail('');
    setPhone('');
    setInstitution('');
    setDesignation('');
    setSalaryNumber('');
    setGender('M');
    setShowAddEditModal(true);
  };

  const openEditModal = (item: { participant: Participant; enrollment: CourseEnrollment }) => {
    setEditingItem(item);
    setName(item.participant.name);
    setEmail(item.participant.email || '');
    setPhone(item.participant.phone);
    setInstitution(item.participant.institutionOrAgency);
    setDesignation(item.participant.designation || '');
    setSalaryNumber(item.participant.salaryNumber || item.enrollment.salaryNumber || '');
    setGender(item.participant.gender || 'M');
    setShowAddEditModal(true);
  };

  const openAllocationModal = (item: { participant: Participant; enrollment: CourseEnrollment }) => {
    setShowAllocationModal(item);
    setRoomNumber(item.enrollment.roomNumber || '');
    setRoommateName(item.enrollment.roommateName || '');
    setAssignedGroup(item.enrollment.assignedGroup || '');
    setSpecialRequirements(item.enrollment.specialRequirements || '');
    setSecretariatNotes(item.enrollment.secretariatNotes || '');
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSaveParticipant(
      {
        id: editingItem?.participant.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim().replace(/\s+/g, ''),
        institutionOrAgency: institution.trim() || 'Kolej / Agensi Luar',
        designation: designation.trim(),
        salaryNumber: salaryNumber.trim(),
        gender,
      },
      {
        id: editingItem?.enrollment.id,
        status: editingItem?.enrollment.status || 'CONFIRMED',
        salaryNumber: salaryNumber.trim(),
      }
    );

    setShowAddEditModal(false);
  };

  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAllocationModal) return;

    onUpdateAllocations(showAllocationModal.enrollment.id, {
      roomNumber: roomNumber.trim(),
      roommateName: roommateName.trim(),
      assignedGroup: assignedGroup.trim(),
      specialRequirements: specialRequirements.trim(),
      secretariatNotes: secretariatNotes.trim(),
    });

    setShowAllocationModal(null);
  };

  // Duplicate records count badge for Audit Duplikasi button
  const duplicateBadgeCount = useMemo(() => {
    return auditCourseDuplicates(enrollments).totalDuplicateRecords;
  }, [enrollments]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // CSV Portability Actions (SES 4.4)
  const handleExportCSV = () => {
    try {
      exportParticipantsToCSV(course, enrollments);
      showToast(`Senarai ${enrollments.length} peserta berjaya dieksport ke fail CSV.`);
    } catch (err: any) {
      alert(`Ralat semasa mengeksport CSV: ${err.message}`);
    }
  };

  const handleCommitImport = (
    rowsToImport: Array<{
      participant: Partial<Participant>;
      enrollment: Partial<CourseEnrollment>;
    }>
  ) => {
    try {
      if (onBulkImportParticipants) {
        onBulkImportParticipants(rowsToImport);
      } else {
        platformStorage.bulkImportParticipants(course.id, rowsToImport);
      }
      showToast(`Berjaya mengimport/mengemas kini ${rowsToImport.length} rekod peserta.`);
    } catch (err: any) {
      alert(`Ralat semasa mengimport data: ${err.message}`);
    }
  };

  const handleRestoreBackupData = (payload: any) => {
    try {
      if (onRestoreBackup) {
        onRestoreBackup(payload);
      } else {
        platformStorage.restoreCourseBackup(course.id, payload);
      }
      showToast('Pemulihan sandaran data berjaya dilaksanakan.');
    } catch (err: any) {
      alert(`Ralat semasa memulihkan data: ${err.message}`);
    }
  };

  // Filter list
  const filteredEnrollments = (enrollments || []).filter(({ participant, enrollment }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      participant.name.toLowerCase().includes(q) ||
      participant.phone.includes(q) ||
      participant.institutionOrAgency.toLowerCase().includes(q) ||
      (participant.salaryNumber && participant.salaryNumber.toLowerCase().includes(q)) ||
      (enrollment.roomNumber && enrollment.roomNumber.toLowerCase().includes(q)) ||
      (enrollment.assignedGroup && enrollment.assignedGroup.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && enrollment.status !== statusFilter) return false;
    return true;
  });

  // Selection Handlers
  const handleToggleParticipant = (id: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedParticipantIds.length === filteredEnrollments.length && filteredEnrollments.length > 0) {
      setSelectedParticipantIds([]);
    } else {
      setSelectedParticipantIds(filteredEnrollments.map(e => e.participant.id));
    }
  };

  const handleSelectAllToDelete = () => {
    if (filteredEnrollments.length === 0) return;
    const allIds = filteredEnrollments.map(e => e.participant.id);
    setSelectedParticipantIds(allIds);
    setDeleteModalState({
      isOpen: true,
      participantIds: allIds,
      title: `Padam Semua (${allIds.length}) Peserta Tersenarai`,
      count: allIds.length,
      namesPreview: filteredEnrollments.slice(0, 8).map(e => e.participant.name),
    });
  };

  const handleDeleteSelected = () => {
    if (selectedParticipantIds.length === 0) return;
    const count = selectedParticipantIds.length;
    const selectedRows = filteredEnrollments.filter(e => selectedParticipantIds.includes(e.participant.id));
    setDeleteModalState({
      isOpen: true,
      participantIds: [...selectedParticipantIds],
      title: `Padam (${count}) Peserta Dipilih`,
      count: count,
      namesPreview: selectedRows.slice(0, 8).map(e => e.participant.name),
    });
  };

  const handleConfirmDeleteParticipants = () => {
    if (!deleteModalState || deleteModalState.participantIds.length === 0) return;
    const ids = deleteModalState.participantIds;
    if (onBulkDeleteParticipants) {
      onBulkDeleteParticipants(ids);
    } else {
      ids.forEach(id => onDeleteParticipant(id));
    }
    setSelectedParticipantIds(prev => prev.filter(id => !ids.includes(id)));
    setDeleteModalState(null);
    showToast(`✓ Sebanyak ${ids.length} peserta telah dipadam.`);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-zinc-300 hover:text-white text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Data Management Toolbar (SES 4.4 Locked Order) */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-800" />
              <span>Pengurusan Peserta ({enrollments.length} Orang)</span>
            </h3>
            <p className="text-xs text-zinc-600">
              Maklumat pendaftaran kursus dan peruntukan peribadi (bilik, rakan sebilik, kumpulan).
            </p>
          </div>
        </div>

        {/* SES 4.4 Data-Management Toolbar Order:
            LEFTMOST: [ Eksport CSV ]
            MIDDLE: [ Backup Data ] [ Audit Duplikasi ] [ + Tambah Peserta ]
            RIGHTMOST: [ Import CSV ]
        */}
        <div 
          id="participants-data-management-toolbar"
          className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2.5"
        >
          {/* LEFTMOST: Eksport CSV */}
          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            title="Eksport senarai peserta semasa ke fail CSV (UTF-8)"
          >
            <Download className="w-4 h-4 text-zinc-700" />
            <span>Eksport CSV</span>
          </button>

          {/* MIDDLE: Relevant Actions (Backup Data, Audit Duplikasi, + Tambah Peserta, Pilih Semua untuk Padam) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-backup-data"
              type="button"
              onClick={() => setShowBackupModal(true)}
              className="px-3 py-2 bg-white hover:bg-zinc-50 border-2 border-zinc-900 text-zinc-800 text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
              title="Sandaran luar talian bagi data peserta dan peruntukan (SES v4.4)"
            >
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Backup Data</span>
            </button>

            <button
              id="btn-audit-duplikasi"
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-2 bg-white hover:bg-zinc-50 border-2 border-zinc-900 text-zinc-800 text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
              title="Semak pertindihan rekod berdasarkan no telefon, no gaji, dan emel"
            >
              <CopyCheck className="w-4 h-4 text-amber-600" />
              <span>Audit Duplikasi</span>
              {duplicateBadgeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-mono font-bold rounded-full">
                  {duplicateBadgeCount}
                </span>
              )}
            </button>

            <button
              id="btn-add-participant"
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-2 border-zinc-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Peserta</span>
            </button>

            <button
              id="btn-participants-select-all-delete"
              type="button"
              onClick={handleSelectAllToDelete}
              disabled={filteredEnrollments.length === 0}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 border-2 border-red-600 text-red-900 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all cursor-pointer disabled:opacity-50"
              title="Pilih semua peserta dan padam secara pukal"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Pilih Semua untuk Padam</span>
            </button>
          </div>

          {/* RIGHTMOST: Import CSV */}
          <button
            id="btn-import-csv"
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            title="Import data peserta dari fail CSV dengan pengesahan dan semakan"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-zinc-50 border border-zinc-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-zinc-600">Status:</span>
          {(['ALL', 'CONFIRMED', 'REGISTERED', 'ATTENDED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 font-semibold border ${
                statusFilter === st 
                  ? 'bg-zinc-900 text-white border-zinc-900' 
                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, telefon, no gaji, bilik..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
          />
        </div>
      </div>

      {/* Active Selection Banner */}
      {selectedParticipantIds.length > 0 && (
        <div className="bg-red-50/90 border-2 border-red-600 p-3 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-red-950">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span>{selectedParticipantIds.length} daripada {filteredEnrollments.length} peserta dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedParticipantIds(filteredEnrollments.map(e => e.participant.id))}
              className="px-2.5 py-1 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-100 cursor-pointer"
            >
              Pilih Semua ({filteredEnrollments.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedParticipantIds([])}
              className="px-2.5 py-1 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer"
            >
              Batal Pilihan
            </button>
            <button
              id="btn-delete-selected-participants"
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-red-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam ({selectedParticipantIds.length}) Peserta Dipilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants Table or Empty State */}
      {filteredEnrollments.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <Users className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-900">Tiada Peserta Ditemui</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            {enrollments.length === 0 
              ? 'Kursus ini belum mempunyai senarai peserta berdaftar. Tambah peserta pertama secara manual atau import fail CSV/Excel.' 
              : 'Tiada peserta sepadan dengan carian anda.'}
          </p>
          {enrollments.length === 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
            >
              + Daftar Peserta Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-zinc-900 overflow-x-auto shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-white font-mono text-[11px] uppercase border-b-2 border-zinc-900">
              <tr>
                <th className="p-3 w-12 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filteredEnrollments.length > 0 && selectedParticipantIds.length === filteredEnrollments.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-zinc-900 border-zinc-400 rounded-none cursor-pointer focus:ring-0"
                      title={selectedParticipantIds.length === filteredEnrollments.length ? 'Nyahpilih semua' : 'Pilih semua'}
                    />
                  </div>
                </th>
                <th className="p-3">Nama Peserta / Jawatan</th>
                <th className="p-3">No. Telefon & Emel</th>
                <th className="p-3">Institusi / Cawangan</th>
                <th className="p-3">No. Gaji</th>
                <th className="p-3 bg-zinc-800 text-amber-300">Bilik & Rakan</th>
                <th className="p-3 bg-zinc-800 text-amber-300">Kumpulan</th>
                <th className="p-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {filteredEnrollments.map(({ participant, enrollment }, idx) => (
                <tr 
                  key={participant.id} 
                  className={`hover:bg-zinc-50 transition-colors ${
                    selectedParticipantIds.includes(participant.id) ? 'bg-red-50/40' : ''
                  }`}
                >
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedParticipantIds.includes(participant.id)}
                        onChange={() => handleToggleParticipant(participant.id)}
                        className="w-4 h-4 text-zinc-900 border-zinc-400 rounded-none cursor-pointer focus:ring-0"
                        title={`Pilih ${participant.name}`}
                      />
                      <span className="font-mono text-zinc-500 text-[11px]">{idx + 1}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-zinc-900">{participant.name}</div>
                    {participant.designation && (
                      <div className="text-[11px] text-zinc-500">{participant.designation}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-zinc-700">
                    <div>{participant.phone}</div>
                    <div className="text-[10px] text-zinc-500 lowercase">{participant.email || '-'}</div>
                  </td>
                  <td className="p-3 text-zinc-800 font-medium">
                    {participant.institutionOrAgency}
                  </td>
                  <td className="p-3 font-mono text-zinc-600">
                    {participant.salaryNumber || enrollment.salaryNumber || '-'}
                  </td>
                  
                  {/* Private Allocation Column (Section 12) */}
                  <td className="p-3 bg-amber-50/50 border-l border-r border-amber-200">
                    <div className="flex items-center justify-between gap-1.5">
                      <div>
                        {enrollment.roomNumber ? (
                          <span className="font-bold text-zinc-900">Bilik {enrollment.roomNumber}</span>
                        ) : (
                          <span className="text-zinc-400 italic">Belum diisi</span>
                        )}
                        {enrollment.roommateName && (
                          <div className="text-[10px] text-zinc-600 truncate max-w-[130px]">
                            Rakan: {enrollment.roommateName}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openAllocationModal({ participant, enrollment })}
                        className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold rounded"
                        title="Urus Peruntukan Bilik & Kumpulan"
                      >
                        Urus
                      </button>
                    </div>
                  </td>

                  <td className="p-3 bg-amber-50/50">
                    {enrollment.assignedGroup ? (
                      <span className="text-[11px] font-semibold text-zinc-800">
                        {enrollment.assignedGroup}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic">-</span>
                    )}
                  </td>

                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal({ participant, enrollment })}
                      className="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded"
                      title="Edit Maklumat Peserta"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModalState({
                          isOpen: true,
                          participantIds: [participant.id],
                          title: `Padam Peserta "${participant.name}"`,
                          count: 1,
                          namesPreview: [participant.name],
                        });
                      }}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Padam Peserta (Deleted means Deleted)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Participant Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-lg bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingItem ? 'Kemaskini Maklumat Peserta' : 'Daftar Peserta Baharu'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Nama Penuh Peserta <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="cth. Dr. Ahmad bin Abdullah"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    No. Telefon Bimbit <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="cth. 012-3456789"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 mt-0.5">Digunakan untuk pengesahan tanpa kata laluan (Option A).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Alamat Emel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cth. ahmad@kptm.edu.my"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Institusi / Cawangan
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="cth. KPTM Kuantan"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Jawatan / Gred
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="cth. Pensyarah / Penyelaras"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    No. Gaji / No. Pekerja
                  </label>
                  <input
                    type="text"
                    value={salaryNumber}
                    onChange={(e) => setSalaryNumber(e.target.value)}
                    placeholder="cth. G-40812"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Jantina
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  >
                    <option value="M">Lelaki (M)</option>
                    <option value="F">Perempuan (F)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant-Specific Private Allocations Modal (Section 12) */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 p-4 backdrop-blur-xs flex justify-center items-center">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black text-zinc-900">
                  Peruntukan Peribadi Peserta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocationModal(null)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-50 p-2.5 border border-zinc-200 text-xs">
              <div className="font-bold text-zinc-900">{showAllocationModal.participant.name}</div>
              <div className="text-[11px] text-zinc-500 font-mono">
                {showAllocationModal.participant.phone} • {showAllocationModal.participant.institutionOrAgency}
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              Maklumat ini adalah <strong>SULIT</strong> dan hanya dipaparkan kepada peserta setelah mengesahkan nombor telefon di pautan awam.
            </p>

            <form onSubmit={handleSaveAllocation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    No. Bilik Penginapan
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="cth. 508"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Rakan Sebilik
                  </label>
                  <input
                    type="text"
                    value={roommateName}
                    onChange={(e) => setRoommateName(e.target.value)}
                    placeholder="cth. Ustaz Fauzi"
                    className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Kumpulan / Meja Bengkel
                </label>
                <input
                  type="text"
                  value={assignedGroup}
                  onChange={(e) => setAssignedGroup(e.target.value)}
                  placeholder="cth. Kumpulan 4 (Kelantan & Terengganu)"
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Keperluan Khas (Diet / Kesihatan / Perubatan)
                </label>
                <input
                  type="text"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="cth. Vegetarian, Alahan Makanan Laut, dsb."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Catatan Dalaman Urus Setia
                </label>
                <textarea
                  value={secretariatNotes}
                  onChange={(e) => setSecretariatNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan penganjur untuk rujukan dalaman..."
                  className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAllocationModal(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                >
                  Simpan Peruntukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SES 4.4 Data Safety Modals */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        course={course}
        enrollments={enrollments}
        onCommitImport={handleCommitImport}
      />

      <BackupDataModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        course={course}
        enrollments={enrollments}
        onRestoreBackup={handleRestoreBackupData}
      />

      <AuditDuplikasiModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        course={course}
        enrollments={enrollments}
        onEditParticipant={openEditModal}
        onDeleteParticipant={onDeleteParticipant}
      />

      {/* In-App Delete Confirmation Modal (Bypasses iframe sandbox restrictions) */}
      {deleteModalState?.isOpen && (
        <div 
          id="modal-confirm-delete-participants"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteModalState(null)}
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
                  {deleteModalState.title}
                </h3>
                <p className="text-[10px] font-mono font-bold text-red-700 uppercase tracking-wider">
                  Deleted Means Deleted
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Adakah anda pasti mahu memadam <strong>{deleteModalState.count}</strong> peserta ini secara kekal dari kursus ini? Rekod pendaftaran, status kehadiran, dan peruntukan bilik/kumpulan akan dipadam sepenuhnya. Tindakan ini tidak boleh diundur.
            </p>

            {/* List preview of names */}
            <div className="max-h-36 overflow-y-auto border border-zinc-200 bg-zinc-50 p-2 text-[11px] font-mono divide-y divide-zinc-200">
              {deleteModalState.namesPreview.map((pName, i) => (
                <div key={i} className="py-1 flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-800 truncate">{pName}</span>
                </div>
              ))}
              {deleteModalState.count > deleteModalState.namesPreview.length && (
                <div className="py-1 text-zinc-500 italic text-[10px]">
                  ... dan {deleteModalState.count - deleteModalState.namesPreview.length} peserta lain
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                id="btn-cancel-delete-participants"
                type="button"
                onClick={() => setDeleteModalState(null)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-participants-execute"
                type="button"
                onClick={handleConfirmDeleteParticipants}
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
