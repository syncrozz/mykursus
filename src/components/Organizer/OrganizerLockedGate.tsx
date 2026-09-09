import React, { useState, useRef, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, Compass } from 'lucide-react';

interface OrganizerLockedGateProps {
  onUnlockSuccess: () => void;
  onNavigateToParticipant: () => void;
}

export const OrganizerLockedGate: React.FC<OrganizerLockedGateProps> = ({
  onUnlockSuccess,
  onNavigateToParticipant,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      setError(null);
      setPin('');
      onUnlockSuccess();
    } else {
      setError('PIN Keselamatan tidak sah. Sila masukkan PIN 1234.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-12 px-4">
      <div 
        id="card-organizer-locked-gate"
        className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 text-white mx-auto flex items-center justify-center border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-block">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
              Tapisan Keselamatan Diperlukan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-zinc-950 tracking-tight">
            Ruang Penganjur Dikunci
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Akses ke ruang pengurusan kursus, peruntukan bilik/kumpulan, dan senarai peserta memerlukan pengesahan PIN keselamatan.
          </p>
        </div>

        {error && (
          <div 
            id="organizer-gate-error"
            className="p-3 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-semibold flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="input-gate-organizer-pin"
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600"
              >
                Masukkan PIN Keselamatan (4-Digit)
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
            <input
              id="input-gate-organizer-pin"
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
              className="w-full text-center tracking-[0.4em] text-3xl font-mono py-3 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white shadow-inner font-black text-zinc-900"
            />
            <p className="text-[11px] text-zinc-500 mt-2 text-center font-mono">
              PIN Keselamatan Penganjur: <strong>1234</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              id="btn-gate-back-to-participant"
              type="button"
              onClick={onNavigateToParticipant}
              className="w-full sm:w-1/2 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 border-2 border-zinc-900 text-zinc-700 hover:bg-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-600" />
              <span>Paparan Peserta</span>
            </button>
            <button
              id="btn-gate-submit-pin"
              type="submit"
              disabled={pin.length === 0}
              className="w-full sm:w-1/2 py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-600 text-white border-2 border-zinc-900 hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Ruang Penganjur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
