import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, X, Eye, EyeOff } from 'lucide-react';

interface OrganizerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrganizerAuthModal: React.FC<OrganizerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('PIN Keselamatan tidak sah. Sila masukkan PIN yang betul.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      id="modal-organizer-auth"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="btn-close-organizer-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 cursor-pointer p-1"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center border border-emerald-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
                Akses Ruang Penganjur
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                PIN
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Tapisan Keselamatan Pengurusan Kursus
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 mt-3 mb-4 leading-relaxed">
          Ruang penganjur dilindungi oleh tapisan keselamatan. Sila masukkan PIN keselamatan 4-digit untuk mengakses modul penganjur, pendaftaran peserta dan operasi kursus.
        </p>

        {error && (
          <div 
            id="organizer-auth-error-msg"
            className="p-3 mb-4 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-semibold flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="input-organizer-pin"
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600"
              >
                PIN Keselamatan Penganjur (4-Digit)
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                {showPin ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Sembunyi</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Papar</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                id="input-organizer-pin"
                ref={inputRef}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  if (error) setError(null);
                }}
                placeholder="••••"
                className="w-full text-center tracking-[0.4em] text-2xl font-mono py-2.5 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white shadow-inner font-black text-zinc-900"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 text-center font-mono">
              Petunjuk: PIN keselamatan lalai ialah <strong>1234</strong>
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              id="btn-cancel-organizer-pin"
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 border-2 border-zinc-900 text-zinc-700 hover:bg-zinc-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-organizer-pin"
              type="submit"
              disabled={pin.length === 0}
              className="w-1/2 py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-600 text-white border-2 border-zinc-900 hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sahkan & Masuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
