import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Archive, 
  Calendar, 
  MapPin, 
  Users, 
  Trash2, 
  Eye,
  Plus
} from 'lucide-react';
import { Course, Organizer, CourseStatus, ApprovalStatus } from '../../types';
import { formatDateRangeDMY } from '../../utils/dateFormatter';

interface CourseOversightProps {
  courses: Course[];
  organizers: Organizer[];
  onSelectCourse: (course: Course) => void;
  onToggleFeatured: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  initialApprovalFilter?: ApprovalStatus;
}

export const CourseOversight: React.FC<CourseOversightProps> = ({
  courses,
  organizers,
  onSelectCourse,
  onToggleFeatured,
  onDeleteCourse,
  initialApprovalFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>(initialApprovalFilter || 'ALL');
  const [organizerFilter, setOrganizerFilter] = useState<string>('ALL');

  const filteredCourses = courses.filter((course) => {
    // Search match
    const org = organizers.find(o => o.id === course.organizerId);
    const orgName = org ? org.name.toLowerCase() : '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      course.title.toLowerCase().includes(query) ||
      (course.code && course.code.toLowerCase().includes(query)) ||
      course.slug.toLowerCase().includes(query) ||
      orgName.includes(query);

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;

    // Approval filter
    const matchesApproval = approvalFilter === 'ALL' || course.approvalStatus === approvalFilter;

    // Organizer filter
    const matchesOrg = organizerFilter === 'ALL' || course.organizerId === organizerFilter;

    return matchesSearch && matchesStatus && matchesApproval && matchesOrg;
  });

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
            AKTIF
          </span>
        );
      case CourseStatus.UPCOMING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold uppercase tracking-wider">
            AKAN DATANG
          </span>
        );
      case CourseStatus.COMPLETED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 text-[10px] font-bold uppercase tracking-wider">
            SELESAI
          </span>
        );
      case CourseStatus.ARCHIVED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-zinc-200 text-zinc-700 border border-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            DIARKIB
          </span>
        );
    }
  };

  const getApprovalBadge = (approval: ApprovalStatus) => {
    switch (approval) {
      case ApprovalStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3 text-amber-700" />
            MENUNGGU KELULUSAN
          </span>
        );
      case ApprovalStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            DILULUSKAN
          </span>
        );
      case ApprovalStatus.CHANGES_REQUIRED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-400 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3 text-orange-700" />
            PERLU PINDAAN
          </span>
        );
      case ApprovalStatus.DRAFT:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-300 text-[10px] font-bold uppercase tracking-wider">
            DRAF
          </span>
        );
      case ApprovalStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-900 border border-red-300 text-[10px] font-bold uppercase tracking-wider">
            DITOLAK
          </span>
        );
    }
  };

  return (
    <div className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-xs flex flex-col gap-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b-2 border-zinc-900">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950">
            Pengawasan Kursus Platform ({courses.length})
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Senarai rasmi semua kursus merentasi seluruh penganjur berdaftar.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kursus, kod, slug, penganjur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border-2 border-zinc-900 font-medium focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Filter by Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Status Operasi:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-bold py-1.5 px-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value={CourseStatus.UPCOMING}>Akan Datang (Upcoming)</option>
            <option value={CourseStatus.ACTIVE}>Aktif (Active)</option>
            <option value={CourseStatus.COMPLETED}>Selesai (Completed)</option>
            <option value={CourseStatus.ARCHIVED}>Diarkib (Archived)</option>
          </select>
        </div>

        {/* Filter by Approval */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Status Kelulusan Tadbir Urus:
          </label>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="w-full text-xs font-bold py-1.5 px-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Kelulusan</option>
            <option value={ApprovalStatus.SUBMITTED}>Menunggu Kelulusan (Submitted)</option>
            <option value={ApprovalStatus.CHANGES_REQUIRED}>Perlu Pindaan</option>
            <option value={ApprovalStatus.APPROVED}>Diluluskan</option>
            <option value={ApprovalStatus.DRAFT}>Draf</option>
            <option value={ApprovalStatus.REJECTED}>Ditolak</option>
          </select>
        </div>

        {/* Filter by Organizer */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Penganjur (Pemilik):
          </label>
          <select
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
            className="w-full text-xs font-bold py-1.5 px-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Penganjur</option>
            {organizers.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      {courses.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-300 text-zinc-500 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-700">
            Tiada kursus tersedia.
          </p>
          <p className="text-xs text-zinc-500 max-w-md">
            Pangkalan data platform masih kosong. Penganjur boleh mula mendaftar kursus baharu melalui Portal Penganjur.
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-zinc-300 text-zinc-500 text-xs">
          Tiada kursus berpadanan dengan kriteria carian atau penapis anda.
        </div>
      ) : (
        <div className="border-2 border-zinc-900 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3 border-r border-zinc-700">Kursus & Kod</th>
                <th className="p-3 border-r border-zinc-700">Penganjur</th>
                <th className="p-3 border-r border-zinc-700">Tarikh & Lokasi</th>
                <th className="p-3 border-r border-zinc-700">Status Operasi</th>
                <th className="p-3 border-r border-zinc-700">Kelulusan</th>
                <th className="p-3 border-r border-zinc-700">Slug Awam</th>
                <th className="p-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {filteredCourses.map((c, idx) => {
                const org = organizers.find(o => o.id === c.organizerId);
                return (
                  <tr key={`${c.id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-3 font-semibold text-zinc-900 border-r border-zinc-200">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {c.isFeaturedActive && (
                          <span title="Featured Active" className="text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                          </span>
                        )}
                        <span className="font-bold text-zinc-950 text-xs">{c.title}</span>
                      </div>
                      {c.code && (
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-zinc-100 border border-zinc-300 text-zinc-700 font-bold">
                          {c.code}
                        </span>
                      )}
                    </td>

                    <td className="p-3 border-r border-zinc-200 text-zinc-700 font-medium">
                      {org ? (
                        <div>
                          <p className="font-bold text-zinc-900">{org.code}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{org.name}</p>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Belum Ditetapkan</span>
                      )}
                    </td>

                    <td className="p-3 border-r border-zinc-200 text-zinc-700">
                      <p className="font-mono text-[11px] font-bold text-zinc-900">
                        {formatDateRangeDMY(c.startDate, c.endDate, '→')}
                      </p>
                      <p className="text-[11px] text-zinc-600 line-clamp-1">{c.venueName}</p>
                    </td>

                    <td className="p-3 border-r border-zinc-200">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="p-3 border-r border-zinc-200">
                      {getApprovalBadge(c.approvalStatus)}
                    </td>

                    <td className="p-3 border-r border-zinc-200 font-mono text-[10px] text-blue-700">
                      <span className="hover:underline flex items-center gap-1">
                        <span>/{c.slug}</span>
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectCourse(c)}
                          title="Semak & Urus Kursus"
                          className="px-2.5 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-zinc-900"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Semak</span>
                        </button>

                        <button
                          onClick={() => onToggleFeatured(c.id)}
                          title={c.isFeaturedActive ? 'Padam dari Featured' : 'Tetapkan sebagai Featured Active'}
                          className={`p-1.5 border ${
                            c.isFeaturedActive
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-300 hover:text-zinc-900'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${c.isFeaturedActive ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Adakah anda pasti untuk memadam kursus "${c.title}" secara kekal?`)) {
                              onDeleteCourse(c.id);
                            }
                          }}
                          title="Padam Kursus Secara Kekal"
                          className="p-1.5 bg-zinc-100 text-zinc-500 hover:text-red-700 hover:bg-red-50 border border-zinc-300 hover:border-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
};
