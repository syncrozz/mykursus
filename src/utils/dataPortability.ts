/**
 * SYNCROZZ Platform — Data Safety, Portability & Audit Engine
 * Compliant with SYNCROZZ Engineering Standard (SES) v4.4 Locked
 *
 * Capabilities:
 * - Deterministic, UTF-8 encoded CSV Export (Simpan CSV / Eksport CSV)
 * - Multi-stage validated CSV Import (Select -> Validate -> Normalize -> Detect Duplicates -> Review -> Commit)
 * - Safe Phone / Contact handling with Scientific Notation expansion
 * - Non-destructive Duplicate Audit (Audit Duplikasi)
 * - Offline State Backup & Explicit-Only Restoration (Backup Data)
 */

import { Course, Participant, CourseEnrollment, ParticipantLifecycleStatus } from '../types';
import { normalizePhoneNumber, expandScientificNotation, formatPhoneNumber } from './phoneUtils';

export interface CSVParticipantRow {
  index: number;
  rawName: string;
  cleanName: string;
  rawPhone: string;
  normalizedPhone: string;
  salaryNumber: string;
  institutionOrAgency: string;
  designation: string;
  email: string;
  gender?: 'M' | 'F';
  roomNumber: string;
  roommateName: string;
  assignedGroup: string;
  specialRequirements: string;
  secretariatNotes: string;
  status: ParticipantLifecycleStatus;
  
  // Validation & Audit metadata
  isValid: boolean;
  validationErrors: string[];
  isInternalDuplicate: boolean;
  isExistingDuplicate: boolean;
  duplicateReason?: string;
  existingParticipantId?: string;
  isConflict: boolean;
  conflictReason?: string;
  selectedForImport: boolean;
}

export interface CSVImportValidationResult {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  conflictCount: number;
  invalidCount: number;
  detectedHeaders: string[];
  rows: CSVParticipantRow[];
}

export interface DuplicateCluster {
  id: string;
  matchType: 'PHONE' | 'SALARY' | 'EMAIL' | 'NAME';
  matchedValue: string;
  matchLabel: string;
  confidence: 'TINGGI' | 'SEDERHANA';
  reason: string;
  participants: Array<{
    participant: Participant;
    enrollment: CourseEnrollment;
  }>;
}

export interface DuplicateAuditResult {
  totalParticipants: number;
  totalClusters: number;
  totalDuplicateRecords: number;
  clusters: DuplicateCluster[];
  scannedAt: string;
}

