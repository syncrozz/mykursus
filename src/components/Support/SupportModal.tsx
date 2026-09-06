import React, { useState, useEffect } from 'react';
import { X, Download, ChevronDown, Check, Heart } from 'lucide-react';

/**
 * EXACT LOCKED RAW URL for Support QR Image
 * Compliant with SYNCROZZ Platform Support Experience Standard
 */
export const LOCKED_SUPPORT_QR_URL =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/Bank%20QR/QR%20RYT%20for%20Sumbangan.jpg';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveQRCode = async () => {
    setIsDownloading(true);
    try {
      // Fetch direct image blob to trigger native download
      const response = await fetch(LOCKED_SUPPORT_QR_URL);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'QR RYT for Sumbangan.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch {
      // Reliable fallback: Direct anchor download using exact same locked URL
      const link = document.createElement('a');
      link.href = LOCKED_SUPPORT_QR_URL;
      link.target = '_blank';
      link.download = 'QR RYT for Sumbangan.jpg';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      id="support-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div
        id="support-modal-container"
        className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xl w-full max-w-md my-auto overflow-hidden relative text-center p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col"
      >
        {/* Top-Right Close Button (X) */}
        <button
          id="support-modal-close-x"
          type="button"
          onClick={onClose}
          aria-label="Tutup popup sokongan"
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 -mr-1">
          {/* Header Section */}
          <div className="space-y-2 pt-1">
            {/* Badge: Sumbangan Sukarela */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-semibold tracking-wide select-none">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>Sumbangan Sukarela</span>
            </div>

            {/* Title: Sokong Inovasi Ini ❤️ */}
            <h2
              id="support-modal-title"
              className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight"
            >
              Sokong Inovasi Ini <span className="text-rose-500">❤️</span>
            </h2>

            {/* Short friendly description */}
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto px-2">
              Platform ini dibangunkan secara berterusan bagi memudahkan warga pendidik dan komuniti.
              Sokongan ikhlas anda membantu kesinambungan pelayanan dan pembangunan inovasi seterusnya.
            </p>
          </div>

          {/* REAL QR DISPLAY (LOCKED RAW URL) */}
          <div className="pt-1">
            <div className="inline-block p-3 sm:p-4 bg-white rounded-xl border border-zinc-200 shadow-sm max-w-xs mx-auto">
              <img
                src={LOCKED_SUPPORT_QR_URL}
                alt="DuitNow QR RYT Sumbangan"
                className="w-52 sm:w-60 h-auto max-w-full object-contain mx-auto rounded-md select-none"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Support Information */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-800">
              DuitNow QR / Mana-mana Bank & e-Wallet Malaysia
            </p>
            <p className="text-xs text-zinc-600 font-medium">
              RM1 pun amat dihargai 👏
            </p>
          </div>

          {/* Action: Save QR Code */}
          <div className="pt-1">
            <button
              id="btn-save-qr-code"
              type="button"
              onClick={handleSaveQRCode}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-75"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>QR Code Telah Disimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Menyimpan...' : 'Save QR Code'}</span>
                </>
              )}
            </button>
          </div>

          {/* Accordion: Cara Bayar Guna Galeri (How To Pay) */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/70 text-left transition-all">
            <button
              id="btn-how-to-pay-accordion"
              type="button"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              aria-expanded={isAccordionOpen}
              className="w-full py-2.5 px-3.5 flex items-center justify-between text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              <span>Cara Bayar Guna Galeri (How To Pay)</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAccordionOpen && (
              <div className="px-3.5 pb-3 pt-1 border-t border-zinc-200/80 space-y-1 text-xs text-zinc-600">
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 leading-relaxed font-normal">
                  <li>Save QR Code ke device.</li>
                  <li>Buka aplikasi banking / e-wallet.</li>
                  <li>Pilih fungsi QR payment atau scan from gallery.</li>
                  <li>Pilih QR yang telah disimpan.</li>
                  <li>Lengkapkan pembayaran mengikut langkah aplikasi bank / e-wallet.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Secondary Action: Kembali ke SYNCROZZ */}
          <div className="pt-1">
            <button
              id="btn-kembali-ke-syncrozz"
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              Kembali ke SYNCROZZ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
