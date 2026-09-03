import React, { useState } from 'react';
import { 
  MapPin, 
  Wifi, 
  Phone, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Building,
  UserCheck
} from 'lucide-react';
import { Course, VenueLogistics, WifiAccessConfig, SecretariatContact } from '../../types';

interface LogisticsTabProps {
  course: Course;
  onUpdateCourse: (updates: Partial<Course>) => void;
}

export const LogisticsTab: React.FC<LogisticsTabProps> = ({
  course,
  onUpdateCourse,
}) => {
  // Venue Logistics
  const initialVenue: VenueLogistics = course.venueDetails || {
    hallName: '',
    floorLevel: '',
    parkingInfo: 'Tempat letak kereta percuma disediakan di aras bawah tanah (B1-B2). Sila sahkan tiket di kaunter.',
    directions: '',
  };
  const [hallName, setHallName] = useState(initialVenue.hallName || '');
  const [floorLevel, setFloorLevel] = useState(initialVenue.floorLevel || '');
  const [parkingInfo, setParkingInfo] = useState(initialVenue.parkingInfo || '');
  const [directions, setDirections] = useState(initialVenue.directions || '');

  // Wi-Fi Access
  const initialWifi: WifiAccessConfig = course.wifiDetails || {
    ssid: '',
    password: '',
    instructions: 'Sambungkan peranti ke rangkaian dan masukkan kata laluan yang tertera.',
  };
  const [wifiSsid, setWifiSsid] = useState(initialWifi.ssid || '');
  const [wifiPassword, setWifiPassword] = useState(initialWifi.password || '');
  const [wifiInstructions, setWifiInstructions] = useState(initialWifi.instructions || '');

  // Secretariat Contacts
  const [contacts, setContacts] = useState<SecretariatContact[]>(course.contacts || []);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    setContacts([
      ...contacts,
      {
        id: 'cnt-' + Date.now(),
        name: newContactName.trim(),
        role: newContactRole.trim() || 'Pegawai Urus Setia',
        phone: newContactPhone.trim().replace(/\s+/g, ''),
        email: newContactEmail.trim(),
      }
    ]);

    setNewContactName('');
    setNewContactRole('');
    setNewContactPhone('');
    setNewContactEmail('');
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCourse({
      venueDetails: {
        hallName: hallName.trim(),
        floorLevel: floorLevel.trim(),
        parkingInfo: parkingInfo.trim(),
        directions: directions.trim(),
      },
      wifiDetails: {
        ssid: wifiSsid.trim(),
        password: wifiPassword.trim(),
        instructions: wifiInstructions.trim(),
      },
      contacts,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Save Bar */}
      <div className="bg-white border-2 border-zinc-900 p-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-zinc-900">
            Logistik, Akses Wi-Fi & Urus Setia
          </h3>
          <p className="text-xs text-zinc-600">
            Maklumat fasiliti lokasi dan talian bantuan peserta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Berjaya Disimpan!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 border-2 border-zinc-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Simpan Semua Tetapan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Venue Logistics */}
        <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <h4 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2 border-b border-zinc-200 pb-2">
            <Building className="w-4 h-4 text-zinc-800" />
            <span>1. Perincian Dewan & Tempat</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Nama Dewan / Bilik Kursus
              </label>
              <input
                type="text"
                value={hallName}
                onChange={(e) => setHallName(e.target.value)}
                placeholder="cth. Dewan Perdana"
                className="w-full p-2 text-xs border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Aras / Tingkat
              </label>
              <input
                type="text"
                value={floorLevel}
                onChange={(e) => setFloorLevel(e.target.value)}
                placeholder="cth. Aras 2"
                className="w-full p-2 text-xs border border-zinc-300 focus:outline-hidden focus:border-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Maklumat Tempat Letak Kereta & Validasi
            </label>
            <textarea
              value={parkingInfo}
              onChange={(e) => setParkingInfo(e.target.value)}
              rows={2}
              placeholder="Arahan parkir peserta..."
              className="w-full p-2 text-xs border border-zinc-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Panduan Arah & Pengangkutan Awam
            </label>
            <textarea
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={2}
              placeholder="cth. Berdekatan stesen LRT Dang Wangi & Monorel Bukit Nanas..."
              className="w-full p-2 text-xs border border-zinc-300"
            />
          </div>
        </div>

        {/* Section 2: Wi-Fi Access */}
        <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <h4 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2 border-b border-zinc-200 pb-2">
            <Wifi className="w-4 h-4 text-zinc-800" />
            <span>2. Akses Rangkaian Wi-Fi Kursus</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Nama Rangkaian (SSID)
              </label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="cth. TAMU_CONFERENCE"
                className="w-full p-2 text-xs border border-zinc-300 font-mono font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Kata Laluan Wi-Fi
              </label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="cth. Tamu@2026"
                className="w-full p-2 text-xs border border-zinc-300 font-mono font-bold text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">
              Arahan Tambahan Sambungan Wi-Fi
            </label>
            <textarea
              value={wifiInstructions}
              onChange={(e) => setWifiInstructions(e.target.value)}
              rows={3}
              placeholder="Arahan portal log masuk atau jika peranti memerlukan pendaftaran pelayar..."
              className="w-full p-2 text-xs border border-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Secretariat Contacts */}
      <div className="bg-white border-2 border-zinc-900 p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <h4 className="text-xs font-mono font-black uppercase text-zinc-600 flex items-center gap-2 border-b border-zinc-200 pb-2">
          <Phone className="w-4 h-4 text-zinc-800" />
          <span>3. Pegawai Urus Setia & Talian Bantuan ({contacts.length} Pegawai)</span>
        </h4>

        {/* Existing Contacts */}
        {contacts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-3 bg-zinc-50 border border-zinc-300 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-xs text-zinc-900">{contact.name}</div>
                  <div className="text-[11px] text-zinc-500 font-medium">{contact.role}</div>
                  <div className="text-xs font-mono text-blue-700 font-bold mt-1">
                    {contact.phone}
                  </div>
                  {contact.email && (
                    <div className="text-[10px] text-zinc-500">{contact.email}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveContact(contact.id)}
                  className="text-zinc-400 hover:text-red-600 p-1"
                  title="Padam Pegawai"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Contact Row */}
        <div className="bg-zinc-50 border border-zinc-200 p-3 space-y-2">
          <div className="text-xs font-bold text-zinc-700">Tambah Pegawai Urus Setia:</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Nama Pegawai"
              className="p-1.5 text-xs border border-zinc-300 bg-white"
            />
            <input
              type="text"
              value={newContactRole}
              onChange={(e) => setNewContactRole(e.target.value)}
              placeholder="Peranan (cth. Penyelaras Teknikal)"
              className="p-1.5 text-xs border border-zinc-300 bg-white"
            />
            <input
              type="text"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="No. Telefon (01X-XXXXXXX)"
              className="p-1.5 text-xs border border-zinc-300 bg-white font-mono"
            />
            <div className="flex gap-2">
              <input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="Emel (Pilihan)"
                className="flex-1 p-1.5 text-xs border border-zinc-300 bg-white"
              />
              <button
                type="button"
                onClick={handleAddContact}
                className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 shrink-0"
              >
                + Tambah
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
