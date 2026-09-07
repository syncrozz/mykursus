import { Course, ScheduleDay, SessionItem } from '../types';

/**
 * Escapes CSV values conforming to RFC 4180
 */
function escapeCsv(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).trim();
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Parses raw CSV string handling quotes and various line endings
 */
export function parseRawCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Auto-detect delimiter from first non-empty line (comma, semicolon, tab)
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount > semiCount ? '\t' : (semiCount > commaCount ? ';' : ',');

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentCell.trim());
      // Only push non-empty row
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes time string to standard "HH:MM" (24-hour format)
 */
export function normalizeTimeFormat(timeStr: string): string | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase().replace(/\./g, ':');

  // Match 12-hour format with AM/PM (e.g. "8:30 AM", "2:00 PM", "08:30AM")
  const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Match 24-hour format (e.g. "8:30", "08:30", "14:00")
  const standardMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (standardMatch) {
    const hours = parseInt(standardMatch[1], 10);
    const minutes = standardMatch[2];
    if (hours >= 0 && hours <= 23 && parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
}

/**
 * Detects if a slot is break/meal based on flag or title keywords
 */
export function detectIsBreakOrMeal(typeStr?: string, title?: string): boolean {
  if (typeStr) {
    const lower = typeStr.trim().toLowerCase();
    if (['rehat', 'makan', 'minum', 'solat', 'kudapan', 'break', 'meal', 'lunch', 'dinner', 'tea', 'ya', 'yes', 'true', '1'].includes(lower)) {
      return true;
    }
    if (['sesi', 'ceramah', 'bengkel', 'slot', 'tidak', 'no', 'false', '0'].includes(lower)) {
      return false;
    }
  }

  if (title) {
    const lowerTitle = title.toLowerCase();
    const breakKeywords = [
      'rehat', 'minum pagi', 'minum petang', 'makan tengah hari', 'makan malam', 
      'solat', 'kudapan', 'tea break', 'lunch break', 'dinner break', 'coffee break'
    ];
    return breakKeywords.some(k => lowerTitle.includes(k));
  }

  return false;
}

export interface CSVSlotRow {
  index: number;
  dayNumber: number;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  facilitatorName: string;
  location: string;
  isBreakOrMeal: boolean;
  presentationUrl: string;
  materialsNote: string;
  rawDate?: string;
  status: 'VALID' | 'WARNING' | 'INVALID';
  errors: string[];
  warnings: string[];
}

export interface CSVSlotValidationResult {
  totalRows: number;
  validCount: number;
  warningCount: number;
  invalidCount: number;
  rows: CSVSlotRow[];
  detectedDays: Array<{ dayNumber: number; date?: string; sessionCount: number }>;
}

/**
 * Validates and normalizes raw CSV content into validated CSVSlotRow items
 */
export function validateAndParseSessionsCSV(
  csvContent: string,
  course: Course,
  existingDays: ScheduleDay[],
  existingSessions: SessionItem[],
  defaultDayNumber: number = 1
): CSVSlotValidationResult {
  const rawRows = parseRawCsv(csvContent);
  if (rawRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      invalidCount: 0,
      rows: [],
      detectedDays: [],
    };
  }

  const headerRow = rawRows[0].map(h => h.trim().toLowerCase());
  const dataRows = rawRows.slice(1);

  // Column index detector
  const findCol = (keys: string[]): number => {
    return headerRow.findIndex(h => keys.some(k => h.includes(k)));
  };

  const colDay = findCol(['hari', 'day']);
  const colDate = findCol(['tarikh', 'date']);
  const colSessionNo = findCol(['no. sesi', 'no sesi', 'sesi no', 'session no', 'slot no', 'bil']);
  const colStart = findCol(['mula', 'start']);
  const colEnd = findCol(['tamat', 'end', 'akhir']);
  const colTitle = findCol(['tajuk', 'title', 'nama sesi', 'aktiviti', 'perkara', 'agenda']);
  const colFacilitator = findCol(['penceramah', 'fasilitator', 'speaker', 'facilitator', 'tenaga pengajar', 'jurulatih']);
  const colLocation = findCol(['lokasi', 'tempat', 'bilik', 'dewan', 'venue', 'location']);
  const colType = findCol(['jenis', 'type', 'kategori', 'category', 'rehat', 'break']);
  const colDesc = findCol(['penerangan', 'sinopsis', 'description', 'keterangan', 'maklumat']);
  const colUrl = findCol(['pautan', 'url', 'link', 'slaid', 'slides', 'bahan']);
  const colNotes = findCol(['nota', 'catatan', 'note', 'keperluan']);

  const parsedRows: CSVSlotRow[] = [];
  const dayCounters: Record<number, number> = {};

  dataRows.forEach((row, idx) => {
    if (row.length === 0 || row.every(cell => !cell.trim())) {
      return; // Skip empty rows
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Day Number resolution
    let dayNum = defaultDayNumber;
    const rawDayVal = colDay >= 0 ? row[colDay] : '';
    const rawDateVal = colDate >= 0 ? row[colDate] : '';

    if (rawDayVal) {
      const match = rawDayVal.match(/\d+/);
      if (match) {
        dayNum = parseInt(match[0], 10);
      }
    } else if (rawDateVal) {
      // Try match date with existing days
      const matchedDay = existingDays.find(d => d.date === rawDateVal.trim());
      if (matchedDay) {
        dayNum = matchedDay.dayNumber;
      }
    }

    if (dayNum < 1) dayNum = 1;

    // 2. Session number resolution
    let sessionNum = 0;
    const rawSessNo = colSessionNo >= 0 ? row[colSessionNo] : '';
    if (rawSessNo && /\d+/.test(rawSessNo)) {
      sessionNum = parseInt(rawSessNo.replace(/\D/g, ''), 10);
    } else {
      dayCounters[dayNum] = (dayCounters[dayNum] || 0) + 1;
      sessionNum = dayCounters[dayNum];
    }

    // 3. Time resolution
    const rawStart = colStart >= 0 ? row[colStart] : '';
    const rawEnd = colEnd >= 0 ? row[colEnd] : '';

    const startTime = normalizeTimeFormat(rawStart);
    const endTime = normalizeTimeFormat(rawEnd);

    if (!rawStart) {
      errors.push('Masa mula tidak diisi.');
    } else if (!startTime) {
      errors.push(`Format masa mula "${rawStart}" tidak sah (gunakan format cth: 08:30 atau 2:30 PM).`);
    }

    if (!rawEnd) {
      errors.push('Masa tamat tidak diisi.');
    } else if (!endTime) {
      errors.push(`Format masa tamat "${rawEnd}" tidak sah (gunakan format cth: 10:30 atau 4:30 PM).`);
    }

    if (startTime && endTime && startTime >= endTime) {
      warnings.push(`Masa tamat (${endTime}) adalah sebelum atau sama dengan masa mula (${startTime}).`);
    }

    // 4. Title resolution
    const title = (colTitle >= 0 ? row[colTitle] : '') || '';
    if (!title.trim()) {
      errors.push('Tajuk sesi / slot wajib diisi.');
    }

    // 5. Break / Meal detection
    const rawType = colType >= 0 ? row[colType] : '';
    const isBreak = detectIsBreakOrMeal(rawType, title);

    // 6. Other fields
    const facilitator = (colFacilitator >= 0 ? row[colFacilitator] : '').trim();
    const location = (colLocation >= 0 ? row[colLocation] : '').trim() || (course.venueDetails?.hallName || '');
    const description = (colDesc >= 0 ? row[colDesc] : '').trim();
    let presentationUrl = (colUrl >= 0 ? row[colUrl] : '').trim();
    if (presentationUrl && !/^https?:\/\//i.test(presentationUrl)) {
      presentationUrl = 'https://' + presentationUrl;
    }
    const materialsNote = (colNotes >= 0 ? row[colNotes] : '').trim();

    // Determine status
    let status: 'VALID' | 'WARNING' | 'INVALID' = 'VALID';
    if (errors.length > 0) {
      status = 'INVALID';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    parsedRows.push({
      index: idx + 1,
      dayNumber: dayNum,
      sessionNumber: sessionNum,
      startTime: startTime || rawStart || '08:30',
      endTime: endTime || rawEnd || '10:30',
      title: title.trim(),
      description,
      facilitatorName: facilitator,
      location,
      isBreakOrMeal: isBreak,
      presentationUrl,
      materialsNote,
      rawDate: rawDateVal.trim() || undefined,
      status,
      errors,
      warnings,
    });
  });

  // Calculate detected days
  const dayMap: Record<number, { count: number; date?: string }> = {};
  parsedRows.forEach(r => {
    if (!dayMap[r.dayNumber]) {
      dayMap[r.dayNumber] = { count: 0, date: r.rawDate };
    }
    dayMap[r.dayNumber].count++;
    if (r.rawDate && !dayMap[r.dayNumber].date) {
      dayMap[r.dayNumber].date = r.rawDate;
    }
  });

  const detectedDays = Object.keys(dayMap).map(k => {
    const dNum = parseInt(k, 10);
    const existing = existingDays.find(d => d.dayNumber === dNum);
    return {
      dayNumber: dNum,
      date: existing?.date || dayMap[dNum].date,
      sessionCount: dayMap[dNum].count,
    };
  }).sort((a, b) => a.dayNumber - b.dayNumber);

  return {
    totalRows: parsedRows.length,
    validCount: parsedRows.filter(r => r.status === 'VALID').length,
    warningCount: parsedRows.filter(r => r.status === 'WARNING').length,
    invalidCount: parsedRows.filter(r => r.status === 'INVALID').length,
    rows: parsedRows,
    detectedDays,
  };
}

/**
 * Deterministically exports sessions to CSV with UTF-8 BOM
 */
export function exportSessionsToCSV(
  course: Course,
  sessions: SessionItem[],
  scheduleDays: ScheduleDay[],
  targetDayNumber?: number
): void {
  const filteredSessions = targetDayNumber !== undefined
    ? sessions.filter(s => s.dayNumber === targetDayNumber)
    : [...sessions];

  // Sort by dayNumber, then startTime
  filteredSessions.sort((a, b) => {
    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
    return a.startTime.localeCompare(b.startTime);
  });

  const headers = [
    'Hari',
    'Tarikh',
    'No. Sesi',
    'Masa Mula',
    'Masa Tamat',
    'Tajuk Sesi',
    'Penceramah / Fasilitator',
    'Lokasi',
    'Jenis Sesi',
    'Penerangan / Sinopsis',
    'Pautan Slaid / Dokumen',
    'Nota Bahan'
  ];

  const headerLine = headers.map(h => escapeCsv(h)).join(',');

  const rows = filteredSessions.map(s => {
    const dayObj = scheduleDays.find(d => d.dayNumber === s.dayNumber);
    const dateStr = dayObj ? dayObj.date : '';
    const typeLabel = s.isBreakOrMeal ? 'Rehat / Makan' : 'Sesi Pengajaran';

    return [
      escapeCsv(`Hari ${s.dayNumber}`),
      escapeCsv(dateStr),
      escapeCsv(s.sessionNumber),
      escapeCsv(s.startTime),
      escapeCsv(s.endTime),
      escapeCsv(s.title),
      escapeCsv(s.facilitatorName || ''),
      escapeCsv(s.location || ''),
      escapeCsv(typeLabel),
      escapeCsv(s.description || ''),
      escapeCsv(s.presentationUrl || ''),
      escapeCsv(s.materialsNote || '')
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const coursePrefix = (course.code || course.slug || 'Kursus')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 25);
  const daySuffix = targetDayNumber !== undefined ? `_Hari${targetDayNumber}` : '_SemuaHari';
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `Jadual_Slot_${coursePrefix}${daySuffix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a ready-to-fill CSV template with realistic benchmark sample data
 */
export function downloadSessionCsvTemplate(course: Course, scheduleDays: ScheduleDay[]): void {
  const headers = [
    'Hari',
    'Tarikh',
    'No. Sesi',
    'Masa Mula',
    'Masa Tamat',
    'Tajuk Sesi',
    'Penceramah / Fasilitator',
    'Lokasi',
    'Jenis Sesi',
    'Penerangan / Sinopsis',
    'Pautan Slaid / Dokumen',
    'Nota Bahan'
  ];

  const defaultHall = course.venueDetails?.hallName || 'Dewan Utama';
  const day1Date = scheduleDays[0]?.date || course.startDate || '2026-09-09';
  const day2Date = scheduleDays[1]?.date || course.endDate || '2026-09-10';

  const sampleRows = [
    [
      'Hari 1',
      day1Date,
      '1',
      '08:00',
      '08:30',
      'Pendaftaran Peserta & Pengesahan Hadir',
      'Urus Setia Pendaftaran',
      `Foyer ${defaultHall}`,
      'Sesi',
      'Pendaftaran peserta, pengedaran kit kursus dan lencana nama rasmi.',
      '',
      'Bawa surat panggilan kursus rasmi.'
    ],
    [
      'Hari 1',
      day1Date,
      '2',
      '08:30',
      '10:30',
      'Sesi 1: Taklimat Pengenalan & Hala Tuju Transformasi',
      'Prof. Madya Dr. Norhafizah Ismail',
      defaultHall,
      'Sesi',
      'Pendedahan mengenai keperluan transformasi pedagogi dan penjajaran kurikulum.',
      'https://example.com/slides-sesi1.pdf',
      'Peserta perlu membawa komputer riba.'
    ],
    [
      'Hari 1',
      day1Date,
      '3',
      '10:30',
      '11:00',
      'Minum Pagi & Rehat',
      'Kafe Urus Setia',
      'Kafe Tamu Aras 2',
      'Rehat',
      'Kudapan pagi disediakan oleh pihak hotel.',
      '',
      ''
    ],
    [
      'Hari 1',
      day1Date,
      '4',
      '11:00',
      '13:00',
      'Sesi 2: Bengkel Hands-On Kaedah PBL Aktif',
      'En. Khairul Azman Razali',
      defaultHall,
      'Sesi',
      'Aktiviti berpusatkan pelajar dengan pembinaan rubrik penilaian formatif.',
      'https://example.com/template-rubrik.docx',
      'Sediakan contoh soalan tugasan semester semasa.'
    ],
    [
      'Hari 1',
      day1Date,
      '5',
      '13:00',
      '14:30',
      'Makan Tengah Hari & Solat Zohor',
      '',
      'Restoran Aras 1 & Surau',
      'Rehat',
      'Makan tengah hari bufet dan waktu solat berjemaah.',
      '',
      ''
    ],
    [
      'Hari 2',
      day2Date,
      '1',
      '08:30',
      '10:30',
      'Sesi 3: Integrasi Teknologi Digital & AI dalam Kelas',
      'Ts. Ahmad Firdaus',
      defaultHall,
      'Sesi',
      'Demonstrasi alatan interaktif dan platform pembelajaran berasaskan awan.',
      'https://example.com/ai-tools-guide.pdf',
      'Pastikan akaun pelantar digital sedia didaftarkan.'
    ]
  ];

  const headerLine = headers.map(h => escapeCsv(h)).join(',');
  const rowLines = sampleRows.map(r => r.map(c => escapeCsv(c)).join(','));

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `Templat_Import_Slot_Jadual_${course.code || 'MyKursus'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
