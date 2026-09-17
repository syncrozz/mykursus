import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Eye, 
  Filter, 
  Search, 
  FileSpreadsheet, 
  RefreshCw, 
  HelpCircle,
  Users,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { 
  Course, 
  SourceDocument, 
  SourceDocumentCategory, 
  UserAuthContext 
} from '../../../types';
import { platformStorage } from '../../../services/storage';
import { AddSourceDocumentModal } from './AddSourceDocumentModal';
import { ExtractionReviewModal } from './ExtractionReviewModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface SourceDocumentsTabProps {
  course: Course;
  currentUser?: UserAuthContext;
  onCourseUpdated: (course: Course) => void;
  onTriggerLiveUpdate?: () => void;
}

export const SourceDocumentsTab: React.FC<SourceDocumentsTabProps> = ({
  course,
  currentUser,
  onCourseUpdated,
  onTriggerLiveUpdate,
}) => {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState<SourceDocument | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<SourceDocument | null>(null);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const loadDocuments = () => {
    try {
      const list = platformStorage.getSourceDocumentsByCourseId(course.id, currentUser);
      setDocuments(list);
    } catch (err: any) {
      console.error('Failed to load source documents:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [course.id]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveNewDocument = (newDoc: SourceDocument, autoExtract: boolean) => {
    try {
      const saved = platformStorage.saveSourceDocument(newDoc, currentUser);
      if (autoExtract) {
        setExtractingDocId(saved.id);
        setTimeout(() => {
          try {
            const extracted = platformStorage.extractDocumentData(saved.id, course.id, currentUser);
            loadDocuments();
            setSelectedDocForReview(extracted);
            showToast(`Dokumen "${saved.fileName}" berjaya disimpan dan diekstrak pintar.`);
          } catch (err: any) {
            showToast(`Ekstraksi gagal: ${err.message}`, 'error');
          } finally {
            setExtractingDocId(null);
          }
        }, 600);
      } else {
        loadDocuments();
        showToast(`Dokumen "${saved.fileName}" berjaya dimuat naik.`);
      }
    } catch (err: any) {
      showToast(`Ralat menyimpan dokumen: ${err.message}`, 'error');
    }
  };

  const handleTriggerExtraction = (doc: SourceDocument) => {
    setExtractingDocId(doc.id);
    setTimeout(() => {
      try {
        const updated = platformStorage.extractDocumentData(doc.id, course.id, currentUser);
        loadDocuments();
        setSelectedDocForReview(updated);
        showToast(`Ekstraksi pintar bagi "${doc.fileName}" telah selesai.`);
      } catch (err: any) {
        showToast(`Ekstraksi gagal: ${err.message}`, 'error');
      } finally {
        setExtractingDocId(null);
      }
    }, 500);
  };

  const handleDeleteDocument = (doc: SourceDocument) => {
    if (!window.confirm(`Adakah anda pasti ingin memadam dokumen sumber "${doc.fileName}"? Tindakan ini adalah kekal.`)) {
      return;
    }

    try {
      platformStorage.deleteSourceDocument(doc.id, course.id, currentUser);
      loadDocuments();
      if (selectedDocForReview?.id === doc.id) setSelectedDocForReview(null);
      if (selectedDocForPreview?.id === doc.id) setSelectedDocForPreview(null);
      showToast(`Dokumen "${doc.fileName}" telah dipadam sepenuhnya dari arkib.`);
    } catch (err: any) {
      showToast(`Gagal memadam: ${err.message}`, 'error');
    }
  };

  const handleApplyField = (fieldKey: string) => {
    if (!selectedDocForReview) return;
    try {
      const res = platformStorage.applyExtractedFieldToCourse(course.id, selectedDocForReview.id, fieldKey, currentUser);
      onCourseUpdated(res.course);
      if (onTriggerLiveUpdate) onTriggerLiveUpdate();

      // Reload document to get updated status
      const updatedDoc = platformStorage.getSourceDocumentById(selectedDocForReview.id, currentUser);
      if (updatedDoc) setSelectedDocForReview(updatedDoc);
      loadDocuments();

      if (res.changeRequest) {
        showToast(`Medan "${fieldKey}" berisiko tinggi — Cadangan pindaan dihantar ke Master Admin untuk kelulusan.`);
      } else {
        showToast(`Medan "${fieldKey}" berjaya diterapkan ke maklumat kursus.`);
      }
    } catch (err: any) {
      showToast(`Gagal menerapkan medan: ${err.message}`, 'error');
    }
  };

  const handleRejectField = (fieldKey: string) => {
    if (!selectedDocForReview) return;
    try {
      platformStorage.rejectExtractedField(course.id, selectedDocForReview.id, fieldKey, currentUser);
      const updatedDoc = platformStorage.getSourceDocumentById(selectedDocForReview.id, currentUser);
      if (updatedDoc) setSelectedDocForReview(updatedDoc);
      loadDocuments();
      showToast(`Cadangan nilai medan "${fieldKey}" telah ditolak.`);
    } catch (err: any) {
      showToast(`Gagal menolak medan: ${err.message}`, 'error');
    }
  };

  const handleImportParticipants = (selectedRowIds: string[]) => {
    if (!selectedDocForReview) return;
    try {
      const res = platformStorage.importExtractedParticipants(
        course.id, 
        selectedDocForReview.id, 
        selectedRowIds, 
        currentUser
      );
      const updatedDoc = platformStorage.getSourceDocumentById(selectedDocForReview.id, currentUser);
      if (updatedDoc) setSelectedDocForReview(updatedDoc);
      loadDocuments();
      if (onTriggerLiveUpdate) onTriggerLiveUpdate();
      showToast(`Import peserta berjaya: ${res.importedCount} peserta baharu, ${res.updatedCount} rekod dikemaskini.`);
    } catch (err: any) {
      showToast(`Gagal mengimport peserta: ${err.message}`, 'error');
    }
  };

  const handleImportSessions = (selectedSessionIds: string[]) => {
    if (!selectedDocForReview) return;
    try {
      const res = platformStorage.importExtractedSessions(
        course.id, 
        selectedDocForReview.id, 
        selectedSessionIds, 
        currentUser
      );
      const updatedDoc = platformStorage.getSourceDocumentById(selectedDocForReview.id, currentUser);
      if (updatedDoc) setSelectedDocForReview(updatedDoc);
      loadDocuments();
      if (onTriggerLiveUpdate) onTriggerLiveUpdate();
      showToast(`Import jadual berjaya: ${res.importedCount} sesi baharu didaftarkan.`);
    } catch (err: any) {
      showToast(`Gagal mengimport sesi: ${err.message}`, 'error');
    }
  };

  // Filter and search
  const filteredDocs = documents.filter(doc => {
    const matchesFilter = activeFilter === 'ALL' || doc.category === activeFilter;
    const matchesSearch = !searchQuery.trim() || 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.customCategoryLabel && doc.customCategoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.rawText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalExtractedCount = documents.filter(d => d.extractionStatus === 'EXTRACTED').length;
  const needsReviewCount = documents.filter(d => d.extractionStatus === 'NEEDS_REVIEW').length;

  return (
    <div id="source-documents-tab" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between shadow-md transition-all ${
          toastMessage.type === 'error' 
            ? 'bg-rose-600 text-white' 
            : toastMessage.type === 'info' 
              ? 'bg-blue-600 text-white' 
              : 'bg-emerald-600 text-white'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-white/80 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Top Overview Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jumlah Dokumen Sumber</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{documents.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Arkib sulit penganjur</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Selesai Diekstrak</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{totalExtractedCount}</p>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">Sedia untuk semakan</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Perlu Semakan / Konflik</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{needsReviewCount}</p>
          <span className="text-[11px] text-amber-600/80 mt-1 block">Perbezaan data dikesan</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Prinsip Tadbir Urus</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700 mt-2 leading-tight">Cadangan & Bukan Penindihan</p>
          <span className="text-[11px] text-purple-600 mt-1 block">Persetujuan penganjur diwajibkan</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="search-source-docs-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fail, tajuk, atau teks dalam dokumen..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              id="open-add-doc-modal-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Muat Naik Dokumen Sumber</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
          <span className="text-slate-400 font-medium mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Kategori:
          </span>
          {[
            { key: 'ALL', label: 'Semua' },
            { key: 'OFFICIAL_LETTER', label: 'Surat Panggilan Rasmi' },
            { key: 'SCHEDULE', label: 'Jadual & Tentatif' },
            { key: 'PARTICIPANT_LIST', label: 'Senarai Peserta' },
            { key: 'ACCOMMODATION', label: 'Penginapan' },
            { key: 'VENUE_LOGISTICS', label: 'Logistik Tempat' }
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === cat.key
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Tiada Dokumen Sumber Dijumpai</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Kurangkan kemasukan data manual dengan memuat naik surat rasmi, jadual waktu kursus, atau spreadsheet senarai peserta. Ekstraksi pintar platform akan mencadangkan maklumat untuk disemak.
          </p>
          <div className="mt-5 flex items-center justify-center">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Muat Naik Dokumen Sumber Pertama</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocs.map((doc) => {
            const isExtracting = extractingDocId === doc.id;
            const payload = doc.extractedPayload;

            return (
              <div 
                key={doc.id}
                id={`source-doc-card-${doc.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Document Info */}
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 bg-slate-100 text-slate-700 rounded-xl shrink-0 mt-0.5">
                      {doc.fileType === 'CSV' || doc.fileType === 'XLSX' ? (
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{doc.fileName}</h4>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.2 rounded-xs">
                          v{doc.version}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          {doc.customCategoryLabel || doc.category}
                        </span>

                        {/* Extraction Status Badge */}
                        {doc.extractionStatus === 'EXTRACTED' && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai Diekstrak
                          </span>
                        )}
                        {doc.extractionStatus === 'NEEDS_REVIEW' && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Perlu Semakan / Konflik
                          </span>
                        )}
                        {doc.extractionStatus === 'UPLOADED' && (
                          <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 mr-1" /> Belum Diekstrak
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        Saiz: {(doc.fileSizeBytes / 1024).toFixed(1)} KB • Dimuat naik oleh {doc.uploadedByUserName || 'Penganjur'} pada {new Date(doc.uploadedAt).toLocaleString('ms-MY')}
                      </p>

                      {/* Payload Metrics Preview Strip */}
                      {payload && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                          <span className="inline-flex items-center text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                            <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            <strong>{payload.summary.totalFieldsExtracted}</strong>&nbsp;Medan Info
                          </span>
                          <span className="inline-flex items-center text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                            <strong>{payload.summary.totalSessionsExtracted}</strong>&nbsp;Sesi Jadual
                          </span>
                          <span className="inline-flex items-center text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                            <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            <strong>{payload.summary.totalParticipantsExtracted}</strong>&nbsp;Peserta Dikesan
                          </span>

                          {payload.summary.conflictCount > 0 && (
                            <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                              {payload.summary.conflictCount} Perbezaan dengan Rekod Semasa
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      id={`preview-doc-${doc.id}-btn`}
                      type="button"
                      onClick={() => setSelectedDocForPreview(doc)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      title="Lihat Teks & Metadata Dokumen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      id={`extract-doc-${doc.id}-btn`}
                      type="button"
                      disabled={isExtracting}
                      onClick={() => handleTriggerExtraction(doc)}
                      className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                      <span>{isExtracting ? 'Menganalisis...' : 'Ekstrak Pintar'}</span>
                    </button>

                    {payload && (
                      <button
                        id={`review-doc-${doc.id}-btn`}
                        type="button"
                        onClick={() => setSelectedDocForReview(doc)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <span>Semak & Terapkan Data</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      id={`delete-doc-${doc.id}-btn`}
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Padam Dokumen Sumber"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddSourceDocumentModal
          courseId={course.id}
          currentUser={currentUser}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewDocument}
        />
      )}

      {selectedDocForReview && (
        <ExtractionReviewModal
          document={selectedDocForReview}
          course={course}
          isOpen={Boolean(selectedDocForReview)}
          onClose={() => setSelectedDocForReview(null)}
          onApplyField={handleApplyField}
          onRejectField={handleRejectField}
          onImportParticipants={handleImportParticipants}
          onImportSessions={handleImportSessions}
        />
      )}

      {selectedDocForPreview && (
        <DocumentPreviewModal
          document={selectedDocForPreview}
          isOpen={Boolean(selectedDocForPreview)}
          onClose={() => setSelectedDocForPreview(null)}
          onTriggerExtract={() => handleTriggerExtraction(selectedDocForPreview)}
        />
      )}
    </div>
  );
};
