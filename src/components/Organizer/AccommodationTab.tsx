import React, { useState } from 'react';
import { 
  Home, 
  Clock, 
  Users, 
  CheckCircle2, 
  Save, 
  Hotel, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Course, Participant, CourseEnrollment } from '../../types';

interface AccommodationTabProps {
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  onUpdateCourse: (updates: Partial<Course>) => void;
  onUpdateAllocations: (enrollmentId: string, allocations: Partial<CourseEnrollment>) => void;
}

export const AccommodationTab: React.FC<AccommodationTabProps> = ({
  course,
  enrollments,
  onUpdateCourse,
  onUpdateAllocations,
}) => {
  const currentAcc = course.accommodationDetails || {
    hotelName: course.venueName || '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    notes: 'Kunci bilik boleh diambil di kaunter pendaftaran urus setia di lobi hotel.',
  };

  const [hotelName, setHotelName] = useState(currentAcc.hotelName);
  const [checkInTime, setCheckInTime] = useState(currentAcc.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(currentAcc.checkOutTime);
  const [notes, setNotes] = useState(currentAcc.notes);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick edit room inline
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [tempRoom, setTempRoom] = useState('');
  const [tempRoommate, setTempRoommate] = useState('');

  const handleSaveHotelInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCourse({
      accommodationDetails: {
        hotelName: hotelName.trim(),
        checkInTime: checkInTime.trim(),
        checkOutTime: checkOutTime.trim(),
        notes: notes.trim(),
      }
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const assignedCount = enrollments.filter(e => Boolean(e.enrollment.roomNumber)).length;
  const unassignedCount = enrollments.length - assignedCount;

  return (
    <div className="space-y-6">
      {/* Accommodation Policy Form */}
      <form onSubmit={handleSaveHotelInfo} className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
          <h3 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-zinc-800" />
            <span>Maklumat Penginapan & Waktu Daftar Masuk</span>
          </h3>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tersimpan!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Nama Hotel / Penginapan
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="cth. Tamu Hotel & Suites"
              className="w-full p-2 text-xs border-2 border-zinc-300 focus:border-zinc-900 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Waktu Daftar Masuk (Check-In)
            </label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full p-2 text-xs border border-zinc-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Waktu Daftar Keluar (Check-Out)
            </label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full p-2 text-xs border border-zinc-300 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 mb-1">
            Polisi & Arahan Penginapan (Dipaparkan kepada peserta)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Arahan penyerahan kunci, pemulangan kad akses, dsb..."
            className="w-full p-2 text-xs border border-zinc-300"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kemaskini Maklumat Hotel</span>
          </button>
        </div>
      </form>

      {/* Room Allocation Overview */}
      <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
          <div>
            <h3 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2">
              <Home className="w-4 h-4 text-zinc-800" />
              <span>Status Peruntukan Bilik Peserta</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {assignedCount} telah diperuntukkan bilik • {unassignedCount} belum diperuntukkan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300">
              {Math.round((assignedCount / (enrollments.length || 1)) * 100)}% Siap
            </span>
          </div>
        </div>

        {/* Quick Assignment Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 font-mono text-[11px] uppercase border-b border-zinc-300">
              <tr>
                <th className="p-2.5">Nama Peserta</th>
                <th className="p-2.5">Institusi</th>
                <th className="p-2.5">No. Bilik</th>
                <th className="p-2.5">Rakan Sebilik</th>
                <th className="p-2.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {(enrollments || []).map(({ participant, enrollment }) => {
                const isEditing = editingRoomId === enrollment.id;

                return (
                  <tr key={participant?.id || enrollment?.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-bold text-zinc-900">
                      {participant.name}
                    </td>
                    <td className="p-2.5 text-zinc-600">
                      {participant.institutionOrAgency}
                    </td>
                    <td className="p-2.5 font-mono">
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempRoom}
                          onChange={(e) => setTempRoom(e.target.value)}
                          placeholder="No. Bilik"
                          className="p-1 text-xs border border-zinc-400 w-24 bg-white"
                        />
                      ) : (
                        enrollment.roomNumber || <span className="text-zinc-400 italic">Belum diisi</span>
                      )}
                    </td>
                    <td className="p-2.5 text-zinc-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempRoommate}
                          onChange={(e) => setTempRoommate(e.target.value)}
                          placeholder="Nama Rakan Sebilik"
                          className="p-1 text-xs border border-zinc-400 w-44 bg-white"
                        />
                      ) : (
                        enrollment.roommateName || <span className="text-zinc-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      {isEditing ? (
                        <div className="space-x-1">
                          <button
                            onClick={() => {
                              onUpdateAllocations(enrollment.id, {
                                roomNumber: tempRoom.trim(),
                                roommateName: tempRoommate.trim(),
                              });
                              setEditingRoomId(null);
                            }}
                            className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingRoomId(null)}
                            className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[11px] rounded"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRoomId(enrollment.id);
                            setTempRoom(enrollment.roomNumber || '');
                            setTempRoommate(enrollment.roommateName || '');
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Tukar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