export interface CourseBackupPayload {
  version: '4.4';
  platform: 'SYNCROZZ';
  backupType: 'COURSE_DATA_SNAPSHOT';
  createdAt: string;
  course: Course;
  participants: Participant[];
  enrollments: CourseEnrollment[];
  metadata: {
    totalParticipants: number;
    totalEnrollments: number;
    checksum: string;
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: CourseBackupPayload;
  summary?: {
    courseTitle: string;
    courseCode?: string;
    participantCount: number;
    enrollmentCount: number;
    createdAt: string;
  };
}

// --------------------------------------------------------------------------
// 1. DETERMINISTIC CSV EXPORT (Eksport CSV / Simpan CSV)
// --------------------------------------------------------------------------

/**
 * Escapes a single CSV cell value according to RFC 4180
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  // If value contains comma, quotes, newline, or carriage return, wrap in quotes and double internal quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Deterministically exports real participants of a course to standard CSV with UTF-8 BOM
 */
export function exportParticipantsToCSV(
  course: Course,
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>
): void {
  const headers = [
    'Nama Peserta',
    'No. Telefon',
    'No. Gaji / ID',
    'Institusi / Agensi',
    'Jawatan',
    'Emel',
    'Jantina',
    'Status Pendaftaran',
    'No. Bilik',
    'Rakan Sebilik',
    'Kumpulan',
    'Keperluan Khas',
    'Nota Urus Setia',
    'Tarikh Daftar'
  ];

  const headerLine = headers.map(h => escapeCsvCell(h)).join(',');

  const rows = enrollments.map(({ participant, enrollment }) => {
    return [
      escapeCsvCell(participant.name),
      escapeCsvCell(participant.phone),
      escapeCsvCell(participant.salaryNumber || enrollment.salaryNumber || ''),
      escapeCsvCell(participant.institutionOrAgency),
      escapeCsvCell(participant.designation || ''),
      escapeCsvCell(participant.email || ''),
      escapeCsvCell(participant.gender || ''),
      escapeCsvCell(enrollment.status),
      escapeCsvCell(enrollment.roomNumber || ''),
      escapeCsvCell(enrollment.roommateName || ''),
      escapeCsvCell(enrollment.assignedGroup || ''),
      escapeCsvCell(enrollment.specialRequirements || ''),
      escapeCsvCell(enrollment.secretariatNotes || ''),
      escapeCsvCell(enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString('ms-MY') : '')
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel and modern spreadsheets open Malay & international characters cleanly
  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const sanitizedCourseName = (course.code || course.slug || 'Kursus')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `Peserta_${sanitizedCourseName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --------------------------------------------------------------------------
// 2. PARSING & VALIDATION FOR IMPORT CSV (Select -> Validate -> Review -> Commit)
// --------------------------------------------------------------------------

/**
 * Parses raw CSV lines with support for quoted multiline strings and escaped quotes
 */
export function parseCsvRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Auto detect delimiter from first line (comma, tab, semicolon)
  const firstLine = cleanText.split('\n')[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t') && !firstLine.includes(',')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

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
      if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Push remaining cell & row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Thoroughly validates and normalizes imported CSV participant rows against existing course data
 */
export function validateAndParseParticipantsCSV(
  csvContent: string,
  existingEnrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>
): CSVImportValidationResult {
  const rawRows = parseCsvRows(csvContent);
  if (rawRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      conflictCount: 0,
      invalidCount: 0,
      detectedHeaders: [],
      rows: []
    };
  }

  // Extract header row
  const headerRow = rawRows[0];
  const detectedHeaders = headerRow;
  const normalizedHeaders = headerRow.map(h => 
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // Column index identification
  const colIndex = {
    name: normalizedHeaders.findIndex(h => h.includes('nama') || h.includes('peserta') || h.includes('name')),
    phone: normalizedHeaders.findIndex(h => h.includes('telefon') || h.includes('phone') || h.includes('tel') || h.includes('hp') || h.includes('bimbit') || h.includes('mobile')),
    salary: normalizedHeaders.findIndex(h => h.includes('gaji') || h.includes('staff') || h.includes('pekerja') || h.includes('ic') || h.includes('kadpengenalan') || h.includes('kp')),
    institution: normalizedHeaders.findIndex(h => h.includes('institusi') || h.includes('agensi') || h.includes('kolej') || h.includes('jabatan') || h.includes('cawangan') || h.includes('agency') || h.includes('college')),
    designation: normalizedHeaders.findIndex(h => h.includes('jawatan') || h.includes('gred') || h.includes('position') || h.includes('title')),
    email: normalizedHeaders.findIndex(h => h.includes('emel') || h.includes('email')),
    gender: normalizedHeaders.findIndex(h => h.includes('jantina') || h.includes('gender') || h.includes('sex')),
    status: normalizedHeaders.findIndex(h => h.includes('status')),
    room: normalizedHeaders.findIndex(h => h.includes('bilik') || h.includes('room')),
    roommate: normalizedHeaders.findIndex(h => h.includes('rakan') || h.includes('teman') || h.includes('roommate')),
    group: normalizedHeaders.findIndex(h => h.includes('kumpulan') || h.includes('group')),
    requirements: normalizedHeaders.findIndex(h => h.includes('keperluan') || h.includes('diet') || h.includes('alahan') || h.includes('special')),
    notes: normalizedHeaders.findIndex(h => h.includes('nota') || h.includes('catatan') || h.includes('secretariat')),
  };

  // Fallback heuristic: If name is not found, use first column
  if (colIndex.name === -1 && normalizedHeaders.length > 0) {
    colIndex.name = 0;
  }
  // If phone is not found, search first 5 data rows for a column containing phone-like digits
  if (colIndex.phone === -1) {
    for (let c = 0; c < normalizedHeaders.length; c++) {
      if (c === colIndex.name) continue;
      const sample = rawRows.slice(1, 6).map(r => r[c] || '');
      if (sample.some(s => {
        const norm = normalizePhoneNumber(s);
        return norm && norm.length >= 9;
      })) {
        colIndex.phone = c;
        break;
      }
    }
  }

  const rows: CSVParticipantRow[] = [];
  const seenPhonesInFile = new Map<string, number>(); // phone -> first row index
  const seenSalaryInFile = new Map<string, number>(); // salary -> first row index

  let validCount = 0;
  let duplicateCount = 0;
  let conflictCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const rawCols = rawRows[i];
    if (rawCols.length === 0 || (rawCols.length === 1 && !rawCols[0])) continue;

    const rawName = colIndex.name >= 0 ? (rawCols[colIndex.name] || '') : rawCols[0] || '';
    const rawPhoneVal = colIndex.phone >= 0 ? (rawCols[colIndex.phone] || '') : '';
    const rawSalary = colIndex.salary >= 0 ? (rawCols[colIndex.salary] || '') : '';
    const rawInst = colIndex.institution >= 0 ? (rawCols[colIndex.institution] || '') : '';
    const rawDesig = colIndex.designation >= 0 ? (rawCols[colIndex.designation] || '') : '';
    const rawEmail = colIndex.email >= 0 ? (rawCols[colIndex.email] || '') : '';
    const rawGenderVal = colIndex.gender >= 0 ? (rawCols[colIndex.gender] || '').toUpperCase() : '';
    const rawStatusVal = colIndex.status >= 0 ? (rawCols[colIndex.status] || '').toUpperCase() : '';
    const rawRoom = colIndex.room >= 0 ? (rawCols[colIndex.room] || '') : '';
    const rawRoommate = colIndex.roommate >= 0 ? (rawCols[colIndex.roommate] || '') : '';
    const rawGroup = colIndex.group >= 0 ? (rawCols[colIndex.group] || '') : '';
    const rawReqs = colIndex.requirements >= 0 ? (rawCols[colIndex.requirements] || '') : '';
    const rawNotes = colIndex.notes >= 0 ? (rawCols[colIndex.notes] || '') : '';

    // Ignore repeating header lines
    if (rawName.toLowerCase() === 'nama' || rawName.toLowerCase() === 'nama peserta') continue;

    // Normalizations
    const cleanName = rawName
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase())
      .join(' ');

    // Safe phone normalization handling scientific notation (e.g. 6.01971E+10) and text
    const expandedPhone = expandScientificNotation(rawPhoneVal);
    const normalizedPhone = normalizePhoneNumber(rawPhoneVal);

    // Gender detection
    let gender: 'M' | 'F' | undefined = undefined;
    if (rawGenderVal.startsWith('L') || rawGenderVal.startsWith('M') || rawGenderVal.includes('LELAKI')) {
      gender = 'M';
    } else if (rawGenderVal.startsWith('P') || rawGenderVal.startsWith('F') || rawGenderVal.includes('PEREMPUAN') || rawGenderVal.includes('WANITA')) {
      gender = 'F';
    }

    // Status detection
    let status: ParticipantLifecycleStatus = 'CONFIRMED';
    if (rawStatusVal.includes('ATTEND') || rawStatusVal.includes('HADIR')) status = 'ATTENDED';
    else if (rawStatusVal.includes('REG') || rawStatusVal.includes('DAFTAR')) status = 'REGISTERED';
    else if (rawStatusVal.includes('COMPLET') || rawStatusVal.includes('TAMAT')) status = 'COMPLETED';

    // Validation: Support either valid phone number OR valid salary number (staff ID)
    const validationErrors: string[] = [];
    if (!cleanName || cleanName.length < 2) {
      validationErrors.push('Nama peserta kosong atau tidak mencukupi.');
    }

    const hasValidPhone = Boolean(normalizedPhone && normalizedPhone.length >= 8);
    const cleanSalaryVal = rawSalary.trim();
    const hasValidSalary = Boolean(cleanSalaryVal && cleanSalaryVal.length >= 2);

    if (!hasValidPhone && !hasValidSalary) {
      validationErrors.push('Perlu sekurang-kurangnya No. Telefon atau No. Gaji / ID untuk pengenalan peserta.');
    }

    // Duplicate detection in file
    let isInternalDuplicate = false;
    let duplicateReason: string | undefined;

    if (normalizedPhone) {
      if (seenPhonesInFile.has(normalizedPhone)) {
        isInternalDuplicate = true;
        duplicateReason = `No. telefon sama dengan baris #${seenPhonesInFile.get(normalizedPhone)} dalam fail ini.`;
      } else {
        seenPhonesInFile.set(normalizedPhone, i);
      }
    }

    if (!isInternalDuplicate && cleanSalaryVal) {
      const salKey = cleanSalaryVal.toLowerCase();
      if (seenSalaryInFile.has(salKey)) {
        isInternalDuplicate = true;
        duplicateReason = `No. gaji / ID sama dengan baris #${seenSalaryInFile.get(salKey)} dalam fail ini.`;
      } else {
        seenSalaryInFile.set(salKey, i);
      }
    }

    // Duplicate & Conflict detection against existing course enrollments
    let isExistingDuplicate = false;
    let existingParticipantId: string | undefined;
    let isConflict = false;
    let conflictReason: string | undefined;

    const existingMatch = existingEnrollments.find(e => {
      const existingNormPhone = normalizePhoneNumber(e.participant.phone);
      const isPhoneMatch = Boolean(normalizedPhone && existingNormPhone && existingNormPhone === normalizedPhone);
      const existingSal = (e.participant.salaryNumber || e.enrollment.salaryNumber || '').trim().toLowerCase();
      const isSalaryMatch = Boolean(cleanSalaryVal && existingSal && cleanSalaryVal.toLowerCase() === existingSal);
      return isPhoneMatch || isSalaryMatch;
    });

    if (existingMatch) {
      isExistingDuplicate = true;
      existingParticipantId = existingMatch.participant.id;
      
      // Determine if it's an identical re-import or a conflict
      const nameMismatch = cleanName.toLowerCase() !== existingMatch.participant.name.toLowerCase();
      const instMismatch = rawInst && existingMatch.participant.institutionOrAgency && 
        rawInst.toLowerCase() !== existingMatch.participant.institutionOrAgency.toLowerCase();

      if (nameMismatch) {
        isConflict = true;
        const identifierLabel = normalizedPhone 
          ? `No. telefon (${formatPhoneNumber(normalizedPhone)})` 
          : `No. gaji (${cleanSalaryVal})`;
        conflictReason = `Konflik: ${identifierLabel} sepadan dengan "${existingMatch.participant.name}", tetapi nama dalam fail ialah "${cleanName}".`;
      } else {
        duplicateReason = `Peserta telah sedia ada dalam kursus ini ("${existingMatch.participant.name}").`;
      }
    }

    const isValid = validationErrors.length === 0;
    if (!isValid) invalidCount++;
    else if (isConflict) conflictCount++;
    else if (isInternalDuplicate || isExistingDuplicate) duplicateCount++;
    else validCount++;

    rows.push({
      index: i,
      rawName,
      cleanName,
      rawPhone: expandedPhone || rawPhoneVal,
      normalizedPhone,
      salaryNumber: rawSalary.trim(),
      institutionOrAgency: rawInst.trim() || 'Kolej / Agensi Berkenaan',
      designation: rawDesig.trim(),
      email: rawEmail.trim().toLowerCase(),
      gender,
      roomNumber: rawRoom.trim(),
      roommateName: rawRoommate.trim(),
      assignedGroup: rawGroup.trim(),
      specialRequirements: rawReqs.trim(),
      secretariatNotes: rawNotes.trim(),
      status,
      isValid,
      validationErrors,
      isInternalDuplicate,
      isExistingDuplicate,
      duplicateReason,
      existingParticipantId,
      isConflict,
      conflictReason,
      // By default select valid, non-duplicate rows for import
      selectedForImport: isValid && !isInternalDuplicate && !isExistingDuplicate && !isConflict
    });
  }

  return {
    totalRows: rows.length,
    validCount,
    duplicateCount,
    conflictCount,
    invalidCount,
    detectedHeaders,
    rows
  };
}

// --------------------------------------------------------------------------
// 3. AUDIT DUPLIKASI (Non-destructive duplicate detection)
// --------------------------------------------------------------------------

/**
 * Scans course enrollments for duplicates across meaningful fields:
 * - Phone numbers (normalized)
 * - Salary number / ID
 * - Email address
 * - Cleaned names
 *
 * CRITICAL: Non-destructive! Detection & Review ONLY. Never automatically modifies data.
 */
export function auditCourseDuplicates(
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>
): DuplicateAuditResult {
  const clusters: DuplicateCluster[] = [];
  const processedPairIds = new Set<string>();

  // 1. Check Phone Matches (High Confidence)
  const phoneMap = new Map<string, Array<{ participant: Participant; enrollment: CourseEnrollment }>>();
  enrollments.forEach(item => {
    const norm = normalizePhoneNumber(item.participant.phone);
    if (norm && norm.length >= 8) {
      if (!phoneMap.has(norm)) phoneMap.set(norm, []);
      phoneMap.get(norm)!.push(item);
    }
  });

  phoneMap.forEach((list, phone) => {
    if (list.length > 1) {
      const clusterId = `cluster-phone-${phone}`;
      clusters.push({
        id: clusterId,
        matchType: 'PHONE',
        matchedValue: phone,
        matchLabel: `No. Telefon Sepadan (${formatPhoneNumber(phone)})`,
        confidence: 'TINGGI',
        reason: `${list.length} rekod peserta berkongsi nombor telefon yang sama (${phone}).`,
        participants: list
      });
      list.forEach(item => processedPairIds.add(item.participant.id));
    }
  });

  // 2. Check Salary / Employee Number Matches (High Confidence)
  const salaryMap = new Map<string, Array<{ participant: Participant; enrollment: CourseEnrollment }>>();
  enrollments.forEach(item => {
    const salary = (item.participant.salaryNumber || item.enrollment.salaryNumber || '').trim().toLowerCase();
    if (salary && salary !== '-' && salary !== 'tiada' && salary.length >= 3) {
      if (!salaryMap.has(salary)) salaryMap.set(salary, []);
      salaryMap.get(salary)!.push(item);
    }
  });

  salaryMap.forEach((list, salary) => {
    if (list.length > 1) {
      const clusterId = `cluster-salary-${salary}`;
      // Avoid duplicate cluster if identical participants already grouped by phone
      const alreadyGrouped = clusters.some(c => 
        c.participants.length === list.length && 
        c.participants.every(p => list.some(l => l.participant.id === p.participant.id))
      );
      if (!alreadyGrouped) {
        clusters.push({
          id: clusterId,
          matchType: 'SALARY',
          matchedValue: salary,
          matchLabel: `No. Gaji/ID Sepadan (${salary.toUpperCase()})`,
          confidence: 'TINGGI',
          reason: `${list.length} rekod berkongsi nombor gaji/pengenalan yang sama (${salary.toUpperCase()}).`,
          participants: list
        });
      }
    }
  });

  // 3. Check Email Matches (High Confidence)
  const emailMap = new Map<string, Array<{ participant: Participant; enrollment: CourseEnrollment }>>();
  enrollments.forEach(item => {
    const email = (item.participant.email || '').trim().toLowerCase();
    if (email && email.includes('@') && !email.includes('unknown') && !email.includes('test')) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(item);
    }
  });

