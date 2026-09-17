import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  PlusCircle, 
  BookOpen, 
  UserCheck, 
  Layers, 
  RefreshCw, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { Organizer, UserRole } from '../../types';

interface OrganizerHeaderProps {
  currentOrganizer: Organizer | undefined;
  organizers?: Organizer[];
  allOrganizers?: Organizer[];
  onSwitchOrganizer?: (orgId: string) => void;
  onSelectOrganizer?: (orgId: string) => void;
  currentRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  onChangeRole?: (role: UserRole) => void;
  activeView?: 'dashboard' | 'create_course';
  onNavigate?: (view: 'dashboard' | 'create_course') => void;
  onOpenCreateCourse?: () => void;
  totalCoursesCount?: number;
  onLockOrganizer?: () => void;
}

export const OrganizerHeader: React.FC<OrganizerHeaderProps> = ({
  currentOrganizer,
  organizers,
  allOrganizers,
  onSwitchOrganizer,
  onSelectOrganizer,
  currentRole,
  onSwitchRole,
  onChangeRole,
  activeView = 'dashboard',
  onNavigate,
  onOpenCreateCourse,
  totalCoursesCount = 0,
  onLockOrganizer
}) => {
  const orgList = organizers || allOrganizers || [];
  const handleSelectOrg = (orgId: string) => {
    if (onSwitchOrganizer) onSwitchOrganizer(orgId);
    else if (onSelectOrganizer) onSelectOrganizer(orgId);
  };
  const handleRoleChange = (role: UserRole) => {
    if (onSwitchRole) onSwitchRole(role);
    else if (onChangeRole) onChangeRole(role);
  };
  const handleCreateCourse = () => {
    if (onOpenCreateCourse) onOpenCreateCourse();
    else if (onNavigate) onNavigate('create_course');
  };
  return (
    <header className="bg-white border-b-2 border-zinc-900 sticky top-0 z-30">
      {/* Top Banner - Role Simulation and Security Context */}
      <div className="bg-zinc-900 text-zinc-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RUANG KERJA PENGANJUR (ORGANIZER WORKSPACE)</span>
          </div>
          <span className="hidden md:inline-block text-zinc-600">|</span>
          <span className="hidden md:inline-block text-zinc-400">
            Operasi Kursus & Pendaftaran Peserta
          </span>
        </div>

        {/* Multi-Tenant Identity Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-400 font-mono">Penganjur Aktif:</span>
          <select
            value={currentOrganizer?.id || ''}
            onChange={(e) => handleSelectOrg(e.target.value)}
            className="bg-zinc-800 text-white text-xs border border-zinc-700 px-2 py-1 rounded font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-400"
            title="Tukar Identiti Penganjur untuk Ujian Pengasingan Tenant"
          >
            {orgList.length === 0 ? (
              <option value="">Tiada Penganjur Berdaftar</option>
            ) : (
              orgList.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.id})
                </option>
              ))
            )}
          </select>

          <span className="text-zinc-600">|</span>

          {/* Quick Role Switcher for testing RBAC */}
          <div className="flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            <span className="text-[10px] text-zinc-400">Peranan:</span>
            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-bold text-amber-400 focus:outline-hidden"
            >
              <option value={UserRole.ORGANIZER_ADMIN} className="bg-zinc-900 text-white">
                ORGANIZER_ADMIN
              </option>
              <option value={UserRole.MASTER_ADMIN} className="bg-zinc-900 text-white">
                MASTER_ADMIN
              </option>
              <option value={UserRole.PARTICIPANT} className="bg-zinc-900 text-white">
                PARTICIPANT (Uji Sekatan)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold text-lg border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                {currentOrganizer ? currentOrganizer.name : 'Penganjur Kursus'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 font-bold border border-blue-300">
                PENGANJUR SAH
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              Urus operasi kursus, jadual, bilik peserta, penceramah & pengumuman langsung.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-2 border-zinc-900 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] ${
                activeView === 'dashboard'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kursus Saya ({totalCoursesCount})</span>
            </button>
          )}

          <button
            onClick={handleCreateCourse}
            className="px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-2 border-zinc-900 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Cipta Kursus Baharu</span>
          </button>

          {onLockOrganizer && (
            <button
              id="btn-header-lock-organizer"
              type="button"
              onClick={onLockOrganizer}
              className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-2 border-zinc-900 bg-zinc-100 hover:bg-red-50 hover:text-red-700 hover:border-red-600 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              title="Kunci Ruang Penganjur (Perlu PIN 1234 untuk buka semula)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
