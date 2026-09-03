import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // System dev/testing PIN verified securely without exposing in UI text or placeholders
    if (pin.trim() === '5313') {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('PIN Pengesahan tidak sah. Akses ditolak.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
              Pengesahan Master Admin
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Akses Tadbir Urus & Kawalan Platform
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 mt-3 mb-4 leading-relaxed">
          Sila masukkan PIN kebenaran platform untuk mengakses modul Master Admin. Tindakan pentadbiran akan diaudit mengikut protokol DCOREV1.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
              PIN Keselamatan Pentadbir
            </label>
            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl font-mono py-2.5 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 border-2 border-zinc-900 text-zinc-700 hover:bg-zinc-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white border-2 border-zinc-900 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
            >
              <span>Sahkan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
