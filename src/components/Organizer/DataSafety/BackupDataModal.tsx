import React, { useState, useRef } from 'react';
import { 
  X, 
  HardDrive, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  ShieldAlert, 
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { Course, Participant, CourseEnrollment } from '../../../types';
import { createCourseBackup, validateBackupFile, BackupValidationResult } from '../../../utils/dataPortability';

interface BackupDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  onRestoreBackup: (payload: any) => void;
}

export const BackupDataModal: React.FC<BackupDataModalProps> = ({
  isOpen,
  onClose,
  course,
  enrollments,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE'>('BACKUP');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    createCourseBackup(course, enrollments);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setRestoreFile(file);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = validateBackupFile(content);
      setValidationResult(res);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!validationResult?.payload) return;
    setIsRestoring(true);

    setTimeout(() => {
      onRestoreBackup(validationResult.payload);
      setIsRestoring(false);
      setRestoreSuccess(true);
    }, 500);
  };

  const handleReset = () => {
    setRestoreFile(null);
    setValidationResult(null);
    setRestoreSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Backup Data</h3>
              <p className="text-[11px] text-zinc-300">
                Pengurusan Sandaran Luar Talian & Pemulihan Berdisiplin (SES v4.4)
              </p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-100 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('BACKUP'); handleReset(); }}
            className={`flex-1 py-3 px-4 font-bold text-center border-r border-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'BACKUP'
                ? 'bg-white text-zinc-900 border-b-2 border-b-blue-600'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Cipta Sandaran Data</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('RESTORE'); handleReset(); }}
            className={`flex-1 py-3 px-4 font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'RESTORE'
                ? 'bg-white text-zinc-900 border-b-2 border-b-blue-600'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Pulihkan Data dari Sandaran</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {activeTab === 'BACKUP' && (
            <div className="space-y-4 text-xs">
              <div className="bg-zinc-50 border border-zinc-200 p-4 space-y-2">
                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-zinc-700" />
                  <span>Sandaran Penuh Kursus Semasa</span>
                </h4>
                <p className="text-zinc-600 leading-relaxed">
                  Fail sandaran mengandungi salinan rasmi data pendaftaran, peruntukan bilik & rakan sebilik, nombor gaji, serta kumpulan peserta kursus ini. Fail disimpan dalam format selamat untuk pemindahan atau pemulihan sekiranya diperlukan.
                </p>
                <div className="pt-2 border-t border-zinc-200 text-[11px] font-mono text-zinc-500 space-y-1">
                  <div>Kursus: <strong>{course.title}</strong> ({course.code || course.slug})</div>
                  <div>Jumlah Peserta Terkini: <strong>{enrollments.length} Orang</strong></div>
                  <div>Integriti: Sijil digital SYNCROZZ v4.4</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Muat Turun Sandaran Data Sekarang</span>
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] leading-relaxed">
                <strong>Nota Keselamatan:</strong> Simpan fail sandaran ini di tempat yang selamat. Data tidak mengandungi maklumat sulit peribadi yang tidak berkaitan dengan pengurusan kursus.
              </div>
            </div>
          )}

          {activeTab === 'RESTORE' && (
            <div className="space-y-4 text-xs">
              
              {/* Critical SES 4.4 Rule Reminder */}
              <div className="bg-amber-50 border border-amber-300 p-3.5 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Prinsip Pemulihan SES v4.4:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Sistem <strong>tidak akan sesekali memulihkan data secara automatik</strong>. Pemulihan memerlukan tindakan dan persetujuan eksplisit daripada urus setia.
                  </p>
                </div>
              </div>

              {restoreSuccess ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Pemulihan Data Berjaya
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Data pendaftaran dan peruntukan peserta telah berjaya dipulihkan ke dalam kursus ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => { handleReset(); onClose(); }}
                    className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              ) : !restoreFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 hover:border-zinc-700 p-8 text-center cursor-pointer bg-zinc-50 hover:bg-zinc-100 flex flex-col items-center justify-center gap-2.5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      Pilih fail sandaran (.json) untuk disemak
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Hanya fail sandaran sah daripada platform SYNCROZZ disokong
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold mt-1">
                    Pilih Fail Sandaran
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {validationResult?.isValid && validationResult.summary ? (
                    <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                        <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Fail Sandaran Sah</span>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {restoreFile.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-zinc-50 p-2 border border-zinc-200">
                          <span className="text-zinc-500 text-[10px] block">Kursus Asal:</span>
                          <strong className="text-zinc-900">{validationResult.summary.courseTitle}</strong>
                        </div>
                        <div className="bg-zinc-50 p-2 border border-zinc-200">
                          <span className="text-zinc-500 text-[10px] block">Tarikh Sandaran:</span>
                          <strong className="text-zinc-900">
                            {new Date(validationResult.summary.createdAt).toLocaleString('ms-MY')}
                          </strong>
                        </div>
                        <div className="bg-zinc-50 p-2 border border-zinc-200">
                          <span className="text-zinc-500 text-[10px] block">Bilangan Peserta:</span>
                          <strong className="text-zinc-900">{validationResult.summary.participantCount} Orang</strong>
                        </div>
                        <div className="bg-zinc-50 p-2 border border-zinc-200">
                          <span className="text-zinc-500 text-[10px] block">Bilangan Pendaftaran:</span>
                          <strong className="text-zinc-900">{validationResult.summary.enrollmentCount} Rekod</strong>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={handleConfirmRestore}
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isRestoring ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Memulihkan Data...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Sahkan & Pulihkan Data Sekarang</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="py-2.5 px-3 border border-zinc-300 bg-white text-zinc-700 font-bold hover:bg-zinc-50 cursor-pointer"
                        >
                          Pilih Fail Lain
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-300 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Fail Sandaran Tidak Sah</span>
                      </div>
                      <ul className="list-disc list-inside text-red-700 text-[11px] space-y-1">
                        {validationResult?.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="mt-2 px-3 py-1.5 bg-white border border-zinc-300 text-zinc-800 font-bold text-xs hover:bg-zinc-50 cursor-pointer"
                      >
                        Cuba Fail Lain
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-100 border-t border-zinc-200 p-4 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            SYNCROZZ Data Safety Standard
          </div>
          <button
            type="button"
            onClick={() => { handleReset(); onClose(); }}
            className="px-4 py-2 border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
