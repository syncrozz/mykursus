import React, { useState, useRef, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, Compass, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { platformStorage } from '../../services/storage';
import { Organizer } from '../../types';

interface OrganizerLockedGateProps {
  onUnlockSuccess: (authenticatedOrg?: Organizer) => void;
  onNavigateToParticipant: () => void;
}

export const OrganizerLockedGate: React.FC<OrganizerLockedGateProps> = ({
  onUnlockSuccess,
  onNavigateToParticipant,
}) => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const orgs = platformStorage.getOrganizers();
    setOrganizers(orgs);
    const rememberedEmail = localStorage.getItem('mykursus_last_organizer_email');
    if (rememberedEmail) {
      setEmailInput(rememberedEmail);
    } else if (orgs.length > 0) {
      setEmailInput(orgs[0].contactEmail || '');
    }
    emailInputRef.current?.focus();
  }, []);

  const handleSelectQuickOrg = (org: Organizer) => {
    setEmailInput(org.contactEmail || org.code);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = platformStorage.verifyOrganizerCredentials(emailInput, pin);

    if (result.success && result.organizer) {
      try {
        localStorage.setItem('mykursus_last_organizer_email', result.organizer.contactEmail || '');
        localStorage.setItem('mykursus_active_organizer_id', result.organizer.id);
      } catch {
        // ignore
      }
      setError(null);
      setPin('');
      onUnlockSuccess(result.organizer);
    } else {
      setError(result.message || 'E-mel atau PIN penganjur tidak sah. Sila semak semula.');
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-8 sm:py-12 px-4">
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
              Akses Penganjur Berdaftar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-zinc-950 tracking-tight">
            Log Masuk Ruang Penganjur
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Sila masukkan E-mel Penganjur rasmi dan PIN keselamatan (Lalai: <strong>1234</strong>) untuk memulakan operasi kursus.
          </p>
        </div>

        {/* Quick Org Pills */}
        {organizers.length > 0 && (
          <div className="p-2.5 bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Pilihan Pantas Organisasi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {organizers.map(org => {
                const isSelected = emailInput.toLowerCase() === (org.contactEmail || '').toLowerCase();
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelectQuickOrg(org)}
                    className={`text-[11px] font-medium px-2 py-1 border transition-colors flex items-center gap-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-900 text-white border-zinc-900 font-bold' 
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-800'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{org.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            <label 
              htmlFor="input-gate-organizer-email"
              className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1"
            >
              E-mel Penganjur / Kod Organisasi *
            </label>
            <div className="relative">
              <input
                id="input-gate-organizer-email"
                ref={emailInputRef}
                type="text"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="cth. urusetia@kptm.edu.my"
                className="w-full text-xs font-bold py-2.5 pl-8 pr-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white text-zinc-900"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor="input-gate-organizer-pin"
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600"
              >
                PIN Keselamatan (4-Digit) *
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
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (error) setError(null);
              }}
              placeholder="••••"
              className="w-full text-center tracking-[0.4em] text-3xl font-mono py-2.5 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white shadow-inner font-black text-zinc-900"
            />
            <p className="text-[11px] text-zinc-500 mt-2 text-center font-mono">
              PIN Keselamatan Lalai: <strong>1234</strong>
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
              disabled={!emailInput.trim() || pin.length === 0}
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
