import React, { useState } from 'react';
import { 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  MapPin, 
  UserCheck 
} from 'lucide-react';
import { ApprovalChangeRequest, UserRole } from '../../types';

interface ChangeRequestsReviewProps {
  changeRequests: ApprovalChangeRequest[];
  currentRole: UserRole;
  onReviewChangeRequest: (crId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
}

export const ChangeRequestsReview: React.FC<ChangeRequestsReviewProps> = ({
  changeRequests,
  currentRole,
  onReviewChangeRequest,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const filtered = changeRequests.filter(cr => {
    if (filter === 'ALL') return true;
    return cr.status === filter;
  });

  const checkAuth = (): boolean => {
    if (currentRole !== UserRole.MASTER_ADMIN) {
      alert(`AKSES DITOLAK: Peranan "${currentRole}" tidak dibenarkan meluluskan pindaan platform!`);
      return false;
    }
    return true;
  };

  const handleApprove = (cr: ApprovalChangeRequest) => {
    if (!checkAuth()) return;
    if (window.confirm(`Luluskan pindaan medan ${cr.targetField} untuk kursus "${cr.courseTitle}"? Rekod rasmi kursus akan dikemaskini serta-merta.`)) {
      onReviewChangeRequest(cr.id, 'APPROVED', 'Diluluskan oleh Master Admin.');
    }
  };

  const handleReject = (cr: ApprovalChangeRequest) => {
    if (!checkAuth()) return;
    const comment = prompt('Sila masukkan sebab penolakan pindaan ini:');
    if (comment !== null) {
      onReviewChangeRequest(cr.id, 'REJECTED', comment || 'Ditolak oleh Master Admin.');
    }
  };

  return (
    <div className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-xs flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b-2 border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950">
              Permohonan Pindaan Berisiko Tinggi ({changeRequests.length})
            </h3>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Sistem semakan perbezaan (Side-by-Side Diff) untuk tarikh dan lokasi rasmi mengikut DCOREV1.
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-zinc-100 p-1 border border-zinc-300">
          {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === st
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {st === 'PENDING' ? 'Menunggu (Pending)' : st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Governance Explanatory Banner */}
      <div className="p-3.5 bg-blue-50/60 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <strong>PRINSIP KELULUSAN DCOREV1:</strong> Penganjur boleh menerbitkan hebahan, pautan slaid, dan kemas kini langsung secara serta-merta tanpa kelulusan. Walau bagaimanapun, <strong>Tarikh Rasmi</strong>, <strong>Lokasi Rasmi</strong>, dan <strong>Penerbitan Kursus</strong> memerlukan kelulusan Master Admin sebelum terpakai pada rekod awam.
          </p>
          <p className="text-blue-800 text-[11px]">
            Maklumat diterbitkan semasa kekal berkuat kuasa sehingga permohonan diluluskan oleh Master Admin.
          </p>
        </div>
      </div>

      {/* Change Requests List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
          {filter === 'PENDING' 
            ? 'Tiada permohonan pindaan menunggu kelulusan pada masa ini.' 
            : 'Tiada rekod pindaan berpadanan.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cr) => (
            <div 
              key={cr.id}
              className={`border-2 border-zinc-900 p-4 sm:p-5 flex flex-col gap-4 shadow-xs ${
                cr.status === 'PENDING' ? 'bg-amber-50/20' : 'bg-white'
              }`}
            >
              {/* Card Title & Meta */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-zinc-950 uppercase">
                      {cr.courseTitle}
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-zinc-900 text-white uppercase">
                      Medan: {cr.targetField}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Dimohon oleh: <strong>{cr.requestedByOrganizerName}</strong> pada {new Date(cr.submittedAt).toLocaleDateString('ms-MY')}
                  </p>
                </div>

                <div>
                  {cr.status === 'PENDING' && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase border border-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Menunggu Kelulusan</span>
                    </span>
                  )}
                  {cr.status === 'APPROVED' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase border border-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Diluluskan & Dikemaskini</span>
                    </span>
                  )}
                  {cr.status === 'REJECTED' && (
                    <span className="px-2.5 py-1 bg-red-100 text-red-900 text-[10px] font-bold uppercase border border-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-700" />
                      <span>Ditolak</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Diff Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {/* Current Published Value */}
                <div className="p-3.5 bg-zinc-100 border border-zinc-300 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      Nilai Semasa (Diterbitkan & Aktif):
                    </span>
                    <p className="font-bold text-zinc-900 text-sm">{cr.currentValue}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 block">
                    Kekal dipaparkan kepada peserta sehingga kelulusan
                  </span>
                </div>

                {/* Proposed Value */}
                <div className="p-3.5 bg-blue-50 border-2 border-blue-400 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      Cadangan Pindaan Penganjur:
                    </span>
                    <p className="font-bold text-blue-950 text-sm">{cr.proposedValue}</p>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold mt-2 block">
                    Akan menggantikan data rasmi jika diluluskan
                  </span>
                </div>
              </div>

              {/* Justification & Comments */}
              <div className="text-xs text-zinc-700 bg-zinc-50 p-3 border border-zinc-200">
                <p>
                  <strong className="text-zinc-900">Sebab Pindaan Penganjur:</strong> {cr.reason}
                </p>
                {cr.reviewComment && (
                  <p className="mt-1 pt-1 border-t border-zinc-200 text-zinc-600">
                    <strong className="text-zinc-900">Ulasan Pentadbir:</strong> {cr.reviewComment}
                  </p>
                )}
              </div>

              {/* Action Controls */}
              {cr.status === 'PENDING' && (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleReject(cr)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>Tolak Pindaan</span>
                  </button>

                  <button
                    onClick={() => handleApprove(cr)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Luluskan & Kemaskini Rekod</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
