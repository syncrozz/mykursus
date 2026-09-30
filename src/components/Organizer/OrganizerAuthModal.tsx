import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, X, Eye, EyeOff, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { platformStorage } from '../../services/storage';
import { Organizer } from '../../types';

interface OrganizerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authenticatedOrg?: Organizer) => void;
}

export const OrganizerAuthModal: React.FC<OrganizerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const orgs = platformStorage.getOrganizers();
      setOrganizers(orgs);
      
      // Auto-fill with the first organizer or remembered email if available
      const rememberedEmail = localStorage.getItem('mykursus_last_organizer_email');
      if (rememberedEmail) {
        setEmailInput(rememberedEmail);
      } else if (orgs.length > 0) {
        setEmailInput(orgs[0].contactEmail || '');
      }

      setPin('');
      setError(null);
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      onSuccess(result.organizer);
    } else {
      setError(result.message || 'E-mel atau PIN penganjur tidak sah. Sila semak semula.');
    }
  };

  return (
    <div 
      id="modal-organizer-auth"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] relative max-h-[90vh] overflow-y-auto"
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
                Log Masuk Penganjur
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                PIN 1234
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Pengesahan Akses Operasi Kursus
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 mt-2 mb-3 leading-relaxed">
          Sila masukkan <strong>E-mel Penganjur</strong> berdaftar dan <strong>PIN Keselamatan (Lalai: 1234)</strong> untuk mengakses ruang operasi.
        </p>

        {/* Quick Selection Pills if organizers exist */}
        {organizers.length > 0 && (
          <div className="mb-3 p-2.5 bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Pilihan Penganjur Berdaftar (Pantas):
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
            id="organizer-auth-error-msg"
            className="p-3 mb-4 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-semibold flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Code Field */}
          <div>
            <label 
              htmlFor="input-organizer-email"
              className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1"
            >
              E-mel Penganjur / Kod Organisasi *
            </label>
            <div className="relative">
              <input
                id="input-organizer-email"
                ref={emailInputRef}
                type="text"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="cth. urusetia@kptm.edu.my atau KPTM"
                className="w-full text-xs font-bold py-2.5 pl-8 pr-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white text-zinc-900"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor="input-organizer-pin"
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
            <div className="relative">
              <input
                id="input-organizer-pin"
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
                className="w-full text-center tracking-[0.4em] text-2xl font-mono py-2.5 px-3 bg-zinc-50 border-2 border-zinc-900 focus:outline-none focus:bg-white shadow-inner font-black text-zinc-900"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 text-center font-mono">
              Petunjuk Lalai: PIN ialah <strong>1234</strong>
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
              disabled={!emailInput.trim() || pin.length === 0}
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
