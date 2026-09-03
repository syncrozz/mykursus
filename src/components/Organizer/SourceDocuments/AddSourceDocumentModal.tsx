import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  FileCode
} from 'lucide-react';
import { SourceDocument, SourceDocumentCategory, UserAuthContext } from '../../../types';

interface AddSourceDocumentModalProps {
  courseId: string;
  currentUser?: UserAuthContext;
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: SourceDocument, autoExtract: boolean) => void;
}

const CATEGORY_OPTIONS: Array<{ value: SourceDocumentCategory; label: string; description: string }> = [
  { 
    value: 'OFFICIAL_LETTER', 
    label: 'Surat Panggilan / Tawaran Rasmi', 
    description: 'Surat panggilan rasmi KPTM, pekeliling, atau surat jemputan berkod rujukan.' 
  },
  { 
    value: 'SCHEDULE', 
    label: 'Jadual / Tentatif Program', 
    description: 'Dokumen jadual waktu harian, modul pengajaran, penceramah, dan lokasi.' 
  },
  { 
    value: 'PARTICIPANT_LIST', 
    label: 'Senarai Peserta / Calon', 
    description: 'Fail spreadsheet (CSV/Excel) atau teks mengandungi senarai nama dan telefon peserta.' 
  },
  { 
    value: 'ACCOMMODATION', 
    label: 'Senarai Penginapan & Bilik', 
    description: 'Rooming list hotel, agihan bilik berkembar (twin sharing), dan waktu daftar masuk.' 
  },
  { 
    value: 'VENUE_LOGISTICS', 
    label: 'Maklumat Tempat & Logistik', 
    description: 'Maklumat dewan, panduan arah, parkir, dan konfigurasi akses rangkaian Wi-Fi.' 
  },
  { 
    value: 'COURSE_INFO', 
    label: 'Maklumat Am Kursus', 
    description: 'Buku panduan kursus, silibus modul, atau ringkasan objektif CLO.' 
  },
  { 
    value: 'REQUIREMENTS', 
    label: 'Keperluan & Arahan Pentadbiran', 
    description: 'Etika pakaian, keperluan perkakasan (laptop), dan dokumen prasyarat.' 
  },
  { 
    value: 'RESOURCE', 
    label: 'Bahan / Slaid Rujukan', 
    description: 'Nota taklimat, templat tugasan, atau dokumen rujukan kursus.' 
  },
  { 
    value: 'OTHER', 
    label: 'Dokumen Lain', 
    description: 'Sebarang fail atau nota sokongan tambahan penganjur.' 
  },
];

