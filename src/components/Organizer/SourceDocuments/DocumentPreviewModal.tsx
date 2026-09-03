import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  HardDrive, 
  Copy, 
  Check, 
  Search,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { SourceDocument } from '../../../types';

interface DocumentPreviewModalProps {
  document: SourceDocument;
  isOpen: boolean;
  onClose: () => void;
  onTriggerExtract: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onTriggerExtract,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = doc.rawText.split('\n');
  const filteredIndices = searchTerm.trim() 
    ? lines.map((l, i) => l.toLowerCase().includes(searchTerm.toLowerCase()) ? i : -1).filter(i => i >= 0)
    : [];

  return (
    <div 
      id="document-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-slate-800">{doc.fileName}</h3>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-sm">
                  v{doc.version}
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {doc.customCategoryLabel || doc.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saiz: {(doc.fileSizeBytes / 1024).toFixed(1)} KB • Format: {doc.fileType} • Dimuat naik: {new Date(doc.uploadedAt).toLocaleString('ms-MY')}
              </p>
            </div>
          </div>

          <button
            id="close-preview-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari teks dalam dokumen..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Disalin' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={() => {
                onTriggerExtract();
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jalankan Ekstraksi Pintar</span>
            </button>
          </div>
        </div>

        {/* Content Viewer (Scrollable) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-100 font-mono text-xs select-text">
          <div className="space-y-0.5">
            {lines.map((line, idx) => {
              const isMatch = searchTerm.trim() && line.toLowerCase().includes(searchTerm.toLowerCase());
              return (
                <div 
                  key={idx} 
                  className={`flex items-start px-2 py-0.5 rounded-xs ${
                    isMatch ? 'bg-amber-900/50 text-amber-200 border-l-2 border-amber-400' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <span className="w-10 shrink-0 text-slate-600 select-none text-[11px] text-right pr-3">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all leading-relaxed">
                    {line || <span className="opacity-20"> </span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-4">
            <span>Dimuat naik oleh: <strong className="text-slate-700">{doc.uploadedByUserName || 'Penganjur'}</strong></span>
            <span>Jumlah Baris: <strong className="text-slate-700">{lines.length}</strong></span>
            {searchTerm.trim() && (
              <span className="text-amber-700 font-medium">
                {filteredIndices.length} padanan ditemui
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
