import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Copy, 
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react';
import { Course, Participant, CourseEnrollment } from '../../../types';
import { 
  validateAndParseParticipantsCSV, 
  CSVImportValidationResult, 
  CSVParticipantRow 
} from '../../../utils/dataPortability';
import { formatPhoneNumber } from '../../../utils/phoneUtils';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  onCommitImport: (
    rowsToImport: Array<{
      participant: Partial<Participant>;
      enrollment: Partial<CourseEnrollment>;
    }>
  ) => void;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  course,
  enrollments,
  onCommitImport,
}) => {
  const [step, setStep] = useState<'SELECT' | 'REVIEW'>('SELECT');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<CSVImportValidationResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VALID' | 'DUPLICATE' | 'CONFLICT' | 'INVALID'>('ALL');
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [updateExistingIfMatch, setUpdateExistingIfMatch] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawText(content);
      const res = validateAndParseParticipantsCSV(content, enrollments);
      setValidationResult(res);

      // By default select all rows that are valid and not duplicate/conflict unless user chooses to update
      const initialSelected = new Set<number>();
      res.rows.forEach(r => {
        if (r.selectedForImport) {
          initialSelected.add(r.index);
        }
      });
      setSelectedRowIndices(initialSelected);
      setStep('REVIEW');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAllFiltered = (rowsToSelect: CSVParticipantRow[]) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      const allSelected = rowsToSelect.every(r => next.has(r.index));
      if (allSelected) {
        rowsToSelect.forEach(r => next.delete(r.index));
      } else {
        rowsToSelect.forEach(r => {
          if (r.isValid) next.add(r.index);
        });
      }
      return next;
    });
  };

  const handleCommit = () => {
    if (!validationResult) return;
    setIsProcessing(true);

    const rowsToCommit = validationResult.rows
      .filter(r => selectedRowIndices.has(r.index))
      .map(r => ({
        participant: {
          name: r.cleanName,
          phone: r.rawPhone,
          salaryNumber: r.salaryNumber,
          institutionOrAgency: r.institutionOrAgency,
          designation: r.designation,
          email: r.email,
          gender: r.gender,
        },
        enrollment: {
          status: r.status,
          roomNumber: r.roomNumber,
          roommateName: r.roommateName,
          assignedGroup: r.assignedGroup,
          specialRequirements: r.specialRequirements,
          secretariatNotes: r.secretariatNotes,
          salaryNumber: r.salaryNumber,
        }
      }));

    setTimeout(() => {
      onCommitImport(rowsToCommit);
      setIsProcessing(false);
      handleReset();
      onClose();
    }, 400);
  };

  const handleReset = () => {
    setStep('SELECT');
    setFileName('');
    setRawText('');
    setValidationResult(null);
    setSelectedRowIndices(new Set());
    setActiveFilter('ALL');
    setUpdateExistingIfMatch(false);
  };

  // Filter rows for display
  const displayedRows = validationResult?.rows.filter(r => {
    if (activeFilter === 'VALID') return r.isValid && !r.isInternalDuplicate && !r.isExistingDuplicate && !r.isConflict;
    if (activeFilter === 'DUPLICATE') return r.isInternalDuplicate || r.isExistingDuplicate;
    if (activeFilter === 'CONFLICT') return r.isConflict;
    if (activeFilter === 'INVALID') return !r.isValid;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Import CSV Peserta</h3>
              <p className="text-[11px] text-zinc-300">
                Kursus: <span className="font-semibold text-white">{course.title}</span> ({course.code || course.slug})
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {step === 'SELECT' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-700 space-y-2">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Aliran Kerja Import Selamat (SES v4.4):</span>
                </div>
                <p className="leading-relaxed">
                  Fail CSV akan disemak secara pra-komitmen (Pre-commit Validation). Sistem menyokong import peserta menggunakan <strong>Nombor Telefon</strong> ATAU <strong>No. Gaji / ID</strong> (sesuai untuk peserta tanpa nombor telefon peribadi), mengenal pasti duplikasi dalam fail dan kursus sedia ada, serta membolehkan semakan penuh sebelum disimpan.
                </p>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Lajur yang disokong: Nama, No Telefon, No Gaji / ID, Institusi / Agensi, Jawatan, Emel, Bilik, Kumpulan, Status.
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? 'border-emerald-600 bg-emerald-50/50' 
                    : 'border-zinc-300 hover:border-zinc-700 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Klik untuk pilih fail CSV atau seret ke sini
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Menyokong fail .csv, .tsv (Format UTF-8, pemisah koma atau tab)
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] mt-2">
                  Pilih Fail Dari Komputer
                </span>
              </div>
            </div>
          )}

          {step === 'REVIEW' && validationResult && (
            <div className="space-y-4">
              
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-zinc-100 border border-zinc-300 p-2.5">
                  <div className="text-[10px] uppercase font-mono font-bold text-zinc-600">Jumlah Baris</div>
                  <div className="text-xl font-black text-zinc-900">{validationResult.totalRows}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 p-2.5">
                  <div className="text-[10px] uppercase font-mono font-bold text-emerald-800">Sah / Bersih</div>
                  <div className="text-xl font-black text-emerald-700">{validationResult.validCount}</div>
                </div>
                <div className="bg-amber-50 border border-amber-300 p-2.5">
                  <div className="text-[10px] uppercase font-mono font-bold text-amber-800">Duplikasi</div>
                  <div className="text-xl font-black text-amber-700">{validationResult.duplicateCount}</div>
                </div>
                <div className="bg-purple-50 border border-purple-300 p-2.5">
                  <div className="text-[10px] uppercase font-mono font-bold text-purple-800">Konflik</div>
                  <div className="text-xl font-black text-purple-700">{validationResult.conflictCount}</div>
                </div>
                <div className="bg-red-50 border border-red-300 p-2.5 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-mono font-bold text-red-800">Tidak Sah</div>
                  <div className="text-xl font-black text-red-700">{validationResult.invalidCount}</div>
                </div>
              </div>

              {/* Duplicate Handling Strategy */}
              {validationResult.duplicateCount > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-zinc-800">
                      Terdapat <strong>{validationResult.duplicateCount}</strong> rekod duplikasi dikesan.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 select-none">
                    <input
                      type="checkbox"
                      checked={updateExistingIfMatch}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUpdateExistingIfMatch(checked);
                        setSelectedRowIndices(prev => {
                          const next = new Set(prev);
                          validationResult.rows.forEach(r => {
                            if (r.isExistingDuplicate && r.isValid) {
                              if (checked) next.add(r.index);
                              else next.delete(r.index);
                            }
                          });
                          return next;
                        });
                      }}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Kemas kini rekod peserta sedia ada jika no. telefon atau no. gaji sepadan</span>
                  </label>
                </div>
              )}

              {/* Filter Tabs & Bulk Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-1 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                      activeFilter === 'ALL' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    Semua ({validationResult.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('VALID')}
                    className={`px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                      activeFilter === 'VALID' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    Sah Sedia Diimport ({validationResult.validCount})
                  </button>
                  {validationResult.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('DUPLICATE')}
                      className={`px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                        activeFilter === 'DUPLICATE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      Duplikasi ({validationResult.duplicateCount})
                    </button>
                  )}
                  {validationResult.conflictCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('CONFLICT')}
                      className={`px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                        activeFilter === 'CONFLICT' ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      Konflik ({validationResult.conflictCount})
                    </button>
                  )}
                  {validationResult.invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('INVALID')}
                      className={`px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                        activeFilter === 'INVALID' ? 'bg-red-700 text-white border-red-700' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      Ralat / Tidak Sah ({validationResult.invalidCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered(displayedRows)}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                  >
                    Pilih / Nyahpilih Paparan Ini
                  </button>
                </div>
              </div>

              {/* Data Table Review */}
              <div className="border border-zinc-200 overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 sticky top-0 border-b border-zinc-200 z-10">
                    <tr>
                      <th className="p-2 w-10 text-center">Pilih</th>
                      <th className="p-2 w-12 text-center">#</th>
                      <th className="p-2">Status Semakan</th>
                      <th className="p-2">Nama Peserta</th>
                      <th className="p-2">No Telefon</th>
                      <th className="p-2">No Gaji/ID</th>
                      <th className="p-2">Institusi/Agensi</th>
                      <th className="p-2">Bilik / Kumpulan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-zinc-400">
                          Tiada rekod dalam kategori ini.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((r) => {
                        const isSelected = selectedRowIndices.has(r.index);
                        return (
                          <tr 
                            key={r.index}
                            className={`hover:bg-zinc-50 transition-colors ${
                              !r.isValid ? 'bg-red-50/40 text-zinc-600' : 
                              r.isConflict ? 'bg-purple-50/40' :
                              r.isExistingDuplicate ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!r.isValid}
                                onChange={() => toggleRowSelection(r.index)}
                                className="rounded text-emerald-600 focus:ring-0 cursor-pointer disabled:opacity-30"
                              />
                            </td>
                            <td className="p-2 text-center font-mono text-zinc-400">
                              {r.index}
                            </td>
                            <td className="p-2">
                              {!r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{r.validationErrors[0] || 'Tidak Sah'}</span>
                                </span>
                              ) : r.isConflict ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5" title={r.conflictReason}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Konflik Nama</span>
                                </span>
                              ) : r.isInternalDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5" title={r.duplicateReason}>
                                  <Copy className="w-3 h-3" />
                                  <span>Duplikasi Fail</span>
                                </span>
                              ) : r.isExistingDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5" title={r.duplicateReason}>
                                  <Copy className="w-3 h-3" />
                                  <span>Sedia Ada</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Sedia Import</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-medium text-zinc-900">
                              {r.cleanName || <span className="italic text-zinc-400">(Kosong)</span>}
                            </td>
                            <td className="p-2 font-mono text-zinc-800">
                              {formatPhoneNumber(r.rawPhone) || (
                                <span className="text-zinc-500 font-sans italic text-[11px]">
                                  {r.salaryNumber ? '(Guna No. Gaji)' : 'Tiada'}
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-zinc-800">
                              {r.salaryNumber ? (
                                <span className="font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 border border-zinc-200">
                                  {r.salaryNumber}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-zinc-700">
                              {r.institutionOrAgency}
                            </td>
                            <td className="p-2 text-zinc-600">
                              {r.roomNumber ? `Bilik ${r.roomNumber}` : ''}
                              {r.assignedGroup ? ` [${r.assignedGroup}]` : ''}
                              {!r.roomNumber && !r.assignedGroup && '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-100 border-t border-zinc-200 p-4 flex flex-wrap items-center justify-between gap-3">
          {step === 'SELECT' ? (
            <>
              <button
                type="button"
                onClick={() => { handleReset(); onClose(); }}
                className="px-4 py-2 border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
              >
                Batal
              </button>
              <div className="text-xs text-zinc-500 font-mono">
                Pilih fail CSV untuk memulakan semakan pra-import
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
              >
                Pilih Fail Lain
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">
                  Dipilih untuk import: <strong className="text-zinc-900">{selectedRowIndices.size}</strong> rekod
                </span>

                <button
                  type="button"
                  disabled={selectedRowIndices.size === 0 || isProcessing}
                  onClick={handleCommit}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sahkan & Import Peserta ({selectedRowIndices.size})</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
