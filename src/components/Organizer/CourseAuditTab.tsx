import React, { useState } from 'react';
import { 
  History, 
  Clock, 
  User, 
  Shield, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Course, AuditLog } from '../../types';

interface CourseAuditTabProps {
  course: Course;
  auditLogs: AuditLog[];
}

export const CourseAuditTab: React.FC<CourseAuditTabProps> = ({
  course,
  auditLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = (auditLogs || []).filter(log => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch = searchQuery === '' || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const distinctActions = Array.from(new Set((auditLogs || []).map(l => l.action)));

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-900" />
              <span>Log Sejarah Pindaan & Jejak Audit Operasi ({auditLogs.length})</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-200 text-zinc-800 font-bold border border-zinc-400">
              DALAMAN URUS SETIA SAHAJA
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Merekodkan setiap tindakan operasi, pindaan lokasi bilik, penerbitan slaid, dan hebahan pengumuman untuk ketelusan tadbir urus acara.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tidak dipaparkan kepada peserta</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam log operasi..."
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all ${
              actionFilter === 'ALL'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
            }`}
          >
            Semua Tindakan
          </button>

          {distinctActions.map(action => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all ${
                actionFilter === action
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 p-8 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <History className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-900 uppercase">
            Tiada Rekod Audit Ditemui
          </h4>
          <p className="text-xs text-zinc-500 mt-1">
            Sebarang perubahan jadual atau penerbitan hebahan akan direkodkan secara automatik di sini.
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-zinc-900 divide-y divide-zinc-200 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          {filteredLogs.map((log) => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-zinc-50/80 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-zinc-100 text-zinc-900 border border-zinc-300">
                      {log.action}
                    </span>

                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}, {timeStr}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                      Peranan: {log.userRole}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-800 font-medium leading-relaxed">
                    {log.details}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-zinc-400 shrink-0">
                  ID: {log.id}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
