import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { 
  testFirebaseConnection, 
  syncAllLocalDataToFirestore, 
  syncAllCloudDataToLocal 
} from '../services/firebase';
import { platformStorage } from '../services/storage';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirebaseOnline: boolean;
  onConnectionChange: (online: boolean) => void;
  onDataReload: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  isFirebaseOnline,
  onConnectionChange,
  onDataReload,
}) => {
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [syncingToCloud, setSyncingToCloud] = useState<boolean>(false);
  const [pullingFromCloud, setPullingFromCloud] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setFeedbackMessage(null);
    try {
      const res = await testFirebaseConnection();
      onConnectionChange(res.success);
      setFeedbackMessage({
        type: res.success ? 'success' : 'info',
        text: res.message || (res.success ? 'Sambungan Firestore berjaya disahkan.' : 'Sambungan di luar talian.'),
      });
    } catch (err: any) {
      onConnectionChange(false);
      setFeedbackMessage({
        type: 'error',
        text: 'Ralat menguji sambungan: ' + (err?.message || String(err)),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncToCloud = async () => {
    setSyncingToCloud(true);
    setFeedbackMessage(null);
    try {
      const allLocal = platformStorage.exportAllDataForBackup();
      const res = await syncAllLocalDataToFirestore({
        courses: allLocal.courses || [],
        organizers: allLocal.organizers || [],
        scheduleDays: allLocal.scheduleDays || [],
        sessions: allLocal.sessions || [],
        announcements: allLocal.announcements || [],
        resources: allLocal.resources || [],
        participants: allLocal.participants || [],
        enrollments: allLocal.enrollments || [],
        attendances: allLocal.attendances || [],
      });
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Berjaya menyegerakkan ${res.count} rekod data ke pangkalan data Cloud Firestore.`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: `Gagal menyegerakkan: ${res.error || 'Ralat tidak diketahui'}`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: 'Ralat penyegerakan: ' + (err?.message || String(err)),
      });
    } finally {
      setSyncingToCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    setPullingFromCloud(true);
    setFeedbackMessage(null);
    try {
      const cloudData = await syncAllCloudDataToLocal();
      if (cloudData.courses.length > 0) {
        platformStorage.importCloudBackup(cloudData);
        onDataReload();
        setFeedbackMessage({
          type: 'success',
          text: `Berjaya memuat turun ${cloudData.courses.length} kursus dan ${cloudData.participants.length} peserta daripada Cloud Firestore.`,
        });
      } else {
        setFeedbackMessage({
          type: 'info',
          text: 'Pangkalan data Cloud Firestore masih kosong atau tiada rekod kursus ditemui.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: 'Ralat memuat turun dari Cloud: ' + (err?.message || String(err)),
      });
    } finally {
      setPullingFromCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-2 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400 text-zinc-950">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Status Pangkalan Data Firebase</h2>
              <p className="text-xs text-zinc-400">Konfigurasi Cloud Firestore Enterprise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Indicator Banner */}
          <div className={`p-4 border-2 flex items-start gap-3 ${
            isFirebaseOnline 
              ? 'bg-emerald-50 border-emerald-900 text-emerald-950' 
              : 'bg-amber-50 border-amber-900 text-amber-950'
          }`}>
            <div className="mt-0.5">
              {isFirebaseOnline ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-700" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{isFirebaseOnline ? 'Firebase Firestore Terhubung (Aktif)' : 'Menyambung / Di Luar Talian'}</span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isFirebaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              </div>
              <p className="text-xs mt-1 leading-relaxed text-zinc-700">
                {isFirebaseOnline 
                  ? 'Aplikasi terhubung terus ke pangkalan data cloud. Sebarang penambahan atau kemaskini data akan disegerakkan.'
                  : 'Aplikasi berjalan dalam mod storan selamat tempatan dan bersedia untuk menyegerak apabila sambungan terjalin.'}
              </p>
            </div>
          </div>

          {/* Database Details */}
          <div className="border-2 border-zinc-900 p-3.5 bg-zinc-50 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-zinc-200">
              <span className="text-zinc-600 font-sans font-semibold">Project ID:</span>
              <span className="text-zinc-900 font-bold">{firebaseConfig.projectId || 'ultimate-quote-w40ks'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-zinc-200">
              <span className="text-zinc-600 font-sans font-semibold">Database ID:</span>
              <span className="text-zinc-900 font-bold truncate max-w-[260px] text-right" title={firebaseConfig.firestoreDatabaseId}>
                {firebaseConfig.firestoreDatabaseId || 'ai-studio-mykursus'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-600 font-sans font-semibold">Security Rules:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Telah Disebarkan
              </span>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedbackMessage && (
            <div className={`p-3 text-xs font-medium border-2 ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-100 border-emerald-900 text-emerald-900' 
                : feedbackMessage.type === 'error'
                ? 'bg-red-100 border-red-900 text-red-900'
                : 'bg-blue-100 border-blue-900 text-blue-900'
            }`}>
              {feedbackMessage.text}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Menguji Sambungan...' : 'Uji Sambungan Cloud Semula'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSyncToCloud}
                disabled={syncingToCloud}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-zinc-950 border-2 border-zinc-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${syncingToCloud ? 'animate-bounce' : ''}`} />
                <span>{syncingToCloud ? 'Menyegerak...' : 'Muat Naik ke Cloud'}</span>
              </button>

              <button
                onClick={handlePullFromCloud}
                disabled={pullingFromCloud}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${pullingFromCloud ? 'animate-bounce' : ''}`} />
                <span>{pullingFromCloud ? 'Memuat turun...' : 'Tarik dari Cloud'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-100 px-5 py-3 border-t-2 border-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800 border-2 border-zinc-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