export const AddSourceDocumentModal: React.FC<AddSourceDocumentModalProps> = ({
  courseId,
  currentUser,
  isOpen,
  onClose,
  onSave,
}) => {
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<SourceDocumentCategory>('OFFICIAL_LETTER');
  const [rawText, setRawText] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT' | 'OTHER'>('TXT');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [autoExtract, setAutoExtract] = useState<boolean>(true);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    setFileName(file.name);
    setFileSizeBytes(file.size);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'csv') setFileType('CSV');
    else if (ext === 'xlsx' || ext === 'xls') setFileType('XLSX');
    else if (ext === 'pdf') setFileType('PDF');
    else if (ext === 'docx' || ext === 'doc') setFileType('DOCX');
    else if (ext === 'txt') setFileType('TXT');
    else setFileType('OTHER');

    // Automatically guess category from filename
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('surat') || lowerName.includes('letter') || lowerName.includes('panggilan')) {
      setCategory('OFFICIAL_LETTER');
    } else if (lowerName.includes('jadual') || lowerName.includes('tentatif') || lowerName.includes('schedule')) {
      setCategory('SCHEDULE');
    } else if (lowerName.includes('peserta') || lowerName.includes('participant') || lowerName.includes('calon') || ext === 'csv') {
      setCategory('PARTICIPANT_LIST');
    } else if (lowerName.includes('bilik') || lowerName.includes('hotel') || lowerName.includes('room')) {
      setCategory('ACCOMMODATION');
    }

    // Attempt to read text content client-side
    const reader = new FileReader();
    if (ext === 'txt' || ext === 'csv' || ext === 'tsv' || ext === 'json' || file.type.startsWith('text/')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text || '');
      };
      reader.readAsText(file);
    } else {
      // For binary files (PDF/DOCX), notify user that text can be pasted or extracted via text preview
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Text fallback or placeholder
        if (!rawText) {
          setRawText(`[Fail Binari Dikesan: ${file.name}]\nFormat: ${ext.toUpperCase()}\nSaiz: ${(file.size / 1024).toFixed(1)} KB.\nSila tampal teks kandungan surat/jadual di bawah sekiranya fail ini mengandungi teks yang diimbas untuk ekstraksi segera.`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fileName.trim();
    if (!cleanName) {
      setError('Sila masukkan nama fail dokumen.');
      return;
    }

    if (!rawText.trim()) {
      setError('Kandungan teks dokumen diperlukan untuk proses analisis dan ekstraksi pintar.');
      return;
    }

    const newDoc: SourceDocument = {
      id: 'doc-src-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      courseId,
      fileName: cleanName,
      fileType,
      fileSizeBytes: fileSizeBytes || new Blob([rawText]).size,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: currentUser?.id || 'org-user',
      uploadedByUserName: currentUser?.name || 'Penganjur Kursus',
      category,
      customCategoryLabel: CATEGORY_OPTIONS.find(c => c.value === category)?.label,
      rawText: rawText.trim(),
      extractionStatus: 'UPLOADED',
      version: 1
    };

    onSave(newDoc, autoExtract);
    onClose();
  };

  return (
    <div 
      id="add-source-document-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Muat Naik Dokumen Sumber</h3>
              <p className="text-xs text-slate-500">Pemberian bahan rujukan kursus untuk diekstrak secara pintar</p>
            </div>
          </div>
          <button
            id="close-add-doc-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Pilih / Lepaskan Fail Dokumen
            </label>
            <div
              id="file-drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : fileName 
                    ? 'border-emerald-300 bg-emerald-50/30' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => document.getElementById('source-file-input')?.click()}
            >
              <input
                type="file"
                id="source-file-input"
                className="hidden"
                accept=".txt,.csv,.tsv,.pdf,.docx,.doc,.xlsx,.xls,.json"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center">
                {fileName ? (
                  <>
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full mb-2">
                      {fileType === 'CSV' || fileType === 'XLSX' ? (
                        <FileSpreadsheet className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{fileName}</span>
                    <span className="text-xs text-slate-500 mt-1">
                      {fileType} • {(fileSizeBytes / 1024).toFixed(1)} KB • Klik untuk tukar fail
                    </span>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Tarik & lepas fail di sini, atau <span className="text-blue-600 font-semibold">layari fail</span>
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Menyokong PDF, DOCX, XLSX, CSV, dan TXT
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* File Name & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-doc-filename" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Fail / Tajuk Dokumen <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-doc-filename"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Contoh: Surat_Panggilan_MPU2412.txt"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label htmlFor="select-doc-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori Dokumen <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SourceDocumentCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw Text Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="textarea-doc-text" className="text-xs font-semibold text-slate-700">
                Kandungan Teks / Data Mentah <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {rawText ? `${rawText.split('\n').length} baris • ${rawText.length} aksara` : 'Boleh ditampal manual'}
              </span>
            </div>
            <textarea
              id="textarea-doc-text"
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Tampal teks surat panggilan, jadual program, atau baris data CSV peserta di sini..."
              className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50/50"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Data teks ini digunakan secara setempat oleh enjin ekstraksi bagi mencadangkan medan maklumat kursus, jadual, dan senarai peserta.
            </p>
          </div>

          {/* Auto Extract Checkbox */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
            <div className="flex items-center space-x-2.5">
              <input
                id="checkbox-auto-extract"
                type="checkbox"
                checked={autoExtract}
                onChange={(e) => setAutoExtract(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="checkbox-auto-extract" className="text-xs font-medium text-slate-800 cursor-pointer">
                Jalankan ekstraksi pintar serta-merta selepas muat naik
              </label>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 px-2 py-0.5 bg-blue-100/70 rounded-full">
              Disyorkan
            </span>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              id="cancel-add-doc-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="submit-add-doc-btn"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{autoExtract ? 'Simpan & Ekstrak Pintar' : 'Simpan Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
