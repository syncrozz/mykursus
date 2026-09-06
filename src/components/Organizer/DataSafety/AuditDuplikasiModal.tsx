import React, { useMemo } from 'react';
import { 
  X, 
  CopyCheck, 
  AlertTriangle, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  Mail, 
  User, 
  Edit, 
  Trash2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Course, Participant, CourseEnrollment } from '../../../types';
import { auditCourseDuplicates, DuplicateCluster } from '../../../utils/dataPortability';
import { formatPhoneNumber } from '../../../utils/phoneUtils';

interface AuditDuplikasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  onEditParticipant: (item: { participant: Participant; enrollment: CourseEnrollment }) => void;
  onDeleteParticipant: (participantId: string) => void;
}

export const AuditDuplikasiModal: React.FC<AuditDuplikasiModalProps> = ({
  isOpen,
  onClose,
  course,
  enrollments,
  onEditParticipant,
  onDeleteParticipant,
}) => {
  const auditResult = useMemo(() => {
    return auditCourseDuplicates(enrollments);
  }, [enrollments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CopyCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Audit Duplikasi Peserta</h3>
              <p className="text-[11px] text-zinc-300">
                Pengesanan Pintar Tanpa-Musnah (Non-Destructive Duplicate Detection)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Informational Guidance Banner */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Dasar Integriti Data (SES v4.4):</p>
              <p className="leading-relaxed text-blue-800">
                Audit ini bersifat <strong>semakan dan pengesanan sahaja</strong>. Sistem tidak akan sesekali memadam, menggabungkan, atau mengubah suai rekod sedia ada secara automatik. Urus setia mengekalkan kuasa mutlak ke atas data.
              </p>
            </div>
          </div>

          {/* Audit Metrics Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-100 border border-zinc-300 p-3 text-center">
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-600">Peserta Disemak</div>
              <div className="text-2xl font-black text-zinc-900 mt-0.5">{auditResult.totalParticipants}</div>
            </div>
            <div className={`border p-3 text-center ${
              auditResult.totalClusters > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-600">Kelompok Pertindihan</div>
              <div className={`text-2xl font-black mt-0.5 ${
                auditResult.totalClusters > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                {auditResult.totalClusters}
              </div>
            </div>
            <div className={`border p-3 text-center ${
              auditResult.totalDuplicateRecords > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-600">Rekod Terlibat</div>
              <div className={`text-2xl font-black mt-0.5 ${
                auditResult.totalDuplicateRecords > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                {auditResult.totalDuplicateRecords}
              </div>
            </div>
          </div>

          {/* Audit Results List */}
          {auditResult.clusters.length === 0 ? (
            <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-900">
                Tiada Rekod Duplikasi Dikesan
              </h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Semua rekod pendaftaran peserta kursus ini adalah unik berdasarkan nombor telefon, nombor gaji/ID, dan alamat emel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
                Senarai Kelompok Pertindihan Yang Dikesan ({auditResult.clusters.length})
              </h4>

              {auditResult.clusters.map((cluster, idx) => (
                <div 
                  key={cluster.id} 
                  className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3"
                >
                  {/* Cluster Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-zinc-900">
                        {cluster.matchLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${
                        cluster.confidence === 'TINGGI' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        Keyakinan: {cluster.confidence}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-500">
                      {cluster.participants.length} rekod berpadanan
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600">
                    {cluster.reason}
                  </p>

                  {/* Participants Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {cluster.participants.map(({ participant, enrollment }) => (
                      <div 
                        key={participant.id}
                        className="bg-zinc-50 border border-zinc-300 p-3 text-xs space-y-2 relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-zinc-900 text-sm">
                              {participant.name}
                            </div>
                            <div className="text-[11px] text-zinc-600 font-medium">
                              {participant.institutionOrAgency}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 font-mono text-[10px] font-bold uppercase">
                            {enrollment.status}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px] text-zinc-700 pt-1 border-t border-zinc-200">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>Telefon: <strong>{formatPhoneNumber(participant.phone)}</strong></span>
                          </div>
                          {participant.salaryNumber && (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-zinc-400" />
                              <span>No Gaji: <strong>{participant.salaryNumber}</strong></span>
                            </div>
                          )}
                          {participant.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-zinc-400" />
                              <span className="truncate">Emel: {participant.email}</span>
                            </div>
                          )}
                          {enrollment.roomNumber && (
                            <div className="text-zinc-600 font-sans">
                              Bilik: {enrollment.roomNumber} {enrollment.roommateName ? `(Rakan: ${enrollment.roommateName})` : ''}
                            </div>
                          )}
                        </div>

                        {/* Individual Manual Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-200">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditParticipant({ participant, enrollment });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Peserta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Adakah anda pasti ingin memadam rekod "${participant.name}" dari kursus ini? Tindakan ini tidak boleh diundur.`)) {
                                onDeleteParticipant(participant.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Padam Rekod</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-100 border-t border-zinc-200 p-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-mono">
            Audit dijalankan: {new Date().toLocaleDateString('ms-MY')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
          >
            Tutup Audit
          </button>
        </div>

      </div>
    </div>
  );
};
