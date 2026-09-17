import React from 'react';
import { History, ShieldCheck, FileText, User } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDateTimeDMY } from '../../utils/dateFormatter';

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  return (
    <div className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-xs flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-zinc-900">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950">
            Log Audit Tadbir Urus Platform ({logs.length})
          </h3>
        </div>
        <p className="text-xs text-zinc-500 font-medium mt-0.5">
          Jejak rekod telus bagi semua kelulusan, perubahan status, dan tindakan kuasa Master Admin.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-200 text-zinc-500 text-xs">
          Tiada rekod audit tadbir urus pada masa ini.
        </div>
      ) : (
        <div className="border-2 border-zinc-900 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3 border-r border-zinc-700">Masa (Timestamp)</th>
                <th className="p-3 border-r border-zinc-700">Tindakan (Action)</th>
                <th className="p-3 border-r border-zinc-700">Kursus Terlibat</th>
                <th className="p-3 border-r border-zinc-700">Butiran Tindakan</th>
                <th className="p-3 text-right">Peranan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50">
                  <td className="p-3 text-zinc-500 border-r border-zinc-200 text-[11px] whitespace-nowrap">
                    {formatDateTimeDMY(log.timestamp)}
                  </td>
                  <td className="p-3 border-r border-zinc-200">
                    <span className="font-bold text-zinc-900 px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 border-r border-zinc-200 text-zinc-900 font-sans font-medium text-xs">
                    {log.courseTitle || <span className="text-zinc-400 font-mono italic">Platform</span>}
                  </td>
                  <td className="p-3 border-r border-zinc-200 text-zinc-700 font-sans text-xs">
                    {log.details}
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 uppercase">
                      {log.performedByRole}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