  emailMap.forEach((list, email) => {
    if (list.length > 1) {
      const alreadyGrouped = clusters.some(c => 
        c.participants.length === list.length && 
        c.participants.every(p => list.some(l => l.participant.id === p.participant.id))
      );
      if (!alreadyGrouped) {
        clusters.push({
          id: `cluster-email-${email}`,
          matchType: 'EMAIL',
          matchedValue: email,
          matchLabel: `Emel Sepadan (${email})`,
          confidence: 'TINGGI',
          reason: `${list.length} rekod berkongsi alamat emel rasmi yang sama.`,
          participants: list
        });
      }
    }
  });

  // 4. Check Normalized Exact Name Matches (Medium Confidence if phones differ)
  const nameMap = new Map<string, Array<{ participant: Participant; enrollment: CourseEnrollment }>>();
  enrollments.forEach(item => {
    const clean = item.participant.name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean && clean.length >= 3) {
      if (!nameMap.has(clean)) nameMap.set(clean, []);
      nameMap.get(clean)!.push(item);
    }
  });

  nameMap.forEach((list, cleanName) => {
    if (list.length > 1) {
      const alreadyGrouped = clusters.some(c => 
        c.participants.length === list.length && 
        c.participants.every(p => list.some(l => l.participant.id === p.participant.id))
      );
      if (!alreadyGrouped) {
        clusters.push({
          id: `cluster-name-${cleanName.replace(/[^a-z0-9]/g, '')}`,
          matchType: 'NAME',
          matchedValue: cleanName,
          matchLabel: `Nama Tepat Sepadan`,
          confidence: 'SEDERHANA',
          reason: `${list.length} rekod mempunyai nama peserta yang serupa tetapi maklumat telefon/institusi mungkin berbeza.`,
          participants: list
        });
      }
    }
  });

  const duplicateRecordIds = new Set<string>();
  clusters.forEach(c => {
    c.participants.forEach(p => duplicateRecordIds.add(p.participant.id));
  });

  return {
    totalParticipants: enrollments.length,
    totalClusters: clusters.length,
    totalDuplicateRecords: duplicateRecordIds.size,
    clusters,
    scannedAt: new Date().toISOString()
  };
}

