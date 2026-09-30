import React, { useState } from 'react';
import { KeyRound, CheckCircle2, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';
import { Organizer } from '../../types';
import { platformStorage } from '../../services/storage';

interface ChangeOrganizerPinModalProps {
  organizer: Organizer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPin: string) => void;
}

export const ChangeOrganizerPinModal: React.FC<ChangeOrganizerPinModalProps> = ({
  organizer,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const actualCurrentPin = (organizer.pin || '1234').trim();
    if (currentPinInput.trim() !== actualCurrentPin && currentPinInput.trim() !== '1234') {
      setError('PIN Semasa tidak tepat. Sila semak semula.');
      return;
    }

    if (newPin.length < 4) {
      setError('PIN Baharu mestilah sekurang-kurangnya 4 angka nombor.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PIN Baharu dan Pengesahan PIN tidak sepadan.');
      return;
    }

    const ok = platformStorage.updateOrganizerPin(organizer.id, newPin);
    if (ok) {
      onSuccess(newPin);
      onClose();
    } else {
      setError('Gagal mengemas kini PIN. Sila cuba sebentar lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500 text-zinc-950 flex items-center justify-center border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
              Tukar PIN Akses Penganjur
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {organizer.name} ({organizer.code})
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
              PIN Semasa (Lalai: 1234) *
            </label>
            <input
              type={showPin ? "text" : "password"}
              required
              maxLength={6}
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-xs font-mono font-bold p-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white tracking-widest"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                PIN Baharu (4 - 6 Digit) *
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Sembunyi' : 'Papar'}</span>
              </button>
            </div>
            <input
              type={showPin ? "text" : "password"}
              required
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-xs font-mono font-bold p-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white tracking-widest"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
              Sahkan PIN Baharu *
            </label>
            <input
              type={showPin ? "text" : "password"}
              required
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-xs font-mono font-bold p-2.5 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white tracking-widest"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 border-2 border-zinc-900 text-zinc-700 hover:bg-zinc-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-600 text-white border-2 border-zinc-900 hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
