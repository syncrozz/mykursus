import React from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Users, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  GitPullRequest
} from 'lucide-react';
import { Course, Organizer, ApprovalChangeRequest, CourseStatus, ApprovalStatus } from '../../types';
import { formatDateRangeDMY } from '../../utils/dateFormatter';

interface AdminDashboardProps {
  courses: Course[];
  organizers: Organizer[];
  changeRequests: ApprovalChangeRequest[];
  onSelectCourse: (course: Course) => void;
  onNavigateToCourses: (filterApproval?: ApprovalStatus) => void;
  onNavigateToOrganizers: () => void;
  onNavigateToChanges: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  courses,
  organizers,
  changeRequests,
  onSelectCourse,
  onNavigateToCourses,
  onNavigateToOrganizers,
  onNavigateToChanges,
}) => {
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === CourseStatus.ACTIVE);
  const upcomingCourses = courses.filter(c => c.status === CourseStatus.UPCOMING);
  const completedCourses = courses.filter(c => c.status === CourseStatus.COMPLETED);
  const archivedCourses = courses.filter(c => c.status === CourseStatus.ARCHIVED);
  const pendingApproval = courses.filter(c => c.approvalStatus === ApprovalStatus.SUBMITTED);
  const changesRequired = courses.filter(c => c.approvalStatus === ApprovalStatus.CHANGES_REQUIRED);
  const pendingChanges = changeRequests.filter(cr => cr.status === 'PENDING');

  const isEmpty = totalCourses === 0 && organizers.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Empty State Banner if completely fresh */}
      {isEmpty && (
        <div className="bg-white border-2 border-zinc-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                Pangkalan Data Permulaan Bersih
              </h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
              Pangkalan data kosong adalah keadaan sah permulaan (&quot;Empty Means Empty&quot;). Tiada data palsu atau mock disuntik secara automatik. Penganjur boleh mula mendaftar kursus dan peserta baharu.
            </p>
          </div>
          <button
            onClick={() => onNavigateToOrganizers()}
            className="px-4 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-2 shrink-0"
          >
            <span>Urus Penganjur</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Purposeful Platform Metrics Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Courses */}
        <div className="bg-white border-2 border-zinc-900 p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Jumlah Kursus
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-zinc-950">{totalCourses}</span>
            <BookOpen className="w-4 h-4 text-zinc-400" />
          </div>
        </div>

        {/* Metric 2: Pending Approval */}
        <div 
          onClick={() => onNavigateToCourses(ApprovalStatus.SUBMITTED)}
          className={`p-4 border-2 flex flex-col justify-between cursor-pointer transition-all shadow-xs ${
            pendingApproval.length > 0 
              ? 'bg-amber-50 border-amber-600 hover:bg-amber-100/70' 
              : 'bg-white border-zinc-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
            Menunggu Kelulusan
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-3xl font-black ${pendingApproval.length > 0 ? 'text-amber-900' : 'text-zinc-950'}`}>
              {pendingApproval.length}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Metric 3: Active Courses */}
        <div className="bg-white border-2 border-zinc-900 p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Kursus Aktif
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-zinc-950">{activeCourses.length}</span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
        </div>

        {/* Metric 4: Upcoming Courses */}
        <div className="bg-white border-2 border-zinc-900 p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Akan Datang
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-zinc-950">{upcomingCourses.length}</span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
        </div>

        {/* Metric 5: Total Organizers */}
        <div 
          onClick={onNavigateToOrganizers}
          className="bg-white border-2 border-zinc-900 p-4 flex flex-col justify-between cursor-pointer hover:bg-zinc-50 shadow-xs"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Penganjur
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-zinc-950">{organizers.length}</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
        </div>

        {/* Metric 6: Completed / Archived */}
        <div className="bg-white border-2 border-zinc-900 p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Selesai / Arkib
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-zinc-950">{completedCourses.length + archivedCourses.length}</span>
            <Archive className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Action Required Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Items Requiring Review / Attention */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500"></span>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Tindakan Perlu: Kursus Menunggu Kelulusan ({pendingApproval.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToCourses(ApprovalStatus.SUBMITTED)}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingApproval.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
                Tiada kursus menunggu kelulusan pada masa ini.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApproval.map((c) => {
                  const org = organizers.find(o => o.id === c.organizerId);
                  return (
                    <div 
                      key={c.id} 
                      className="p-4 border-2 border-zinc-900 bg-amber-50/50 hover:bg-amber-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-amber-200 text-amber-900">
                            {c.code || 'KURSUS'}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 line-clamp-1">
                            {c.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-zinc-400" />
                            <span>{org?.name || 'Penganjur Tidak Diketahui'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{formatDateRangeDMY(c.startDate, c.endDate)}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectCourse(c)}
                        className="px-3.5 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 shrink-0 self-start sm:self-center"
                      >
                        Semak & Luluskan
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staged Change Requests awaiting Decision */}
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Permohonan Pindaan Berisiko Tinggi ({pendingChanges.length})
                </h3>
              </div>
              <button
                onClick={onNavigateToChanges}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Urus Pindaan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingChanges.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
                Tiada permohonan pindaan lokasi/tarikh rasmi menunggu kelulusan.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingChanges.map((cr) => (
                  <div key={cr.id} className="p-3.5 border-2 border-zinc-900 bg-blue-50/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{cr.courseTitle}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-200 text-blue-900 uppercase">
                        {cr.targetField}
                      </span>
                    </div>
                    <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 border border-blue-200 font-mono">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Asal Diterbitkan:</span>
                        <span className="text-zinc-700">{cr.currentValue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block uppercase">Cadangan Pindaan:</span>
                        <span className="text-blue-900 font-bold">{cr.proposedValue}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-zinc-500">Penganjur: {cr.requestedByOrganizerName}</span>
                      <button
                        onClick={onNavigateToChanges}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <span>Semak & Sahkan</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Active & Spotlighted Courses Overview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border-2 border-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                  Kursus Sedang Berlangsung / Aktif ({activeCourses.length})
                </h3>
              </div>
            </div>

            {activeCourses.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
                Tiada kursus berstatus AKTIF pada masa ini.
              </div>
            ) : (
              <div className="space-y-3">
                {activeCourses.map((c, idx) => (
                  <div key={`${c.id}-${idx}`} className="p-3.5 border-2 border-zinc-900 bg-emerald-50/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-950">{c.title}</span>
                      {c.isFeaturedActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{formatDateRangeDMY(c.startDate, c.endDate)}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="line-clamp-1">{c.venueName}</span>
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-xs">
                      <span className="font-mono text-[10px] text-zinc-500">/{c.slug}</span>
                      <button
                        onClick={() => onSelectCourse(c)}
                        className="font-bold text-zinc-900 hover:underline flex items-center gap-1"
                      >
                        <span>Tadbir Urus</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform Governance Axioms Reference */}
          <div className="bg-zinc-900 text-white border-2 border-zinc-900 p-5 shadow-xs">
            <h4 className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase mb-2">
              Prinsip Tadbir Urus Platform
            </h4>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 mt-1.5 shrink-0"></span>
                <p><strong className="text-white">Admin Data Is Authoritative:</strong> Keputusan Master Admin adalah rasmi dan muktamad.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 mt-1.5 shrink-0"></span>
                <p><strong className="text-white">Kelulusan Tarikh & Lokasi:</strong> Penganjur tidak boleh menukar tarikh dan venue rasmi tanpa kelulusan.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 mt-1.5 shrink-0"></span>
                <p><strong className="text-white">Pengumuman Terus:</strong> Penganjur boleh membuat hebahan terus semasa acara tanpa sekatan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
