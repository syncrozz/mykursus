import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  Calendar, 
  FileText, 
  MapPin, 
  Send, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Building,
  Bell
} from 'lucide-react';
import { Course, ApprovalStatus, Participant, CourseEnrollment, SessionItem, Announcement } from '../../types';

interface CourseOverviewTabProps {
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  sessions: SessionItem[];
  announcements: Announcement[];
  onNavigateTab: (tab: string) => void;
  onSubmitForReview: () => void;
  onOpenPublicPreview: () => void;
}

export const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({
  course,
  enrollments,
  sessions,
  announcements,
  onNavigateTab,
  onSubmitForReview,
  onOpenPublicPreview,
}) => {
  const isDraft = course.approvalStatus === ApprovalStatus.DRAFT;
  const isChangesRequired = course.approvalStatus === ApprovalStatus.CHANGES_REQUIRED;
  const isSubmitted = course.approvalStatus === ApprovalStatus.SUBMITTED;
  const isApproved = course.approvalStatus === ApprovalStatus.APPROVED;

  // Readiness checklist calculations
  const hasBasicInfo = Boolean(course.title && course.startDate && course.endDate && course.venueName);
  const safeEnrollments = enrollments || [];
  const safeSessions = sessions || [];
  const safeAnnouncements = announcements || [];
  const hasSessions = safeSessions.length > 0;
  const hasParticipants = safeEnrollments.length > 0;
  const canSubmit = (isDraft || isChangesRequired) && hasBasicInfo;

  return (
    <div className="space-y-6">
      {/* Review Notes Alert (if CHANGES_REQUIRED) */}
      {isChangesRequired && (
        <div className="p-4 bg-red-50 border-2 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-black uppercase text-red-700">
                Pindaan Diperlukan oleh Master Admin
              </div>
              <h3 className="text-sm font-bold text-red-950 mt-0.5 mb-1">
                Sila kemaskini maklumat berikut sebelum menghantar semula:
              </h3>
              <p className="text-xs text-red-800 bg-white/80 p-2.5 border border-red-300 font-mono">
                {course.reviewNotes || 'Tiada nota spesifik disertakan.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => onNavigateTab('participants')}
          className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer hover:bg-zinc-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Peserta</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{safeEnrollments.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Klik untuk urus pendaftaran</div>
        </div>

        <div 
          onClick={() => onNavigateTab('schedule')}
          className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer hover:bg-zinc-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Sesi Kursus</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{safeSessions.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Jadual & penceramah</div>
        </div>

        <div 
          onClick={() => onNavigateTab('announcements')}
          className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer hover:bg-zinc-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Pengumuman</span>
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{safeAnnouncements.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Hebahan langsung segera</div>
        </div>

        <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Status Kelulusan</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-zinc-900 mt-1 truncate">
            {course.approvalStatus}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Tadbir urus platform</div>
        </div>
      </div>

      {/* Two Column Layout: Readiness & Public Slug */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Readiness Checklist */}
        <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-700" />
              <span>Senarai Semak Ketersediaan Kursus</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 font-bold">
              DCOREV1 WORKSPACE
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasBasicInfo ? 'text-emerald-600' : 'text-zinc-300'}`} />
                <span className="font-semibold text-zinc-800">Maklumat Asas, Tarikh & Lokasi</span>
              </div>
              <button 
                onClick={() => onNavigateTab('info')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Semak
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasSessions ? 'text-emerald-600' : 'text-zinc-300'}`} />
                <span className="font-semibold text-zinc-800">Jadual Pengisian & Sesi Kursus ({safeSessions.length})</span>
              </div>
              <button 
                onClick={() => onNavigateTab('schedule')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Urus Sesi
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasParticipants ? 'text-emerald-600' : 'text-zinc-300'}`} />
                <span className="font-semibold text-zinc-800">Senarai Peserta Berdaftar ({safeEnrollments.length})</span>
              </div>
              <button 
                onClick={() => onNavigateTab('participants')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Urus Peserta
              </button>
            </div>
          </div>

          {/* Submission CTA */}
          <div className="pt-2 border-t border-zinc-200">
            {isDraft || isChangesRequired ? (
              <div className="space-y-2">
                <button
                  disabled={!canSubmit}
                  onClick={onSubmitForReview}
                  className={`w-full py-2.5 px-4 text-xs font-bold border-2 border-zinc-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all ${
                    canSubmit 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Hantar Kursus untuk Semakan Master Admin</span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  Setelah dihantar, status akan bertukar kepada <strong>SUBMITTED</strong> untuk semakan rasmi.
                </p>
              </div>
            ) : isSubmitted ? (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kursus sedang dalam semakan Master Admin. Pindaan operasi (peserta, penceramah, pengumuman) masih boleh dibuat bila-bila masa.</span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kursus telah diluluskan secara rasmi dan beroperasi untuk peserta awam.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Public Access & Slug Preview */}
        <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-700" />
                <span>Akses Awam Peserta (Option A)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 font-bold border border-blue-300">
                PUBLIC SLUG
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Peserta mengakses laman maklumat kursus secara terus melalui slug unik. Maklumat peribadi (bilik, rakan sebilik, kumpulan) disahkan melalui nombor telefon tanpa perlu akaun kata laluan.
            </p>

            <div className="bg-zinc-100 p-3 border-2 border-zinc-900 font-mono text-xs flex items-center justify-between gap-2">
              <span className="text-blue-700 font-bold truncate">/course/{course.slug}</span>
              <button
                onClick={onOpenPublicPreview}
                className="px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 flex items-center gap-1 shrink-0"
              >
                <Eye className="w-3 h-3" />
                <span>Uji Paparan</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1 font-mono">
            <div className="font-bold text-zinc-900">Peraturan Kelulusan Langsung:</div>
            <div>• Pengumuman, pautan slaid & nota operasi boleh dikemaskini tanpa menunggu kelulusan Master Admin.</div>
            <div>• Pindaan tarikh atau lokasi rasmi kursus memerlukan permohonan semakan berperingkat.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
