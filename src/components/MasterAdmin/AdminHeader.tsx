import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  BookOpen, 
  Layers, 
  GitPullRequest, 
  History, 
  Database,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../../types';

interface AdminHeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeView: 'dashboard' | 'courses' | 'organizers' | 'changes' | 'audit';
  onNavigate: (view: 'dashboard' | 'courses' | 'organizers' | 'changes' | 'audit') => void;
  onLock: () => void;
  onLoadPilot: () => void;
  onClearAll: () => void;
  pendingCount: number;
  changesCount: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onNavigate,
  onLock,
  onLoadPilot,
  onClearAll,
  pendingCount,
  changesCount,
}) => {
  return (
    <div className="bg-zinc-900 text-white border-2 border-zinc-900 p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
      {/* Top row: Platform Branding, Role Switcher for Security Testing & Lock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            MA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
                Platform Governance
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 text-zinc-300 uppercase tracking-widest">
                DCOREV1
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Master Admin Control Center
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Security Testing Simulator: Role Selector */}
          <div className="flex items-center gap-2 bg-zinc-800 p-1 border border-zinc-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1.5">
              Simulasi Peranan:
            </span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-zinc-900 text-xs text-white font-bold py-1 px-2 border border-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value={UserRole.MASTER_ADMIN}>MASTER ADMIN (Authorized)</option>
              <option value={UserRole.ORGANIZER_ADMIN}>ORGANIZER ADMIN (Unauthorized)</option>
              <option value={UserRole.PARTICIPANT}>PARTICIPANT (Unauthorized)</option>
            </select>
          </div>

          {/* Quick Database Test Utilities */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onLoadPilot}
              title="Muatkan Data Penanda Aras Pilot KIAR 2026"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>Muat Pilot KIAR</span>
            </button>
            <button
              onClick={onClearAll}
              title="Kosongkan Semua Data untuk Ujian Keadaan Kosong"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-red-950/60 border border-zinc-700 hover:border-red-700 text-zinc-300 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Kosongkan DB</span>
            </button>
            <button
              onClick={onLock}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Kunci</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Security Warning Banner if non-Master Admin */}
      {currentRole !== UserRole.MASTER_ADMIN && (
        <div className="bg-amber-950/70 border border-amber-600 p-3 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>PERHATIAN KESELAMATAN:</strong> Anda sedang meninjau sebagai <strong>{currentRole}</strong>. Mengikut DCOREV1, sebarang tindakan Master Admin akan ditolak secara automatik!
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-2 ${
            activeView === 'dashboard'
              ? 'bg-white text-zinc-900 border-white'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Papan Pemuka (Overview)</span>
        </button>

        <button
          onClick={() => onNavigate('courses')}
          className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-2 relative ${
            activeView === 'courses'
              ? 'bg-white text-zinc-900 border-white'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Pengawasan Kursus</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-zinc-950 font-black text-[9px] rounded-xs">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('organizers')}
          className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-2 ${
            activeView === 'organizers'
              ? 'bg-white text-zinc-900 border-white'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengurusan Penganjur</span>
        </button>

        <button
          onClick={() => onNavigate('changes')}
          className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-2 relative ${
            activeView === 'changes'
              ? 'bg-white text-zinc-900 border-white'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Permohonan Pindaan</span>
          {changesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-500 text-white font-black text-[9px] rounded-xs">
              {changesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('audit')}
          className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-2 ${
            activeView === 'audit'
              ? 'bg-white text-zinc-900 border-white'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Log Audit Tadbir Urus</span>
        </button>
      </div>
    </div>
  );
};
