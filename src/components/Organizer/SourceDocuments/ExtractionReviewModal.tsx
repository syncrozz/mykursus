import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Calendar, 
  Users, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  SourceDocument, 
  Course, 
  ExtractedField, 
  ExtractedParticipantRow, 
  ExtractedSessionItem,
  ApprovalStatus 
} from '../../../types';

interface ExtractionReviewModalProps {
  document: SourceDocument;
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onApplyField: (fieldKey: string) => void;
  onRejectField: (fieldKey: string) => void;
  onImportParticipants: (selectedRowIds: string[]) => void;
  onImportSessions: (selectedSessionIds: string[]) => void;
}

type ReviewTab = 'FIELDS' | 'SESSIONS' | 'PARTICIPANTS';

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  document: doc,
  course,
  isOpen,
  onClose,
  onApplyField,
  onRejectField,
  onImportParticipants,
  onImportSessions,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('FIELDS');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() => {
    // Default select non-duplicate and non-error participants
    const parts = doc.extractedPayload?.participants || [];
    return parts.filter(p => p.status !== 'IMPORTED' && !p.isDuplicate && p.validationErrors.length === 0).map(p => p.id);
  });
  const [selectedSessions, setSelectedSessions] = useState<string[]>(() => {
    const sess = doc.extractedPayload?.sessions || [];
    return sess.filter(s => s.status !== 'IMPORTED' && s.selectedForImport).map(s => s.id);
  });
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const payload = doc.extractedPayload;
  const isGoverned = course.approvalStatus === ApprovalStatus.APPROVED || course.approvalStatus === ApprovalStatus.SUBMITTED;

  const handleApplySingleField = (fieldKey: string) => {
    onApplyField(fieldKey);
    setNotification(`Medan "${fieldKey}" telah diproses.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRejectSingleField = (fieldKey: string) => {
    onRejectField(fieldKey);
    setNotification(`Cadangan medan "${fieldKey}" telah ditolak.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyAllNonConflicting = () => {
    if (!payload?.fields) return;
    const candidates = payload.fields.filter(f => f.status === 'PENDING' && !f.isConflict);
    candidates.forEach(f => onApplyField(f.fieldKey));
    setNotification(`${candidates.length} medan bebas konflik telah diterapkan.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleParticipant = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllParticipants = (selectAll: boolean) => {
    if (!payload?.participants) return;
    if (selectAll) {
      setSelectedParticipants(payload.participants.filter(p => p.status !== 'IMPORTED').map(p => p.id));
    } else {
      setSelectedParticipants([]);
    }
  };

  const handleToggleSession = (id: string) => {
    setSelectedSessions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllSessions = (selectAll: boolean) => {
    if (!payload?.sessions) return;
    if (selectAll) {
      setSelectedSessions(payload.sessions.filter(s => s.status !== 'IMPORTED').map(s => s.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const pendingFieldsCount = payload?.fields.filter(f => f.status === 'PENDING').length || 0;
  const pendingSessionsCount = payload?.sessions.filter(s => s.status !== 'IMPORTED').length || 0;
  const pendingParticipantsCount = payload?.participants.filter(p => p.status !== 'IMPORTED').length || 0;

  return (
    <div 
      id="extraction-review-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-slate-800">Semakan & Penyerapan Data Sumber</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {doc.customCategoryLabel || doc.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500">v{doc.version}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Fail: <span className="font-medium text-slate-700">{doc.fileName}</span> • Diekstrak pada {doc.lastExtractedAt ? new Date(doc.lastExtractedAt).toLocaleString('ms-MY') : '-'}
              </p>
            </div>
          </div>

          <button
            id="close-review-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Notice */}
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Prinsip Integriti Data:</strong> Data diekstrak adalah bersifat <em>CADANGAN</em> semata-mata. Data berwibawa kursus tidak akan ditindih tanpa persetujuan anda.
            </span>
          </div>
          {notification && (
            <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[11px] font-medium animate-fade-in">
              {notification}
            </span>
          )}
        </div>

        {/* Tab Navigation & Statistics */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex space-x-6">
            <button
              id="tab-review-fields"
              onClick={() => setActiveTab('FIELDS')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'FIELDS'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Info Kursus & Logistik</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                pendingFieldsCount > 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-500'
              }`}>
                {payload?.fields.length || 0}
              </span>
            </button>

            <button
              id="tab-review-sessions"
              onClick={() => setActiveTab('SESSIONS')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'SESSIONS'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Jadual & Sesi</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                pendingSessionsCount > 0 ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-slate-100 text-slate-500'
              }`}>
                {payload?.sessions.length || 0}
              </span>
            </button>

            <button
              id="tab-review-participants"
              onClick={() => setActiveTab('PARTICIPANTS')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'PARTICIPANTS'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Senarai Peserta</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                pendingParticipantsCount > 0 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-500'
              }`}>
                {payload?.participants.length || 0}
              </span>
            </button>
          </div>

          {activeTab === 'FIELDS' && pendingFieldsCount > 0 && (
            <button
              id="accept-all-fields-btn"
              onClick={handleApplyAllNonConflicting}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline py-2"
            >
              Terapkan Semua Bebas Konflik
            </button>
          )}
        </div>

        {/* Tab Content Container (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: FIELDS REVIEW */}
          {activeTab === 'FIELDS' && (
            <div className="space-y-4">
              {(!payload?.fields || payload.fields.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tiada Medan Info Dikesan</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Dokumen ini tidak mengandungi format penanda medan am (seperti Tajuk, Tarikh, Tempat, Wi-Fi). Sila semak tab Jadual atau Senarai Peserta.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="grid grid-cols-12 bg-slate-100/80 px-4 py-3 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <div className="col-span-3">Medan Maklumat</div>
                    <div className="col-span-3">Nilai Semasa Kursus</div>
                    <div className="col-span-4">Nilai Cadangan Dokumen</div>
                    <div className="col-span-2 text-right">Tindakan</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {payload.fields.map((field, idx) => {
                      const isHighRisk = field.isHighRiskGovernance && isGoverned;
                      return (
                        <div 
                          key={field.fieldKey + '-' + idx} 
                          className={`grid grid-cols-12 px-4 py-3.5 items-start text-xs transition-colors ${
                            field.status === 'ACCEPTED' ? 'bg-emerald-50/30' : field.status === 'REJECTED' ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Field Label & Category */}
                          <div className="col-span-3 pr-3">
                            <span className="font-semibold text-slate-800 block">{field.fieldLabel}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{field.fieldKey}</span>
                            {field.confidence === 'HIGH' ? (
                              <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-xs mt-1">
                                Keyakinan Tinggi
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-xs mt-1">
                                Perlu Pengesahan
                              </span>
                            )}
                          </div>

                          {/* Current Value */}
                          <div className="col-span-3 pr-3">
                            <span className="text-slate-600 block text-xs break-words">
                              {field.currentValue || <em className="text-slate-400">Kosong / Belum Ditetapkan</em>}
                            </span>
                          </div>

                          {/* Proposed Value & Snippet */}
                          <div className="col-span-4 pr-3">
                            <span className="font-semibold text-slate-900 block break-words text-xs">
                              {String(field.extractedValue)}
                            </span>
                            {field.sourceSnippet && (
                              <span className="text-[10px] text-slate-500 italic block mt-1 bg-slate-100/60 p-1.5 rounded-sm border border-slate-200/60">
                                "{field.sourceSnippet}"
                              </span>
                            )}

                            {field.isConflict && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full mt-1.5">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Konflik Dikesan (Berbeza dari rekod sedia ada)
                              </span>
                            )}

                            {isHighRisk && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full mt-1.5">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Memerlukan Kelulusan Master Admin (Tadbir Urus)
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="col-span-2 flex items-center justify-end space-x-1.5 pt-0.5">
                            {field.status === 'ACCEPTED' ? (
                              <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Diterapkan
                              </span>
                            ) : field.status === 'REJECTED' ? (
                              <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                                Ditolak
                              </span>
                            ) : (
                              <>
                                <button
                                  id={`reject-field-${field.fieldKey}`}
                                  type="button"
                                  onClick={() => handleRejectSingleField(field.fieldKey)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                  title="Tolak cadangan ini"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  id={`apply-field-${field.fieldKey}`}
                                  type="button"
                                  onClick={() => handleApplySingleField(field.fieldKey)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-md shadow-xs flex items-center space-x-1 transition-colors ${
                                    isHighRisk 
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isHighRisk ? 'Pohon Kelulusan' : 'Terima'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSIONS REVIEW */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-4">
              {(!payload?.sessions || payload.sessions.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tiada Sesi Jadual Dikesan</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Dokumen ini tidak mengandungi corak masa harian (seperti 08:30 - 10:30). Sila pastikan format teks jadual mengandungi penanda masa.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="select-all-sessions-cb"
                        checked={selectedSessions.length === payload.sessions.length && payload.sessions.length > 0}
                        onChange={(e) => handleSelectAllSessions(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                      />
                      <label htmlFor="select-all-sessions-cb" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Pilih Semua Sesi ({selectedSessions.length}/{payload.sessions.length} dipilih)
                      </label>
                    </div>

                    <button
                      id="import-selected-sessions-btn"
                      type="button"
                      disabled={selectedSessions.length === 0}
                      onClick={() => onImportSessions(selectedSessions)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Import {selectedSessions.length} Sesi ke Tentatif Kursus</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="grid grid-cols-12 bg-slate-100/80 px-4 py-3 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                      <div className="col-span-1">Pilih</div>
                      <div className="col-span-2">Hari & Waktu</div>
                      <div className="col-span-4">Tajuk Sesi</div>
                      <div className="col-span-3">Penceramah / Lokasi</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {payload.sessions.map((sess) => {
                        const isChecked = selectedSessions.includes(sess.id);
                        const isImported = sess.status === 'IMPORTED';

                        return (
                          <div 
                            key={sess.id}
                            className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors ${
                              isImported ? 'bg-emerald-50/40' : isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="col-span-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isImported}
                                onChange={() => handleToggleSession(sess.id)}
                                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                              />
                            </div>

                            <div className="col-span-2">
                              <span className="font-semibold text-slate-800 block">Hari {sess.dayNumber}</span>
                              <span className="text-slate-500 font-mono text-[11px]">{sess.startTime} - {sess.endTime}</span>
                            </div>

                            <div className="col-span-4 pr-3">
                              <span className="font-medium text-slate-900 block">{sess.title}</span>
                              {sess.sourceSnippet && (
                                <span className="text-[10px] text-slate-400 italic block mt-0.5 truncate">
                                  {sess.sourceSnippet}
                                </span>
                              )}
                            </div>

                            <div className="col-span-3">
                              <span className="text-slate-700 block text-xs">
                                {sess.facilitatorName ? `Oleh: ${sess.facilitatorName}` : <em className="text-slate-400">Penceramah tidak dinyatakan</em>}
                              </span>
                              {sess.location && (
                                <span className="text-[11px] text-slate-500 flex items-center mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                                  {sess.location}
                                </span>
                              )}
                            </div>

                            <div className="col-span-2 text-right">
                              {isImported ? (
                                <span className="inline-flex items-center text-emerald-700 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Diimport
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Sedia Diimport</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANTS REVIEW */}
          {activeTab === 'PARTICIPANTS' && (
            <div className="space-y-4">
              {(!payload?.participants || payload.participants.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tiada Data Peserta Dikesan</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Dokumen ini tidak mengandungi senarai lajur berstruktur (seperti Nama, No Telefon, Kolej). Muat naik fail CSV atau spreadsheet peserta untuk menggunakan modul ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-emerald-700 font-medium">Peserta Baharu</span>
                        <h4 className="text-lg font-bold text-emerald-800">
                          {payload.participants.filter(p => !p.isDuplicate && p.validationErrors.length === 0).length}
                        </h4>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-amber-700 font-medium">Padanan Duplikasi Dikesan</span>
                        <h4 className="text-lg font-bold text-amber-800">
                          {payload.participants.filter(p => p.isDuplicate).length}
                        </h4>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>

                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-600 font-medium">Lajur Dikesan</span>
                        <h4 className="text-xs font-semibold text-slate-800 truncate mt-1">
                          {payload.detectedColumns?.join(', ') || 'Nama, No Telefon, Bilik, Kumpulan'}
                        </h4>
                      </div>
                      <Layers className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>

                  {/* Actions & Selection Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="select-all-participants-cb"
                        checked={selectedParticipants.length === payload.participants.length && payload.participants.length > 0}
                        onChange={(e) => handleSelectAllParticipants(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                      />
                      <label htmlFor="select-all-participants-cb" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Pilih Semua ({selectedParticipants.length}/{payload.participants.length} dipilih)
                      </label>
                    </div>

                    <button
                      id="import-selected-participants-btn"
                      type="button"
                      disabled={selectedParticipants.length === 0}
                      onClick={() => onImportParticipants(selectedParticipants)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Import {selectedParticipants.length} Peserta ke Kursus</span>
                    </button>
                  </div>

                  {/* Table of Extracted Participants */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                          <th className="py-3 px-3 w-10">Pilih</th>
                          <th className="py-3 px-3">Nama Peserta</th>
                          <th className="py-3 px-3">Telefon (Format Piawai)</th>
                          <th className="py-3 px-3">Kolej / Agensi</th>
                          <th className="py-3 px-3">No Gaji / Gred</th>
                          <th className="py-3 px-3">Agihan Bilik & Kumpulan</th>
                          <th className="py-3 px-3 text-right">Status Semakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payload.participants.map((part) => {
                          const isChecked = selectedParticipants.includes(part.id);
                          const isImported = part.status === 'IMPORTED';

                          return (
                            <tr 
                              key={part.id}
                              className={`transition-colors ${
                                isImported 
                                  ? 'bg-emerald-50/40' 
                                  : part.isDuplicate 
                                    ? 'bg-amber-50/30' 
                                    : isChecked 
                                      ? 'bg-blue-50/30' 
                                      : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isImported}
                                  onChange={() => handleToggleParticipant(part.id)}
                                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-900 block">{part.name}</span>
                                {part.email && <span className="text-[11px] text-slate-500">{part.email}</span>}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono text-slate-700">{part.phone}</span>
                                {part.normalizedPhone && part.normalizedPhone !== part.phone && (
                                  <span className="block text-[10px] text-slate-400 font-mono">
                                    Norm: {part.normalizedPhone}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {part.institutionOrAgency}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span>{part.salaryNumber || '-'}</span>
                                {part.designation && (
                                  <span className="block text-[10px] text-slate-500">{part.designation}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {part.roomNumber ? (
                                  <span className="text-[11px] text-slate-700 block font-medium">
                                    Bilik {part.roomNumber} {part.roommateName && `(bersama ${part.roommateName})`}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 block">Tiada Bilik</span>
                                )}
                                {part.assignedGroup && (
                                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-xs inline-block mt-0.5">
                                    {part.assignedGroup}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {isImported ? (
                                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Diimport
                                  </span>
                                ) : part.isDuplicate ? (
                                  <span 
                                    className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full cursor-help"
                                    title={part.duplicateReason}
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Padanan Ditemui
                                  </span>
                                ) : part.validationErrors.length > 0 ? (
                                  <span 
                                    className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full cursor-help"
                                    title={part.validationErrors.join('; ')}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" /> Ralat Data
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium text-[11px]">
                                    Sedia Diimport
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Sebarang perubahan disimpan terus ke repositori selamat platform MyKursus.
          </span>
          <button
            type="button"
            id="close-review-modal-footer-btn"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup Semakan
          </button>
        </div>
      </div>
    </div>
  );
};
