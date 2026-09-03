import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Calendar, 
  Download, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Users, 
  CheckSquare, 
  Square,
  ShieldAlert,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  Course, 
  Participant, 
  CourseEnrollment, 
  ScheduleDay, 
  SessionItem, 
  AttendanceRecord, 
  AttendanceStatus, 
  AttendanceLevel, 
  ParticipantLifecycleStatus,
  UserAuthContext
} from '../../types';

interface AttendanceTabProps {
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  attendanceRecords: AttendanceRecord[];
  authContext?: UserAuthContext;
  onSaveAttendance: (record: AttendanceRecord) => void;
  onBulkSaveAttendance: (records: AttendanceRecord[]) => void;
  onDeleteAttendance: (recordId: string) => void;
  onUpdateParticipantStatus: (enrollmentId: string, status: ParticipantLifecycleStatus) => void;
  onUpdateAttendanceConfig?: (config: any) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  course,
  enrollments,
  scheduleDays,
  sessions,
  attendanceRecords,
  authContext,
  onSaveAttendance,
  onBulkSaveAttendance,
  onDeleteAttendance,
  onUpdateParticipantStatus,
  onUpdateAttendanceConfig,
}) => {
  // Navigation sub-tab: 'marking' | 'tracking'
  const [subView, setSubView] = useState<'marking' | 'tracking'>('marking');

  // Attendance Level: 'DAILY' | 'SESSION' | 'COURSE'
  const [attendanceLevel, setAttendanceLevel] = useState<AttendanceLevel>(
    course.attendanceConfig?.attendanceLevel || 'DAILY'
  );

  // Sorting days by dayNumber
  const sortedDays = useMemo(() => {
    return [...scheduleDays].sort((a, b) => a.dayNumber - b.dayNumber);
  }, [scheduleDays]);

  // Sorting sessions
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => a.dayNumber - b.dayNumber || a.sessionNumber - b.sessionNumber);
  }, [sessions]);

  // Selected Day (for DAILY and SESSION levels)
  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    sortedDays[0]?.dayNumber || 1
  );

  // Selected Session (for SESSION level)
  const daySessions = useMemo(() => {
    return sortedSessions.filter(s => s.dayNumber === selectedDayNum);
  }, [sortedSessions, selectedDayNum]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    daySessions[0]?.id || ''
  );

  // Keep selected session in sync if day changes
  React.useEffect(() => {
    if (daySessions.length > 0 && (!selectedSessionId || !daySessions.some(s => s.id === selectedSessionId))) {
      setSelectedSessionId(daySessions[0].id);
    }
  }, [daySessions, selectedSessionId]);

  // Search & Filter in Marking sub-view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'UNMARKED'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  // Multi-selection for bulk marking
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState<boolean>(false);
  const [bulkActionTarget, setBulkActionTarget] = useState<'PRESENT' | 'ABSENT' | null>(null);

  // Completion requirement percentage
  const [minReqPercentage, setMinReqPercentage] = useState<number>(
    course.attendanceConfig?.requireMinimumPercentage ?? 80
  );

  // Extract all unique groups
  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach(e => {
      if (e.enrollment.assignedGroup) set.add(e.enrollment.assignedGroup);
    });
    return Array.from(set);
  }, [enrollments]);

  // Selected context day object
  const currentDayObj = sortedDays.find(d => d.dayNumber === selectedDayNum);
  const currentSessionObj = sortedSessions.find(s => s.id === selectedSessionId);

  // Helper to find attendance record for a participant in current context
  const getContextAttendanceRecord = (participantId: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(a => {
      if (a.participantId !== participantId) return false;
      if (attendanceLevel === 'COURSE') return a.attendanceLevel === 'COURSE';
      if (attendanceLevel === 'DAILY') return a.attendanceLevel === 'DAILY' && a.dayNumber === selectedDayNum;
      if (attendanceLevel === 'SESSION') return a.attendanceLevel === 'SESSION' && a.sessionId === selectedSessionId;
      return false;
    });
  };

  // Helper to get total course attendance stats for a participant
  const getParticipantCourseStats = (participantId: string) => {
    let totalExpected = 0;
    let presentCount = 0;

    if (attendanceLevel === 'DAILY') {
      totalExpected = sortedDays.length || 1;
      sortedDays.forEach(d => {
        const rec = attendanceRecords.find(a => 
          a.participantId === participantId && 
          a.attendanceLevel === 'DAILY' && 
          a.dayNumber === d.dayNumber
        );
        if (rec && (rec.status === 'PRESENT' || rec.status === 'LATE')) {
          presentCount++;
        }
      });
    } else if (attendanceLevel === 'SESSION') {
      totalExpected = sortedSessions.length || 1;
      sortedSessions.forEach(s => {
        const rec = attendanceRecords.find(a => 
          a.participantId === participantId && 
          a.attendanceLevel === 'SESSION' && 
          a.sessionId === s.id
        );
        if (rec && (rec.status === 'PRESENT' || rec.status === 'LATE')) {
          presentCount++;
        }
      });
    } else {
      totalExpected = 1;
      const rec = attendanceRecords.find(a => 
        a.participantId === participantId && 
        a.attendanceLevel === 'COURSE'
      );
      if (rec && (rec.status === 'PRESENT' || rec.status === 'LATE')) {
        presentCount = 1;
      }
    }

    const percentage = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;
    const isEligible = percentage >= minReqPercentage;
    return { totalExpected, presentCount, percentage, isEligible };
  };

  // Context Attendance Stats for Current View
  const contextStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;

    enrollments.forEach(({ participant }) => {
      const rec = getContextAttendanceRecord(participant.id);
      if (!rec) {
        unmarked++;
      } else if (rec.status === 'PRESENT') {
        present++;
      } else if (rec.status === 'ABSENT') {
        absent++;
      } else if (rec.status === 'EXCUSED' || rec.status === 'LATE') {
        excused++;
      }
    });

    const total = enrollments.length;
    const rate = total > 0 ? Math.round(((present + excused) / total) * 100) : 0;

    return { total, present, absent, excused, unmarked, rate };
  }, [enrollments, attendanceRecords, attendanceLevel, selectedDayNum, selectedSessionId]);

  // Filtered participants list for Marking sub-view
  const filteredParticipants = useMemo(() => {
    return enrollments.filter(({ participant, enrollment }) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = participant.name.toLowerCase().includes(q);
        const matchPhone = participant.phone.includes(q);
        const matchAgency = participant.institutionOrAgency.toLowerCase().includes(q);
        const matchSalary = participant.salaryNumber?.toLowerCase().includes(q);
        const matchRoom = enrollment.roomNumber?.toLowerCase().includes(q);
        const matchGroup = enrollment.assignedGroup?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAgency && !matchSalary && !matchRoom && !matchGroup) {
          return false;
        }
      }

      // 2. Group Filter
      if (groupFilter !== 'ALL') {
        if (enrollment.assignedGroup !== groupFilter) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        const rec = getContextAttendanceRecord(participant.id);
        const status = rec ? rec.status : 'UNMARKED';
        if (statusFilter === 'UNMARKED' && rec) return false;
        if (statusFilter === 'PRESENT' && status !== 'PRESENT') return false;
        if (statusFilter === 'ABSENT' && status !== 'ABSENT') return false;
        if (statusFilter === 'EXCUSED' && (status !== 'EXCUSED' && status !== 'LATE')) return false;
      }

      return true;
    });
  }, [enrollments, searchQuery, groupFilter, statusFilter, attendanceRecords, attendanceLevel, selectedDayNum, selectedSessionId]);

  // Handler to mark individual participant attendance
  const handleMarkAttendance = (
    participantId: string, 
    enrollmentId: string, 
    status: AttendanceStatus
  ) => {
    const existing = getContextAttendanceRecord(participantId);

    // If clicking same active status, offer to reset/remove
    if (existing && existing.status === status) {
      onDeleteAttendance(existing.id);
      return;
    }

    const newRecord: AttendanceRecord = {
      id: existing?.id || '',
      courseId: course.id,
      participantId,
      enrollmentId,
      attendanceLevel,
      dayNumber: attendanceLevel === 'DAILY' || attendanceLevel === 'SESSION' ? selectedDayNum : undefined,
      date: currentDayObj?.date,
      sessionId: attendanceLevel === 'SESSION' ? selectedSessionId : undefined,
      sessionNumber: currentSessionObj?.sessionNumber,
      status,
      checkInMethod: 'ORGANIZER_MANUAL',
      markedAt: new Date().toISOString(),
      markedByUserId: authContext?.id,
      markedByUserName: authContext?.name || 'Urus Setia Penganjur'
    };

    onSaveAttendance(newRecord);
  };

  // Handler for bulk marking (All or Selected)
  const handleExecuteBulkMarking = (targetStatus: AttendanceStatus, targetParticipants: typeof enrollments) => {
    const recordsToSave: AttendanceRecord[] = targetParticipants.map(({ participant, enrollment }) => {
      const existing = getContextAttendanceRecord(participant.id);
      return {
        id: existing?.id || '',
        courseId: course.id,
        participantId: participant.id,
        enrollmentId: enrollment.id,
        attendanceLevel,
        dayNumber: attendanceLevel === 'DAILY' || attendanceLevel === 'SESSION' ? selectedDayNum : undefined,
        date: currentDayObj?.date,
        sessionId: attendanceLevel === 'SESSION' ? selectedSessionId : undefined,
        sessionNumber: currentSessionObj?.sessionNumber,
        status: targetStatus,
        checkInMethod: 'ORGANIZER_MANUAL',
        markedAt: new Date().toISOString(),
        markedByUserId: authContext?.id,
        markedByUserName: authContext?.name || 'Urus Setia Penganjur'
      };
    });

    onBulkSaveAttendance(recordsToSave);
    setSelectedEnrollmentIds([]);
    setShowBulkConfirmModal(false);
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedEnrollmentIds.length === filteredParticipants.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(filteredParticipants.map(p => p.enrollment.id));
    }
  };

  const toggleSelectOne = (enrollmentId: string) => {
    setSelectedEnrollmentIds(prev => 
      prev.includes(enrollmentId) 
        ? prev.filter(id => id !== enrollmentId) 
        : [...prev, enrollmentId]
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const contextTitle = attendanceLevel === 'DAILY'
      ? `Hari_${selectedDayNum}_${currentDayObj?.date || ''}`
      : attendanceLevel === 'SESSION'
        ? `Sesi_${currentSessionObj?.sessionNumber || selectedSessionId}`
        : 'Keseluruhan_Kursus';

    const headers = [
      'Nama Peserta',
      'No Telefon',
      'No Gaji/ID',
      'Institusi/Agensi',
      'Jawatan',
      'Bilik',
      'Kumpulan',
      'Status Pendaftaran',
      `Kehadiran (${contextTitle})`,
      'Peratus Keseluruhan (%)',
      'Ditanda Pada',
      'Ditanda Oleh'
    ];

    const rows = enrollments.map(({ participant, enrollment }) => {
      const rec = getContextAttendanceRecord(participant.id);
      const stats = getParticipantCourseStats(participant.id);
      return [
        `"${participant.name.replace(/"/g, '""')}"`,
        `"${participant.phone}"`,
        `"${participant.salaryNumber || enrollment.salaryNumber || '-'}"`,
        `"${participant.institutionOrAgency.replace(/"/g, '""')}"`,
        `"${participant.designation || '-'}"`,
        `"${enrollment.roomNumber || '-'}"`,
        `"${enrollment.assignedGroup || '-'}"`,
        `"${enrollment.status}"`,
        `"${rec ? rec.status : 'BELUM DITANDA'}"`,
        `"${stats.percentage}%"`,
        `"${rec?.markedAt ? new Date(rec.markedAt).toLocaleString('ms-MY') : '-'}"`,
        `"${rec?.markedByUserName || '-'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kehadiran_${course.code || course.slug}_${contextTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk complete eligible participants
  const handleBulkCompleteEligible = () => {
    const eligibleCount = enrollments.filter(e => {
      const stats = getParticipantCourseStats(e.participant.id);
      return stats.isEligible && e.enrollment.status !== 'COMPLETED';
    }).length;

    if (eligibleCount === 0) {
      alert('Semua peserta yang layak (≥ 80%) telah pun ditandakan sebagai TAMAT KURSUS, atau tiada peserta yang memenuhi syarat.');
      return;
    }

    if (window.confirm(`Adakah anda pasti untuk mengesahkan penamatan kursus bagi ${eligibleCount} peserta yang mencapai kehadiran minimum (${minReqPercentage}%)?`)) {
      enrollments.forEach(({ participant, enrollment }) => {
        const stats = getParticipantCourseStats(participant.id);
        if (stats.isEligible && enrollment.status !== 'COMPLETED') {
          onUpdateParticipantStatus(enrollment.id, 'COMPLETED');
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP ATTENDANCE NAVIGATION & CONFIG BAR */}
      <div className="bg-white border-2 border-zinc-900 p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-900 text-[10px] font-mono font-bold uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>MODUL KEHADIRAN & STATUS PESERTA</span>
              </span>
              <span className="text-xs font-mono text-zinc-500 font-bold">
                KOD: {course.code || course.slug}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 uppercase tracking-tight mt-1">
              Pengurusan Kehadiran & Penjejakan Kursus
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Pantau pendaftaran, tanda kehadiran rasmi harian/sesi, dan tetapkan syarat tamat kursus.
            </p>
          </div>

          {/* Sub-view Navigation Tabs */}
          <div className="flex items-center gap-2 bg-zinc-100 p-1 border border-zinc-300 self-start md:self-auto">
            <button
              onClick={() => setSubView('marking')}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subView === 'marking'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Penandaan Kehadiran</span>
            </button>
            <button
              onClick={() => setSubView('tracking')}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subView === 'tracking'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Penjejakan & Tamat Kursus</span>
            </button>
          </div>
        </div>

        {/* Attendance Level Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Tahap Kehadiran:
            </span>
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-300 p-0.5">
              <button
                onClick={() => {
                  setAttendanceLevel('DAILY');
                  if (onUpdateAttendanceConfig) {
                    onUpdateAttendanceConfig({ ...course.attendanceConfig, attendanceLevel: 'DAILY' });
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                  attendanceLevel === 'DAILY'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Harian (Daily)
              </button>
              <button
                onClick={() => {
                  setAttendanceLevel('SESSION');
                  if (onUpdateAttendanceConfig) {
                    onUpdateAttendanceConfig({ ...course.attendanceConfig, attendanceLevel: 'SESSION' });
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                  attendanceLevel === 'SESSION'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Mengikut Sesi (Session)
              </button>
              <button
                onClick={() => {
                  setAttendanceLevel('COURSE');
                  if (onUpdateAttendanceConfig) {
                    onUpdateAttendanceConfig({ ...course.attendanceConfig, attendanceLevel: 'COURSE' });
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                  attendanceLevel === 'COURSE'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Peringkat Kursus (Course)
              </button>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Eksport data kehadiran ke format CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              <span>Eksport CSV</span>
            </button>
          </div>
        </div>

        {/* Context Selector: Days or Sessions */}
        {attendanceLevel === 'DAILY' && sortedDays.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 p-2.5 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">
              Pilih Hari:
            </span>
            <div className="flex items-center gap-2 flex-nowrap">
              {sortedDays.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDayNum(d.dayNumber)}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedDayNum === d.dayNumber
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  <span>Hari {d.dayNumber}</span>
                  <span className="text-[10px] ml-1.5 opacity-80 font-normal font-mono">
                    ({d.date || 'Tarikh Belum Ditetapkan'})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {attendanceLevel === 'SESSION' && (
          <div className="space-y-2 bg-zinc-50 border border-zinc-200 p-2.5">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">
                Pilih Hari:
              </span>
              <div className="flex items-center gap-2 flex-nowrap">
                {sortedDays.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayNum(d.dayNumber)}
                    className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedDayNum === d.dayNumber
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    Hari {d.dayNumber}
                  </button>
                ))}
              </div>
            </div>

            {daySessions.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-200">
                <span className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">
                  Sesi:
                </span>
                <div className="flex items-center gap-2 flex-nowrap">
                  {daySessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                        selectedSessionId === s.id
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500 hover:bg-zinc-100'
                      }`}
                    >
                      <span className="font-mono">[{s.startTime}-{s.endTime}]</span>
                      <span className="ml-1.5">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-800 p-1.5 bg-amber-50 border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Tiada sesi didaftarkan untuk Hari {selectedDayNum}.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. SUB-VIEW 1: ATTENDANCE MARKING (PENANDAAN KEHADIRAN) */}
      {subView === 'marking' && (
        <div className="space-y-4">
          {/* Real-time Attendance Stats Cockpit */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Jumlah Peserta
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-zinc-900">{contextStats.total}</span>
                <span className="text-[11px] text-zinc-500">orang</span>
              </div>
            </div>

            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">
                Hadir (Present)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-emerald-600">{contextStats.present}</span>
                <span className="text-[11px] text-zinc-500">orang</span>
              </div>
            </div>

            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-red-700 font-bold block">
                Tidak Hadir (Absent)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-red-600">{contextStats.absent}</span>
                <span className="text-[11px] text-zinc-500">orang</span>
              </div>
            </div>

            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-amber-700 font-bold block">
                Pelepasan / Lewat
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-amber-600">{contextStats.excused}</span>
                <span className="text-[11px] text-zinc-500">orang</span>
              </div>
            </div>

            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-zinc-600 font-bold block">
                Belum Ditanda
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-zinc-700">{contextStats.unmarked}</span>
                <span className="text-[11px] text-zinc-500">orang</span>
              </div>
            </div>

            <div className="bg-white border-2 border-zinc-900 p-3 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Kadar Kehadiran
              </span>
              <div className="mt-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xl font-black text-zinc-950">{contextStats.rate}%</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {contextStats.present + contextStats.excused}/{contextStats.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      contextStats.rate >= 80 ? 'bg-emerald-600' : contextStats.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${contextStats.rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbars */}
          <div className="bg-white border-2 border-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, no telefon, kolej, no gaji, bilik, atau kumpulan..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              {/* Group Filter */}
              {uniqueGroups.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase whitespace-nowrap">
                    Kumpulan:
                  </span>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="p-2 text-xs border border-zinc-300 focus:border-zinc-900 bg-white font-medium"
                  >
                    <option value="ALL">Semua Kumpulan</option>
                    {uniqueGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Status Filter Chips & Bulk Action Triggers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
              {/* Filter Chips */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Semua ({enrollments.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PRESENT')}
                  className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'PRESENT'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Hadir ({contextStats.present})
                </button>
                <button
                  onClick={() => setStatusFilter('ABSENT')}
                  className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ABSENT'
                      ? 'bg-red-700 text-white'
                      : 'bg-red-50 text-red-800 hover:bg-red-100'
                  }`}
                >
                  Tidak Hadir ({contextStats.absent})
                </button>
                <button
                  onClick={() => setStatusFilter('EXCUSED')}
                  className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'EXCUSED'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Pelepasan ({contextStats.excused})
                </button>
                <button
                  onClick={() => setStatusFilter('UNMARKED')}
                  className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'UNMARKED'
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Belum Ditanda ({contextStats.unmarked})
                </button>
              </div>

              {/* Bulk Actions Button Group */}
              <div className="flex items-center gap-2">
                {selectedEnrollmentIds.length > 0 ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2 py-1">
                    <span className="text-[11px] font-bold text-amber-900">
                      {selectedEnrollmentIds.length} dipilih:
                    </span>
                    <button
                      onClick={() => {
                        const targets = enrollments.filter(e => selectedEnrollmentIds.includes(e.enrollment.id));
                        handleExecuteBulkMarking('PRESENT', targets);
                      }}
                      className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Tanda Hadir
                    </button>
                    <button
                      onClick={() => {
                        const targets = enrollments.filter(e => selectedEnrollmentIds.includes(e.enrollment.id));
                        handleExecuteBulkMarking('ABSENT', targets);
                      }}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Tanda Tidak Hadir
                    </button>
                    <button
                      onClick={() => setSelectedEnrollmentIds([])}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900 underline ml-1"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setBulkActionTarget('PRESENT');
                      setShowBulkConfirmModal(true);
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tanda Semua Hadir ({filteredParticipants.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Participant List / Table */}
          <div className="bg-white border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
            {filteredParticipants.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-sm font-black text-zinc-900 uppercase">
                  {enrollments.length === 0 ? 'Tiada Peserta Didaftarkan' : 'Tiada Peserta Sepadan'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {enrollments.length === 0
                    ? 'Kursus ini belum mempunyai pendaftaran peserta. Sila tambah peserta dalam tab Peserta atau import melalui Dokumen Sumber.'
                    : 'Tiada rekod peserta yang sepadan dengan kriteria carian atau penapis status yang dipilih.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-900 bg-zinc-100 text-zinc-900 text-[10px] uppercase font-mono tracking-wider">
                      <th className="p-3 w-10 text-center">
                        <button
                          onClick={toggleSelectAll}
                          className="cursor-pointer text-zinc-700 hover:text-zinc-950"
                          title="Pilih Semua"
                        >
                          {selectedEnrollmentIds.length === filteredParticipants.length && filteredParticipants.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Peserta & Institusi</th>
                      <th className="p-3 hidden sm:table-cell">Bilik / Kumpulan</th>
                      <th className="p-3 hidden md:table-cell">Status Kitaran Hidup</th>
                      <th className="p-3">Kehadiran ({attendanceLevel === 'DAILY' ? `Hari ${selectedDayNum}` : attendanceLevel === 'SESSION' ? `Sesi ${currentSessionObj?.sessionNumber || 1}` : 'Kursus'})</th>
                      <th className="p-3 text-right hidden lg:table-cell">Statistik Kursus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-xs">
                    {filteredParticipants.map(({ participant, enrollment }) => {
                      const rec = getContextAttendanceRecord(participant.id);
                      const stats = getParticipantCourseStats(participant.id);
                      const isSelected = selectedEnrollmentIds.includes(enrollment.id);

                      return (
                        <tr 
                          key={enrollment.id} 
                          className={`hover:bg-zinc-50 transition-colors ${
                            isSelected ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          {/* Multi-select checkbox */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleSelectOne(enrollment.id)}
                              className="cursor-pointer text-zinc-500 hover:text-zinc-900"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Participant Info */}
                          <td className="p-3">
                            <div className="font-bold text-zinc-950 flex items-center gap-1.5">
                              <span>{participant.name}</span>
                              {participant.salaryNumber && (
                                <span className="text-[10px] font-mono px-1 bg-zinc-100 border border-zinc-200 text-zinc-600">
                                  {participant.salaryNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-600 mt-0.5">
                              {participant.institutionOrAgency}
                              {participant.designation && ` • ${participant.designation}`}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              {participant.phone}
                            </div>
                          </td>

                          {/* Room & Group Allocations */}
                          <td className="p-3 hidden sm:table-cell">
                            {enrollment.roomNumber ? (
                              <span className="inline-block px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-800 font-bold mr-1">
                                Bilik {enrollment.roomNumber}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-400 italic mr-1">Tiada Bilik</span>
                            )}
                            {enrollment.assignedGroup && (
                              <div className="text-[10px] text-zinc-600 truncate max-w-[140px] mt-0.5" title={enrollment.assignedGroup}>
                                {enrollment.assignedGroup}
                              </div>
                            )}
                          </td>

                          {/* Participant Lifecycle Status */}
                          <td className="p-3 hidden md:table-cell">
                            <select
                              value={enrollment.status}
                              onChange={(e) => onUpdateParticipantStatus(enrollment.id, e.target.value as ParticipantLifecycleStatus)}
                              className={`text-[11px] font-bold p-1 border uppercase focus:outline-hidden cursor-pointer ${
                                enrollment.status === 'COMPLETED'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : enrollment.status === 'ATTENDING' || enrollment.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : enrollment.status === 'ABSENT'
                                      ? 'bg-red-50 text-red-800 border-red-300'
                                      : 'bg-zinc-50 text-zinc-700 border-zinc-300'
                              }`}
                            >
                              <option value="REGISTERED">DAFTAR (REGISTERED)</option>
                              <option value="CONFIRMED">PENGESAHAN (CONFIRMED)</option>
                              <option value="ATTENDING">SEDANG HADIR (ATTENDING)</option>
                              <option value="ABSENT">TIDAK HADIR (ABSENT)</option>
                              <option value="COMPLETED">TAMAT KURSUS (COMPLETED)</option>
                              <option value="WITHDRAWN">TARIK DIRI (WITHDRAWN)</option>
                              <option value="CANCELLED">DIBATALKAN (CANCELLED)</option>
                            </select>
                          </td>

                          {/* Attendance Action Buttons */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {/* HADIR */}
                              <button
                                onClick={() => handleMarkAttendance(participant.id, enrollment.id, 'PRESENT')}
                                className={`px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  rec?.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                                title="Tanda Hadir"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hadir</span>
                              </button>

                              {/* TIDAK HADIR */}
                              <button
                                onClick={() => handleMarkAttendance(participant.id, enrollment.id, 'ABSENT')}
                                className={`px-2 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  rec?.status === 'ABSENT'
                                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                                    : 'bg-white hover:bg-red-50 text-red-800 border-red-300'
                                }`}
                                title="Tanda Tidak Hadir"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tidak Hadir</span>
                              </button>

                              {/* PELEPASAN / LEWAT */}
                              <button
                                onClick={() => handleMarkAttendance(participant.id, enrollment.id, 'EXCUSED')}
                                className={`px-2 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  rec?.status === 'EXCUSED' || rec?.status === 'LATE'
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                    : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                                title="Pelepasan / Bersebab"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Pelepasan</span>
                              </button>

                              {/* RESET */}
                              {rec && (
                                <button
                                  onClick={() => onDeleteAttendance(rec.id)}
                                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 ml-1"
                                  title="Set Semula (Padam)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Marked audit footnote */}
                            {rec && (
                              <div className="text-[10px] text-zinc-400 font-mono mt-1">
                                Ditanda {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : ''} 
                                {rec.markedByUserName ? ` oleh ${rec.markedByUserName}` : ''}
                              </div>
                            )}
                          </td>

                          {/* Overall Course Attendance Statistic */}
                          <td className="p-3 text-right hidden lg:table-cell">
                            <div className="font-bold text-zinc-900">
                              {stats.presentCount} / {stats.totalExpected} {attendanceLevel === 'DAILY' ? 'Hari' : 'Sesi'}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-mono font-bold ${
                                stats.percentage >= minReqPercentage ? 'text-emerald-700' : 'text-amber-700'
                              }`}>
                                {stats.percentage}%
                              </span>
                              {stats.isEligible && (
                                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-900 text-[9px] font-bold">
                                  Layak
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SUB-VIEW 2: COURSE TRACKING & COMPLETION MATRIX */}
      {subView === 'tracking' && (
        <div className="space-y-4">
          {/* Completion Rules & Configuration Banner */}
          <div className="bg-white border-2 border-zinc-900 p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-700" />
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                    Syarat & Peraturan Kelayakan Tamat Kursus
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                  Tentukan syarat kelayakan sijil dan penamatan kursus. Mengikut DCOREV1, status &quot;TAMAT KURSUS&quot; 
                  tidak diubah secara automatik tanpa pengesahan urus setia dan pematuhan syarat kehadiran minimum.
                </p>
              </div>

              {/* Requirement Input Controls */}
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 p-2">
                <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">
                  Minima Kehadiran:
                </span>
                <select
                  value={minReqPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinReqPercentage(val);
                    if (onUpdateAttendanceConfig) {
                      onUpdateAttendanceConfig({ ...course.attendanceConfig, requireMinimumPercentage: val });
                    }
                  }}
                  className="p-1.5 text-xs font-bold bg-white border border-zinc-300 focus:border-zinc-900"
                >
                  <option value={70}>70% Kehadiran</option>
                  <option value={75}>75% Kehadiran</option>
                  <option value={80}>80% Kehadiran (Standard)</option>
                  <option value={85}>85% Kehadiran</option>
                  <option value={90}>90% Kehadiran</option>
                  <option value={100}>100% Kehadiran Penuh</option>
                  <option value={0}>Tiada Syarat Minima</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Certification Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-zinc-700">Ringkasan Kelayakan:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold">
                  {enrollments.filter(e => getParticipantCourseStats(e.participant.id).isEligible).length} Layak (≥ {minReqPercentage}%)
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold">
                  {enrollments.filter(e => e.enrollment.status === 'COMPLETED').length} Telah Disahkan Tamat
                </span>
              </div>

              <button
                onClick={handleBulkCompleteEligible}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Sahkan Semua Yang Layak Tamat Kursus</span>
              </button>
            </div>
          </div>

          {/* Matrix Tracking Grid */}
          <div className="bg-white border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 bg-zinc-100 text-zinc-900 text-[10px] uppercase font-mono tracking-wider">
                    <th className="p-3">Peserta & Kolej</th>
                    {sortedDays.map(d => (
                      <th key={d.id} className="p-3 text-center">
                        Hari {d.dayNumber}
                        <div className="text-[9px] text-zinc-500 font-normal">
                          {d.date ? d.date.split('-').slice(1).join('/') : ''}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center">Kehadiran</th>
                    <th className="p-3 text-center">Peratus (%)</th>
                    <th className="p-3 text-center">Kelayakan</th>
                    <th className="p-3 text-right">Tindakan Tamat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {enrollments.map(({ participant, enrollment }) => {
                    const stats = getParticipantCourseStats(participant.id);
                    const isCompleted = enrollment.status === 'COMPLETED';

                    return (
                      <tr key={enrollment.id} className="hover:bg-zinc-50 transition-colors">
                        {/* Name & Agency */}
                        <td className="p-3">
                          <div className="font-bold text-zinc-950">{participant.name}</div>
                          <div className="text-[11px] text-zinc-500">{participant.institutionOrAgency}</div>
                        </td>

                        {/* Each Day Status */}
                        {sortedDays.map(d => {
                          const dayRec = attendanceRecords.find(a => 
                            a.participantId === participant.id && 
                            a.attendanceLevel === 'DAILY' && 
                            a.dayNumber === d.dayNumber
                          );

                          return (
                            <td key={d.id} className="p-3 text-center">
                              {dayRec ? (
                                dayRec.status === 'PRESENT' ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold font-mono">
                                    HADIR
                                  </span>
                                ) : dayRec.status === 'EXCUSED' || dayRec.status === 'LATE' ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold font-mono">
                                    LEWAT
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold font-mono">
                                    TIADA
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Count */}
                        <td className="p-3 text-center font-mono font-bold">
                          {stats.presentCount}/{stats.totalExpected}
                        </td>

                        {/* Percentage */}
                        <td className="p-3 text-center">
                          <span className={`font-mono font-black ${
                            stats.percentage >= minReqPercentage ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </td>

                        {/* Eligibility Status */}
                        <td className="p-3 text-center">
                          {stats.isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>LAYAK</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-600 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 text-zinc-400" />
                              <span>BELUM</span>
                            </span>
                          )}
                        </td>

                        {/* Completion Action */}
                        <td className="p-3 text-right">
                          {isCompleted ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="px-2 py-0.5 bg-purple-100 border border-purple-300 text-purple-900 text-[10px] font-bold font-mono">
                                SELESAI
                              </span>
                              <button
                                onClick={() => onUpdateParticipantStatus(enrollment.id, 'ATTENDING')}
                                className="text-[10px] text-zinc-500 hover:text-red-700 underline"
                                title="Tarik Balik Status Tamat"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onUpdateParticipantStatus(enrollment.id, 'COMPLETED')}
                              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                stats.isEligible
                                  ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300'
                              }`}
                            >
                              Sahkan Tamat
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BULK CONFIRMATION MODAL */}
      {showBulkConfirmModal && bulkActionTarget && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-zinc-950 uppercase">
                Pengesahan Tindakan Pukal
              </h3>
            </div>

            <p className="text-xs text-zinc-700 leading-relaxed">
              Adakah anda pasti mahu menandakan kehadiran bagi semua{' '}
              <strong className="text-zinc-950">{filteredParticipants.length} peserta</strong> yang 
              tersenarai sebagai{' '}
              <strong className="text-emerald-700">
                {bulkActionTarget === 'PRESENT' ? 'HADIR' : 'TIDAK HADIR'}
              </strong>{' '}
              untuk konteks{' '}
              <strong>
                {attendanceLevel === 'DAILY' ? `Hari ${selectedDayNum}` : attendanceLevel === 'SESSION' ? `Sesi ${currentSessionObj?.title || selectedSessionId}` : 'Kursus Keseluruhan'}
              </strong>?
            </p>

            <div className="p-3 bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
              Tindakan ini hanya mengubah kehadiran bagi konteks yang dipilih dan tidak akan menimpa rekod hari lain.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 border border-zinc-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkMarking(bulkActionTarget, filteredParticipants)}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
              >
                Ya, Sahkan & Tanda Pukal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
