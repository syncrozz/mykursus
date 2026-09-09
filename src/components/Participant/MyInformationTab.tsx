import React, { useState } from 'react';
import { 
  Lock, 
  UserCheck, 
  ShieldAlert, 
  Building, 
  Users, 
  LogOut, 
  CheckCircle,
  Phone,
  HelpCircle,
  Sparkles,
  BedDouble,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { Course, CourseModuleKey, VerifiedParticipantData } from '../../types';
import { platformStorage } from '../../services/storage';

interface MyInformationTabProps {
  course: Course;
  verifiedData: VerifiedParticipantData | null;
  onVerified: (data: VerifiedParticipantData) => void;
  onLogout: () => void;
}

export const MyInformationTab: React.FC<MyInformationTabProps> = ({
  course,
  verifiedData,
  onVerified,
  onLogout,
}) => {
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const isAccommodationEnabled = (course.modules || []).some(
    m => m.key === CourseModuleKey.ACCOMMODATION && m.enabled
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSyncNotice(null);

    const trimmed = phoneNumberInput.trim();
    if (!trimmed) {
      setErrorMessage('Sila masukkan nombor telefon yang anda daftarkan.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await platformStorage.verifyParticipantPhoneForCourseAsync(course.id, trimmed);
      if (result) {
        onVerified(result);
        setErrorMessage(null);
        setPhoneNumberInput('');
      } else {
        setErrorMessage(
          'Nombor telefon tidak dijumpai dalam pangkalan data kursus ini. Sila semak semula nombor anda atau klik "Segerak Semula dari Cloud" di bawah jika penganjur baru sahaja mendaftarkan anda.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ralat semasa menyemak pengesahan nombor telefon.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncNotice(null);
    try {
      const res = await platformStorage.syncFromCloud();
      if (phoneNumberInput.trim()) {
        const recheck = await platformStorage.verifyParticipantPhoneForCourseAsync(course.id, phoneNumberInput.trim());
        if (recheck) {
          onVerified(recheck);
          setPhoneNumberInput('');
          return;
        }
      }
      setSyncNotice(`Penyegerakan Cloud selesai (${res.pulledParticipants} peserta dikesan). Anda boleh cuba sahkan semula.`);
    } catch (e: any) {
      setErrorMessage('Gagal menyegerak dari Cloud Firestore. Sila cuba sebentar lagi.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Privacy Notice Banner */}
      <div className="bg-amber-50/80 border-2 border-amber-600 p-4 text-xs text-amber-950 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Privasi & Perlindungan Data Peserta (Option A)
          </p>
          <p className="text-zinc-700 leading-relaxed">
            Maklumat umum kursus boleh dibaca oleh sesiapa sahaja tanpa log masuk. Maklumat peribadi seperti 
            <strong> Nombor Bilik Hotel</strong>, <strong>Rakan Sebilik</strong>, dan <strong>Kumpulan Bengkel</strong> 
            hanya didedahkan kepada peserta yang mengesahkan nombor telefon berdaftar mereka.
          </p>
        </div>
      </div>

      {!verifiedData ? (
        /* Unverified State: Enter Registered Phone Number */
        <div className="bg-white border-2 border-zinc-900 p-6 sm:p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-zinc-900 text-white mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
              Semakan Maklumat Peribadi Peserta
            </h3>
            <p className="text-xs text-zinc-600 max-w-md mx-auto">
              Sila masukkan nombor telefon yang anda gunakan semasa pendaftaran kursus untuk melihat agihan bilik, kumpulan, dan status anda.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border-2 border-red-500 text-red-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="mt-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[11px] border border-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyegerak dari Cloud Firestore...' : 'Segerak Semula Data dari Cloud'}</span>
              </button>
            </div>
          )}

          {syncNotice && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Nombor Telefon Berdaftar:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumberInput}
                  onChange={(e) => {
                    setPhoneNumberInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="cth. 019-2345671 atau +6012-3456789"
                  className="w-full px-3.5 py-3 text-sm font-mono font-bold bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Format sokongan: 0123456789, +6012-345 6789, atau 019-2345671</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Menyemak Pangkalan Data...' : 'Sahkan & Paparkan Maklumat Saya'}</span>
            </button>
          </form>

          <div className="p-3 bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 leading-relaxed text-center">
            🔒 Tiada kata laluan diperlukan. Sistem mengesahkan identiti anda secara terus berdasarkan nombor telefon yang didaftarkan oleh penganjur ({course.venueName}).
          </div>
        </div>
      ) : (
        /* Verified State: Show Only Authorized Participant Data */
        <div className="bg-white border-2 border-zinc-900 shadow-md divide-y-2 divide-zinc-900 overflow-hidden">
          {/* Header Card */}
          <div className="p-5 sm:p-6 bg-emerald-50/70 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Pengesahan Berjaya</span>
                </span>
                <span className="text-xs font-bold text-zinc-600">
                  {verifiedData.phone}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
                {verifiedData.name}
              </h3>
              <p className="text-xs text-zinc-700 font-medium">
                {verifiedData.institutionOrAgency}
                {verifiedData.designation ? ` • ${verifiedData.designation}` : ''}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="self-start sm:self-auto px-3 py-1.5 bg-white hover:bg-zinc-100 border-2 border-zinc-900 text-zinc-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              title="Log Keluar atau Semak Peserta Lain"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Tukar Peserta</span>
            </button>
          </div>

          {/* Allocation Cards */}
          <div className="p-5 sm:p-6 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Peruntukan & Maklumat Kursus Anda
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room Allocation (if accommodation enabled) */}
              {isAccommodationEnabled && (
                <div className="p-4 border-2 border-zinc-900 bg-zinc-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Nombor Bilik Penginapan
                    </span>
                    <BedDouble className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div className="text-3xl font-black text-zinc-950 font-mono my-1">
                    {verifiedData.roomNumber || 'Belum Ditetapkan'}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    {course.venueName}
                  </p>
                </div>
              )}

              {/* Roommate Allocation */}
              {isAccommodationEnabled && (
                <div className="p-4 border-2 border-zinc-900 bg-zinc-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Rakan Sebilik Anda
                    </span>
                    <Users className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div className="text-lg font-black text-zinc-950 my-1">
                    {verifiedData.roommateName || 'Tiada Rakan Sebilik Ditetapkan'}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Bilik Berkembar (Twin Sharing)
                  </p>
                </div>
              )}

              {/* Assigned Group */}
              <div className="p-4 border-2 border-zinc-900 bg-zinc-50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Kumpulan Bengkel / Aktiviti
                  </span>
                  <Users className="w-4 h-4 text-zinc-700" />
                </div>
                <div className="text-lg font-black text-zinc-950 my-1">
                  {verifiedData.assignedGroup || 'Kumpulan Am'}
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Digunakan untuk aktiviti perbincangan & pembentangan
                </p>
              </div>

              {/* Participant Status */}
              <div className="p-4 border-2 border-zinc-900 bg-zinc-50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Status Kitaran Hidup
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-emerald-800 uppercase my-1">
                  {verifiedData.enrollmentStatus || 'DISAHKAN'}
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">
                  {verifiedData.courseCompletionStatus === 'SELESAI'
                    ? 'Tahniah! Anda telah menamatkan kursus ini secara rasmi.'
                    : verifiedData.attendanceConfirmed 
                      ? 'Kehadiran rasmi telah disahkan oleh urus setia' 
                      : 'Sila sahkan kehadiran di kaunter pendaftaran'}
                </p>
              </div>
            </div>

            {/* PART 09: Participant-Specific Attendance & Course Completion Card */}
            {verifiedData.attendanceSummary && (
              <div className="border-2 border-zinc-900 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">
                      REKOD PERIBADI PESERTA
                    </span>
                    <h4 className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                      Rekod Kehadiran & Status Penamatan Kursus
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {verifiedData.courseCompletionStatus === 'SELESAI' ? (
                      <span className="px-2.5 py-1 bg-purple-100 border border-purple-400 text-purple-900 text-xs font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                        <span>TAMAT KURSUS</span>
                      </span>
                    ) : verifiedData.courseCompletionStatus === 'LAYAK TAMAT' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-mono font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>LAYAK SIJIL (≥ 80%)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-300 text-zinc-700 text-xs font-mono font-bold">
                        SEDANG BERKURSUS
                      </span>
                    )}
                  </div>
                </div>

                {/* Overall Attendance Summary Bar */}
                <div className="bg-zinc-50 border border-zinc-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-500 font-medium block">
                      Jumlah Kehadiran Anda:
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-black text-zinc-950">
                        {verifiedData.attendanceSummary.presentCount} / {verifiedData.attendanceSummary.totalContexts}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {verifiedData.attendanceSummary.level === 'DAILY' ? 'Hari Hadir' : 'Sesi Hadir'}
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-700 ml-1">
                        ({verifiedData.attendanceSummary.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-48">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>Kemajuan Kehadiran</span>
                      <span>{verifiedData.attendanceSummary.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          verifiedData.attendanceSummary.percentage >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${verifiedData.attendanceSummary.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Day-by-day / Session-by-session Breakdown */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                    Pecahan Kehadiran Terperinci:
                  </span>
                  <div className="divide-y divide-zinc-200 border border-zinc-200">
                    {verifiedData.attendanceSummary.records.map((rec, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-2 text-xs bg-white">
                        <div>
                          <div className="font-bold text-zinc-900">{rec.label}</div>
                          {rec.date && (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Tarikh: {rec.date}
                            </div>
                          )}
                        </div>

                        <div>
                          {rec.status === 'PRESENT' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold font-mono">
                              HADIR
                            </span>
                          ) : rec.status === 'EXCUSED' || rec.status === 'LATE' ? (
                            <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold font-mono">
                              PELEPASAN / LEWAT
                            </span>
                          ) : rec.status === 'ABSENT' ? (
                            <span className="px-2 py-0.5 bg-red-100 border border-red-300 text-red-900 text-[10px] font-bold font-mono">
                              TIDAK HADIR
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-500 text-[10px] font-bold font-mono">
                              BELUM DITANDA
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 italic">
                  🔒 Maklumat ini adalah terhad kepada rekod peribadi anda sahaja mengikut prinsip privasi ketat DCOREV1.
                </div>
              </div>
            )}

            {/* Special Requirements if any */}
            {verifiedData.specialRequirements && (
              <div className="p-4 border border-zinc-300 bg-amber-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                  Keperluan Khas / Diet:
                </span>
                <p className="text-xs text-zinc-800 font-medium">
                  {verifiedData.specialRequirements}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-50 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Sesi semakan ini disimpan dalam pelayar peranti anda.</span>
            <button
              onClick={onLogout}
              className="text-zinc-800 font-bold underline hover:text-zinc-950"
            >
              Padam Sesi & Log Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
