import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { Course, ScheduleDay, SessionItem } from '../../types';
import { 
  validateAndParseSessionsCSV, 
  CSVSlotValidationResult, 
  CSVSlotRow,
  downloadSessionCsvTemplate 
} from '../../utils/scheduleCsvPortability';

interface ImportSessionCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  scheduleDays: ScheduleDay[];
  sessions: SessionItem[];
  defaultDayNumber: number;
  onCommitImport: (
    sessionsToImport: SessionItem[], 
    newDaysToCreate: ScheduleDay[],
    replaceExistingDays: number[]
  ) => void;
}

export const ImportSessionCSVModal: React.FC<ImportSessionCSVModalProps> = ({
  isOpen,
  onClose,
  course,
  scheduleDays,
  sessions,
  defaultDayNumber,
  onCommitImport,
}) => {
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [validationResult, setValidationResult] = useState<CSVSlotValidationResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  
  // Options
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [autoCreateDays, setAutoCreateDays] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'INVALID'>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processContent = (content: string, name: string) => {
    setFileName(name);
    setRawText(content);
    const result = validateAndParseSessionsCSV(
      content, 
      course, 
      scheduleDays, 
      sessions, 
      defaultDayNumber
    );
    setValidationResult(result);

    // Select all valid and warning rows by default (skip only invalid)
    const initialSelected = new Set<number>();
    result.rows.forEach(r => {
      if (r.status !== 'INVALID') {
        initialSelected.add(r.index);
      }
    });
    setSelectedIndices(initialSelected);
    setStep('REVIEW');
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processContent(content, file.name);
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

  const handleManualPasteSubmit = () => {
    if (!rawText.trim()) return;
    processContent(rawText, 'Data_Tampal_Manual.csv');
  };

  const toggleSelectRow = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (!validationResult) return;
    const eligibleRows = validationResult.rows.filter(r => r.status !== 'INVALID');
    if (selectedIndices.size === eligibleRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(eligibleRows.map(r => r.index)));
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult) return;

    const rowsToProcess = validationResult.rows.filter(r => selectedIndices.has(r.index));
    if (rowsToProcess.length === 0) {
      alert('Sila pilih sekurang-kurangnya satu baris slot untuk diimport.');
      return;
    }

    // 1. Determine days that need creation
    const newDaysToCreate: ScheduleDay[] = [];
    const existingDayNumbers = new Set<number>(scheduleDays.map(d => d.dayNumber));
    const daysInImport = new Set<number>(rowsToProcess.map(r => r.dayNumber));

    if (autoCreateDays) {
      daysInImport.forEach((dNum: number) => {
        if (!existingDayNumbers.has(dNum)) {
          // Calculate estimated date from course start date + offset
          let estimatedDate = course.startDate || '2026-09-09';
          try {
            const start = new Date(course.startDate);
            if (!isNaN(start.getTime())) {
              start.setDate(start.getDate() + (Number(dNum) - 1));
              estimatedDate = start.toISOString().split('T')[0];
            }
          } catch (e) {
            // fallback
          }

          // Check if detected days has specific date
          const detected = validationResult.detectedDays.find(d => d.dayNumber === dNum);
          if (detected?.date) {
            estimatedDate = detected.date;
          }

          newDaysToCreate.push({
            id: `day-imported-${Date.now()}-${dNum}`,
            courseId: course.id,
            dayNumber: Number(dNum),
            date: estimatedDate,
            theme: `Hari ${dNum}`,
          });
        }
      });
    }

    // 2. Build final SessionItem objects
    const sessionsToImport: SessionItem[] = rowsToProcess.map((r, i) => ({
      id: `sess-import-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      courseId: course.id,
      dayNumber: r.dayNumber,
      sessionNumber: r.sessionNumber || (i + 1),
      startTime: r.startTime,
      endTime: r.endTime,
      title: r.title,
      description: r.description,
      facilitatorName: r.facilitatorName,
      location: r.location || (course.venueDetails?.hallName || ''),
      isBreakOrMeal: r.isBreakOrMeal,
      presentationUrl: r.presentationUrl,
      materialsNote: r.materialsNote,
      updatedAt: new Date().toISOString(),
    }));

    // 3. Affected days if replace mode
    const replaceDays = importMode === 'REPLACE' ? Array.from(daysInImport) : [];

    onCommitImport(sessionsToImport, newDaysToCreate, replaceDays);
    onClose();
  };

  const filteredRows = validationResult?.rows.filter(r => {
    if (filterTab === 'VALID') return r.status === 'VALID';
    if (filterTab === 'WARNING') return r.status === 'WARNING';
    if (filterTab === 'INVALID') return r.status === 'INVALID';
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-white border-2 border-zinc-900 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Import Slot & Jadual Kursus (CSV)</h3>
              <p className="text-[11px] text-zinc-400">
                Muat naik atau tampal data slot mengikut format standard model jadual MyKursus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'UPLOAD' ? (
            <div className="space-y-5">
              {/* Template Download Prompt */}
              <div className="p-3.5 bg-blue-50 border-2 border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Belum mempunyai fail CSV? Muat turun templat rasmi berserta contoh data slot lengkap.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSessionCsvTemplate(course, scheduleDays)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Turun Templat CSV</span>
                </button>
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
                    : 'border-zinc-300 hover:border-zinc-800 bg-zinc-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">
                  Pilih atau seret fail CSV slot ke sini
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4">
                  Menyokong fail .csv dengan pengekodan UTF-8 (Excel, Google Sheets, LibreOffice).
                </p>
                <span className="inline-block px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800">
                  Layari Fail CSV
                </span>
              </div>

              {/* Toggle manual paste */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="text-xs font-bold text-zinc-700 hover:text-zinc-900 underline flex items-center gap-1"
                >
                  <span>{showPasteArea ? 'Sembunyikan Ruang Tampal' : '+ Atau Tampal Teks CSV / Spreadsheet Secara Terus'}</span>
                </button>

                {showPasteArea && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Hari,Tarikh,No. Sesi,Masa Mula,Masa Tamat,Tajuk Sesi,Penceramah,Lokasi,Jenis Sesi&#10;Hari 1,2026-09-09,1,08:30,10:30,Taklimat Pengenalan,Prof. Madya Dr. Norhafizah,Ballroom Tamu,Sesi&#10;Hari 1,2026-09-09,2,10:30,11:00,Minum Pagi,,Kafe Tamu,Rehat"
                      rows={6}
                      className="w-full text-xs font-mono p-3 border-2 border-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleManualPasteSubmit}
                        disabled={!rawText.trim()}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>Semak & Analisis Teks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Review & Validation */
            <div className="space-y-5">
              {/* Validation Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase">Jumlah Slot Dikesan</div>
                  <div className="text-xl font-mono font-bold text-zinc-900">{validationResult?.totalRows || 0}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Slot Sah (Valid)</div>
                  <div className="text-xl font-mono font-bold text-emerald-700">{validationResult?.validCount || 0}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Amaran (Warning)</div>
                  <div className="text-xl font-mono font-bold text-amber-700">{validationResult?.warningCount || 0}</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200">
                  <div className="text-[11px] font-bold text-red-700 uppercase">Ralat (Invalid)</div>
                  <div className="text-xl font-mono font-bold text-red-700">{validationResult?.invalidCount || 0}</div>
                </div>
              </div>

              {/* Detected Days Info */}
              {validationResult?.detectedDays && validationResult.detectedDays.length > 0 && (
                <div className="p-3 bg-zinc-100 border border-zinc-300 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-700 shrink-0" />
                    <span className="font-bold text-zinc-900">Pecahan Hari Dalam CSV:</span>
                    <span className="text-zinc-700">
                      {validationResult.detectedDays.map(d => `Hari ${d.dayNumber} (${d.sessionCount} slot)`).join(' • ')}
                    </span>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoCreateDays}
                      onChange={(e) => setAutoCreateDays(e.target.checked)}
                      className="accent-zinc-900"
                    />
                    <span className="text-zinc-800 font-medium">
                      Cipta Hari secara automatik jika belum wujud
                    </span>
                  </label>
                </div>
              )}

              {/* Import Mode Radio */}
              <div className="p-3.5 bg-white border-2 border-zinc-900 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-bold text-zinc-900 uppercase">Kaedah Import:</span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="APPEND"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      className="accent-zinc-900"
                    />
                    <span className="font-medium text-zinc-800">
                      Tambah ke dalam jadual sedia ada (Append)
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="REPLACE"
                      checked={importMode === 'REPLACE'}
                      onChange={() => setImportMode('REPLACE')}
                      className="accent-zinc-900"
                    />
                    <span className="font-medium text-red-700 font-bold">
                      Gantikan slot pada hari terlibat (Replace)
                    </span>
                  </label>
                </div>
              </div>

              {/* Filter Tabs & Selection Control */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterTab('ALL')}
                    className={`px-2.5 py-1 text-xs font-bold ${
                      filterTab === 'ALL' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    Semua ({validationResult?.totalRows || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('VALID')}
                    className={`px-2.5 py-1 text-xs font-bold ${
                      filterTab === 'VALID' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Sah ({validationResult?.validCount || 0})
                  </button>
                  {validationResult?.warningCount! > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('WARNING')}
                      className={`px-2.5 py-1 text-xs font-bold ${
                        filterTab === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Amaran ({validationResult?.warningCount || 0})
                    </button>
                  )}
                  {validationResult?.invalidCount! > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('INVALID')}
                      className={`px-2.5 py-1 text-xs font-bold ${
                        filterTab === 'INVALID' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'
                      }`}
                    >
                      Ralat ({validationResult?.invalidCount || 0})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    {selectedIndices.size > 0 ? 'Nyahpilih Semua' : 'Pilih Semua Slot Sah'}
                  </button>
                  <span className="text-xs text-zinc-500 font-mono">
                    ({selectedIndices.size} dipilih)
                  </span>
                </div>
              </div>

              {/* Rows Table */}
              <div className="border border-zinc-200 overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 border-b border-zinc-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Pilih</th>
                      <th className="p-2.5 font-bold text-zinc-700">Hari</th>
                      <th className="p-2.5 font-bold text-zinc-700">Waktu</th>
                      <th className="p-2.5 font-bold text-zinc-700">Tajuk Sesi</th>
                      <th className="p-2.5 font-bold text-zinc-700">Fasilitator / Penceramah</th>
                      <th className="p-2.5 font-bold text-zinc-700">Lokasi</th>
                      <th className="p-2.5 font-bold text-zinc-700">Jenis</th>
                      <th className="p-2.5 font-bold text-zinc-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white font-sans">
                    {filteredRows.map((row) => {
                      const isSelected = selectedIndices.has(row.index);
                      const isInvalid = row.status === 'INVALID';

                      return (
                        <tr 
                          key={row.index} 
                          className={`hover:bg-zinc-50 transition-colors ${
                            isInvalid ? 'bg-red-50/50' : isSelected ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isInvalid}
                              onChange={() => toggleSelectRow(row.index)}
                              className="accent-zinc-900"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            Hari {row.dayNumber}
                          </td>
                          <td className="p-2.5 font-mono whitespace-nowrap">
                            <span className="font-semibold text-zinc-800">{row.startTime}</span>
                            <span className="text-zinc-400 mx-1">-</span>
                            <span className="font-semibold text-zinc-800">{row.endTime}</span>
                          </td>
                          <td className="p-2.5 min-w-[200px]">
                            <div className="font-bold text-zinc-900">{row.title || <span className="text-red-500 italic">[Tajuk Kosong]</span>}</div>
                            {row.description && (
                              <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{row.description}</div>
                            )}
                            {row.errors.length > 0 && (
                              <div className="text-[10px] text-red-600 font-medium mt-1">
                                {row.errors.join(' • ')}
                              </div>
                            )}
                            {row.warnings.length > 0 && (
                              <div className="text-[10px] text-amber-600 font-medium mt-1">
                                {row.warnings.join(' • ')}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-zinc-700 whitespace-nowrap">
                            {row.facilitatorName || '-'}
                          </td>
                          <td className="p-2.5 text-zinc-600 text-[11px] whitespace-nowrap">
                            {row.location || '-'}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {row.isBreakOrMeal ? (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Rehat / Makan
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                                Sesi
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {row.status === 'VALID' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sah</span>
                              </span>
                            )}
                            {row.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700" title={row.warnings.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Amaran</span>
                              </span>
                            )}
                            {row.status === 'INVALID' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700" title={row.errors.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Ralat</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-zinc-100 border-t border-zinc-300 flex items-center justify-between shrink-0">
          <div>
            {step === 'REVIEW' && (
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="px-3.5 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pilih Fail Lain</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Batal
            </button>

            {step === 'REVIEW' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedIndices.size === 0}
                className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Sahkan & Import {selectedIndices.size} Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
