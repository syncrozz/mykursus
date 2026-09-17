import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, RefreshCw, KeyRound } from 'lucide-react';
import { UserRole } from '../../types';

interface AccessDeniedNoticeProps {
  reason: string;
  onBackToDashboard?: () => void;
  onSwitchToAuthorizedRole?: (role: UserRole) => void;
}

export const AccessDeniedNotice: React.FC<AccessDeniedNoticeProps> = ({
  reason,
  onBackToDashboard,
  onSwitchToAuthorizedRole,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 bg-white border-2 border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-100 text-red-700 border-2 border-red-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-black uppercase px-2 py-0.5 bg-red-600 text-white">
              SEKATAN KESELAMATAN
            </span>
            <span className="text-xs text-zinc-500 font-mono">RBAC • ISOLATION</span>
          </div>
          <h2 className="text-xl font-black text-zinc-900 mb-2">
            Akses Ditolak (Access Denied)
          </h2>
          <p className="text-sm text-zinc-700 leading-relaxed mb-4">
            {reason}
          </p>

          <div className="bg-zinc-50 border border-zinc-200 p-3 mb-6 text-xs text-zinc-600 font-mono">
            <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-700" />
              Prinsip Kawalan Akses & Pengasingan:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>Penganjur A tidak boleh melihat atau mengedit kursus Penganjur B.</li>
              <li>Peserta awam tidak dibenarkan mengakses pengurusan operasi kursus.</li>
              <li>Kebenaran diperiksa pada aras fungsi data storan, bukan sekadar menyembunyikan butang UI.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold border-2 border-zinc-900 hover:bg-zinc-800 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Senarai Kursus Saya</span>
              </button>
            )}

            {onSwitchToAuthorizedRole && (
              <button
                onClick={() => onSwitchToAuthorizedRole(UserRole.MASTER_ADMIN)}
                className="px-4 py-2 bg-amber-100 text-amber-900 border-2 border-amber-500 text-xs font-bold hover:bg-amber-200 flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Simulasi Master Admin (Akses Penuh Platform)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