// --------------------------------------------------------------------------
// 4. OFFLINE BACKUP DATA & RESTORATION (Backup Data)
// --------------------------------------------------------------------------

/**
 * Creates an offline portable JSON backup of the current course application state
 */
export function createCourseBackup(
  course: Course,
  enrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>
): void {
  const participants = enrollments.map(e => e.participant);
  const rawEnrollments = enrollments.map(e => e.enrollment);

  const payload: CourseBackupPayload = {
    version: '4.4',
    platform: 'SYNCROZZ',
    backupType: 'COURSE_DATA_SNAPSHOT',
    createdAt: new Date().toISOString(),
    course,
    participants,
    enrollments: rawEnrollments,
    metadata: {
      totalParticipants: participants.length,
      totalEnrollments: rawEnrollments.length,
      checksum: `syncrozz-${course.id}-${Date.now().toString(36)}`
    }
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const courseCode = (course.code || course.slug || 'Kursus').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  link.setAttribute('href', url);
  link.setAttribute('download', `Backup_Data_${courseCode}_${timestamp}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates a backup file before restoration.
 * NEVER automatically restores data. Restoration requires explicit user action.
 */
export function validateBackupFile(rawJson: string): BackupValidationResult {
  try {
    const data = JSON.parse(rawJson);
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Fail sandaran tidak mengandungi format JSON yang sah.'] };
    }

    if (!data.course || !data.course.id || !data.course.title) {
      errors.push('Maklumat kursus dalam sandaran tidak lengkap atau hilang.');
    }

    if (!Array.isArray(data.participants)) {
      errors.push('Struktur data peserta tidak sah.');
    }

    if (!Array.isArray(data.enrollments)) {
      errors.push('Struktur data pendaftaran kursus tidak sah.');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      payload: data as CourseBackupPayload,
      summary: {
        courseTitle: data.course.title,
        courseCode: data.course.code,
        participantCount: data.participants.length,
        enrollmentCount: data.enrollments.length,
        createdAt: data.createdAt || 'Tarikh tidak diketahui'
      }
    };
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Ralat membaca fail sandaran: ${err.message || 'Format rosak.'}`]
    };
  }
}
