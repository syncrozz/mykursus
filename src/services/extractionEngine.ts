import { 
  SourceDocument, 
  Course, 
  ExtractedPayload, 
  ExtractedField, 
  ExtractedParticipantRow, 
  ExtractedSessionItem,
  ExtractionConfidence,
  Participant,
  CourseEnrollment,
  ApprovalStatus 
} from '../types';
import { normalizePhoneNumber } from '../utils/phoneUtils';

/**
 * Smart Data Extraction Engine for MyKursus (Universal Course Platform)
 * 
 * Flow: SOURCE → EXTRACT → STRUCTURE → REVIEW → APPROVE → PUBLISH
 * Principle: Extracted data is strictly PROPOSED data. It never silently overwrites authoritative data.
 */

// Month map for Malay/English date parsing
const MONTH_MAP: Record<string, string> = {
  januari: '01', jan: '01', january: '01',
  februari: '02', feb: '02', february: '02',
  mac: '03', mar: '03', march: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  jun: '06', june: '06',
  julai: '07', jul: '07', july: '07',
  ogos: '08', aug: '08', august: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', okt: '10', oct: '10', october: '10',
  november: '11', nov: '11',
  disember: '12', dis: '12', dec: '12', december: '12',
};

/**
 * Parses date ranges like:
 * "9 - 11 September 2026"
 * "9 hingga 11 September 2026"
 * "09/09/2026 to 11/09/2026"
 * "2026-09-09 to 2026-09-11"
 */
function parseDateRange(text: string): { start?: string; end?: string; raw?: string } {
  // Pattern 1: "9 - 11 September 2026" or "9 hingga 11 September 2026"
  const malayRangeRegex = /(\d{1,2})\s*(?:-|hingga|to)\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
  const match1 = text.match(malayRangeRegex);
  if (match1) {
    const startDay = match1[1].padStart(2, '0');
    const endDay = match1[2].padStart(2, '0');
    const monthName = match1[3].toLowerCase();
    const year = match1[4];
    const monthNum = MONTH_MAP[monthName];
    if (monthNum) {
      return {
        start: `${year}-${monthNum}-${startDay}`,
        end: `${year}-${monthNum}-${endDay}`,
        raw: match1[0]
      };
    }
  }

  // Pattern 2: ISO dates "2026-09-09"
  const isoRegex = /(\d{4}-\d{2}-\d{2})\s*(?:-|hingga|to)\s*(\d{4}-\d{2}-\d{2})/;
  const match2 = text.match(isoRegex);
  if (match2) {
    return {
      start: match2[1],
      end: match2[2],
      raw: match2[0]
    };
  }

  // Pattern 3: Single date "9 September 2026"
  const singleDateRegex = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
  const match3 = text.match(singleDateRegex);
  if (match3) {
    const day = match3[1].padStart(2, '0');
    const monthNum = MONTH_MAP[match3[2].toLowerCase()];
    const year = match3[3];
    if (monthNum) {
      const d = `${year}-${monthNum}-${day}`;
      return { start: d, end: d, raw: match3[0] };
    }
  }

  return {};
}

/**
 * Normalize text content: strip excess carriage returns and uniform line endings
 */
function cleanText(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export class ExtractionEngine {
  /**
   * Main entry point to extract structured course data from a SourceDocument
   */
  public static extractFromDocument(
    doc: SourceDocument, 
    currentCourse: Course,
    existingEnrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }> = [],
    existingSessions: any[] = []
  ): ExtractedPayload {
    const rawText = (doc.rawText || '').trim();
    if (!rawText) {
      return {
        fields: [],
        sessions: [],
        participants: [],
        summary: {
          totalFieldsExtracted: 0,
          totalSessionsExtracted: 0,
          totalParticipantsExtracted: 0,
          highConfidenceCount: 0,
          conflictCount: 0,
        }
      };
    }

    const fields: ExtractedField<any>[] = [];
    const sessions: ExtractedSessionItem[] = [];
    let participants: ExtractedParticipantRow[] = [];
    let detectedColumns: string[] | undefined;

    // Detect if this is a tabular/CSV document or participant list
    const isCsvOrTabular = doc.fileType === 'CSV' || 
      doc.category === 'PARTICIPANT_LIST' || 
      rawText.includes(',') || 
      rawText.includes('\t') ||
      rawText.toLowerCase().includes('nama') && rawText.toLowerCase().includes('telefon');

    if (isCsvOrTabular) {
      const parsedTabular = this.extractParticipantsFromTabular(rawText, existingEnrollments);
      if (parsedTabular.rows.length > 0) {
        participants = parsedTabular.rows;
        detectedColumns = parsedTabular.columns;
      }
    }

    // Extract Course Information & Logistics
    this.extractCourseMetadata(rawText, currentCourse, fields);

    // Extract Schedule & Sessions
    this.extractSessions(rawText, existingSessions, sessions);

    // Calculate Summary Metrics
    let conflictCount = 0;
    let highConfidenceCount = 0;

    fields.forEach(f => {
      if (f.isConflict) conflictCount++;
      if (f.confidence === 'HIGH') highConfidenceCount++;
    });

    sessions.forEach(s => {
      if (s.confidence === 'HIGH') highConfidenceCount++;
    });

    participants.forEach(p => {
      if (p.isDuplicate) conflictCount++;
      if (p.confidence === 'HIGH') highConfidenceCount++;
    });

    return {
      fields,
      sessions,
      participants,
      detectedColumns,
      summary: {
        totalFieldsExtracted: fields.length,
        totalSessionsExtracted: sessions.length,
        totalParticipantsExtracted: participants.length,
        highConfidenceCount,
        conflictCount,
      }
    };
  }

  /**
   * Extracts Course and Logistics metadata fields
   */
  private static extractCourseMetadata(
    text: string, 
    currentCourse: Course, 
    fields: ExtractedField<any>[]
  ): void {
    const isApprovedOrSubmitted = 
      currentCourse.approvalStatus === ApprovalStatus.APPROVED || 
      currentCourse.approvalStatus === ApprovalStatus.SUBMITTED;

    const lines = text.split('\n');

    // 1. Course Title
    const titleRegex = /(?:tajuk|perkara|kursus|bengkel|nama kursus)\s*:\s*([^\n\r]+)/i;
    const titleMatch = text.match(titleRegex);
    if (titleMatch && titleMatch[1].trim().length > 3) {
      const val = titleMatch[1].trim();
      const current = currentCourse.title;
      const isConflict = Boolean(current && current.trim().toLowerCase() !== val.toLowerCase());
      fields.push({
        fieldKey: 'title',
        fieldLabel: 'Tajuk Kursus',
        category: 'COURSE',
        extractedValue: val,
        currentValue: current,
        confidence: 'HIGH',
        sourceSnippet: titleMatch[0],
        isConflict,
        status: 'PENDING'
      });
    }

    // 2. Course Code
    const codeRegex = /(?:kod|kod kursus|kursus kod)\s*:\s*([A-Za-z0-9_-]+)/i;
    const codeMatch = text.match(codeRegex);
    if (codeMatch && codeMatch[1].trim()) {
      const val = codeMatch[1].trim();
      const current = currentCourse.code || '';
      const isConflict = Boolean(current && current.trim().toLowerCase() !== val.toLowerCase());
      fields.push({
        fieldKey: 'code',
        fieldLabel: 'Kod Kursus',
        category: 'COURSE',
        extractedValue: val,
        currentValue: current || '(Kosong)',
        confidence: 'HIGH',
        sourceSnippet: codeMatch[0],
        isConflict,
        status: 'PENDING'
      });
    } else {
      // Fallback: look for MPU codes like MPU2412 or similar standard course codes
      const standaloneCode = text.match(/\b([A-Z]{2,4}\d{3,4}[A-Z]?)\b/);
      if (standaloneCode && standaloneCode[1] !== currentCourse.code) {
        fields.push({
          fieldKey: 'code',
          fieldLabel: 'Kod Kursus (Dikesan)',
          category: 'COURSE',
          extractedValue: standaloneCode[1],
          currentValue: currentCourse.code || '(Kosong)',
          confidence: 'MEDIUM',
          sourceSnippet: `Dikesan dalam teks: "${standaloneCode[1]}"`,
          isConflict: Boolean(currentCourse.code && currentCourse.code !== standaloneCode[1]),
          status: 'PENDING'
        });
      }
    }

    // 3. Course Dates (Start & End)
    const dateRange = parseDateRange(text);
    if (dateRange.start && dateRange.end) {
      const currentRange = `${currentCourse.startDate} hingga ${currentCourse.endDate}`;
      const extractedRange = `${dateRange.start} hingga ${dateRange.end}`;
      const isConflict = Boolean(
        currentCourse.startDate && 
        (currentCourse.startDate !== dateRange.start || currentCourse.endDate !== dateRange.end)
      );

      fields.push({
        fieldKey: 'dates',
        fieldLabel: 'Tarikh Kursus (Mula & Tamat)',
        category: 'COURSE',
        extractedValue: `${dateRange.start} to ${dateRange.end}`,
        currentValue: currentRange,
        confidence: 'HIGH',
        sourceSnippet: dateRange.raw || `${dateRange.start} hingga ${dateRange.end}`,
        isConflict,
        isHighRiskGovernance: isApprovedOrSubmitted,
        status: 'PENDING'
      });
    }

    // 4. Venue Name
    const venueRegex = /(?:tempat|lokasi|venue|hotel)\s*:\s*([^\n\r]+)/i;
    const venueMatch = text.match(venueRegex);
    if (venueMatch && venueMatch[1].trim().length > 3) {
      const val = venueMatch[1].trim();
      const current = currentCourse.venueName;
      const isConflict = Boolean(current && current.trim().toLowerCase() !== val.toLowerCase());
      fields.push({
        fieldKey: 'venueName',
        fieldLabel: 'Lokasi / Hotel Kursus',
        category: 'COURSE',
        extractedValue: val,
        currentValue: current,
        confidence: 'HIGH',
        sourceSnippet: venueMatch[0],
        isConflict,
        isHighRiskGovernance: isApprovedOrSubmitted,
        status: 'PENDING'
      });
    }

    // 5. Hall / Room Name
    const hallRegex = /(?:dewan|bilik seminar|hall|bilik latihan)\s*:\s*([^\n\r]+)/i;
    const hallMatch = text.match(hallRegex);
    if (hallMatch && hallMatch[1].trim().length > 2) {
      const val = hallMatch[1].trim();
      const current = currentCourse.venueDetails?.hallName || '';
      const isConflict = Boolean(current && current.trim().toLowerCase() !== val.toLowerCase());
      fields.push({
        fieldKey: 'hallName',
        fieldLabel: 'Dewan / Bilik Seminar',
        category: 'LOGISTICS',
        extractedValue: val,
        currentValue: current || '(Kosong)',
        confidence: 'HIGH',
        sourceSnippet: hallMatch[0],
        isConflict,
        status: 'PENDING'
      });
    }

    // 6. Wi-Fi SSID and Password
    const wifiSsidMatch = text.match(/(?:wifi|wi-fi|ssid|rangkaian)\s*(?:ssid|nama|name)?\s*:\s*([^\n\r,]+)/i);
    const wifiPassMatch = text.match(/(?:kata laluan|password|katalaluan|wifi pass)\s*:\s*([^\n\r,]+)/i);
    if (wifiSsidMatch && wifiSsidMatch[1].trim()) {
      const val = wifiSsidMatch[1].trim();
      const current = currentCourse.venueDetails?.wifiSsid || '';
      fields.push({
        fieldKey: 'wifiSsid',
        fieldLabel: 'Nama Rangkaian Wi-Fi (SSID)',
        category: 'LOGISTICS',
        extractedValue: val,
        currentValue: current || '(Kosong)',
        confidence: 'HIGH',
        sourceSnippet: wifiSsidMatch[0],
        isConflict: Boolean(current && current !== val),
        status: 'PENDING'
      });
    }
    if (wifiPassMatch && wifiPassMatch[1].trim()) {
      const val = wifiPassMatch[1].trim();
      const current = currentCourse.venueDetails?.wifiPassword || '';
      fields.push({
        fieldKey: 'wifiPassword',
        fieldLabel: 'Kata Laluan Wi-Fi',
        category: 'LOGISTICS',
        extractedValue: val,
        currentValue: current || '(Kosong)',
        confidence: 'HIGH',
        sourceSnippet: wifiPassMatch[0],
        isConflict: Boolean(current && current !== val),
        status: 'PENDING'
      });
    }

    // 7. Organizer Contact / Secretariat
    const contactRegex = /(?:pegawai untuk dihubungi|urus setia|penyelaras|hubungi)\s*:\s*([^\n\r]+)/i;
    const contactMatch = text.match(contactRegex);
    if (contactMatch && contactMatch[1].trim().length > 3) {
      const val = contactMatch[1].trim();
      fields.push({
        fieldKey: 'secretariatContact',
        fieldLabel: 'Pegawai Urus Setia Utama',
        category: 'CONTACT',
        extractedValue: val,
        currentValue: currentCourse.contacts?.[0]?.name ? `${currentCourse.contacts[0].name} (${currentCourse.contacts[0].phone})` : '(Kosong)',
        confidence: 'MEDIUM',
        sourceSnippet: contactMatch[0],
        isConflict: false,
        status: 'PENDING'
      });
    }

    // 8. Instructions & Dress Code
    const instructionsRegex = /(?:arahan pentadbiran|arahan|keperluan|pakaian)\s*:\s*([^\n\r]+)/i;
    const instructionsMatch = text.match(instructionsRegex);
    if (instructionsMatch && instructionsMatch[1].trim().length > 5) {
      const val = instructionsMatch[1].trim();
      const current = currentCourse.instructions || '';
      fields.push({
        fieldKey: 'instructions',
        fieldLabel: 'Arahan & Etika Pakaian',
        category: 'LOGISTICS',
        extractedValue: val,
        currentValue: current || '(Kosong)',
        confidence: 'HIGH',
        sourceSnippet: instructionsMatch[0],
        isConflict: Boolean(current && current !== val),
        status: 'PENDING'
      });
    }
  }

  /**
   * Extracts Schedule Sessions from text lines
   */
  private static extractSessions(
    text: string, 
    existingSessions: any[], 
    sessions: ExtractedSessionItem[]
  ): void {
    const lines = text.split('\n');
    let currentDayNumber = 1;
    let sessionCounter = 1;

    // Regex for time format: "08:30 - 10:30" or "08:30 pagi - 10:30 pagi" or "14:00 hingga 15:30"
    const timeRangeRegex = /(\d{1,2}[:.]\d{2})\s*(?:pagi|petang|am|pm)?\s*(?:-|hingga|to)\s*(\d{1,2}[:.]\d{2})\s*(?:pagi|petang|am|pm)?/i;

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return;

      // Check for Day Marker: e.g. "Hari 1:", "Hari Kedua", "Day 2"
      const dayMatch = line.match(/(?:hari|day)\s*(\d+)/i);
      if (dayMatch) {
        currentDayNumber = parseInt(dayMatch[1], 10);
        sessionCounter = 1;
        return;
      }

      // Check if line contains a time range
      const timeMatch = line.match(timeRangeRegex);
      if (timeMatch) {
        const startTime = timeMatch[1].replace('.', ':').padStart(5, '0');
        const endTime = timeMatch[2].replace('.', ':').padStart(5, '0');

        // Remaining text on line is the title/facilitator/location
        const contentAfterTime = line.substring(timeMatch.index! + timeMatch[0].length).trim();
        const contentBeforeTime = line.substring(0, timeMatch.index!).trim();

        let rawTitle = contentAfterTime || contentBeforeTime;
        // Clean leading separators like "|", ":", "-"
        rawTitle = rawTitle.replace(/^[|:-\s]+/, '').trim();

        if (rawTitle.length < 3) return;

        // Check for facilitator or speaker inside the title or next line
        let facilitatorName: string | undefined;
        let location: string | undefined;

        // Facilitator pattern: "Penceramah: Dr. Norazman" or "Oleh: En. Taufiq"
        const facilitatorMatch = rawTitle.match(/(?:penceramah|fasilitator|oleh|speaker)\s*:\s*([^\n|,]+)/i);
        if (facilitatorMatch) {
          facilitatorName = facilitatorMatch[1].trim();
          rawTitle = rawTitle.replace(facilitatorMatch[0], '').trim();
        }

        // Location pattern: "Lokasi: Ballroom" or "Dewan Seri Tamu"
        const locMatch = rawTitle.match(/(?:lokasi|tempat|bilik|dewan)\s*:\s*([^\n|,]+)/i);
        if (locMatch) {
          location = locMatch[1].trim();
          rawTitle = rawTitle.replace(locMatch[0], '').trim();
        }

        // Clean trailing separators
        rawTitle = rawTitle.replace(/[|:-\s]+$/, '').trim();

        // Check if identical session already exists
        const exists = existingSessions.some(
          s => s.dayNumber === currentDayNumber && s.startTime === startTime
        );

        sessions.push({
          id: 'ext-sess-' + (idx + 1),
          dayNumber: currentDayNumber,
          sessionNumber: sessionCounter++,
          startTime,
          endTime,
          title: rawTitle || `Sesi Pembelajaran Hari ${currentDayNumber}`,
          facilitatorName,
          location,
          confidence: facilitatorName ? 'HIGH' : 'MEDIUM',
          sourceSnippet: line,
          selectedForImport: !exists,
          status: 'PENDING'
        });
      }
    });
  }

  /**
   * Extracts participants from CSV, TSV, or comma/tab separated text
   */
  private static extractParticipantsFromTabular(
    text: string, 
    existingEnrollments: Array<{ participant: Participant; enrollment: CourseEnrollment }>
  ): { rows: ExtractedParticipantRow[]; columns?: string[] } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { rows: [] };

    // Determine delimiter (comma, tab, or semicolon)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseRow = (line: string): string[] => {
      // Basic CSV split respecting quotes
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(firstLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const detectedColumns = parseRow(firstLine);

    // Identify column mappings based on flexible keyword matching
    const colIndex = {
      name: headers.findIndex(h => h.includes('nama') || h.includes('peserta') || h.includes('name')),
      phone: headers.findIndex(h => h.includes('tel') || h.includes('telefon') || h.includes('hp') || h.includes('bimbit') || h.includes('phone') || h.includes('mobile')),
      salary: headers.findIndex(h => h.includes('gaji') || h.includes('pekerja') || h.includes('staff') || h.includes('ic') || h.includes('kadpengenalan') || h.includes('kp')),
      institution: headers.findIndex(h => h.includes('kolej') || h.includes('institusi') || h.includes('agensi') || h.includes('jabatan') || h.includes('cawangan') || h.includes('college') || h.includes('agency')),
      designation: headers.findIndex(h => h.includes('jawatan') || h.includes('gred') || h.includes('position') || h.includes('title')),
      email: headers.findIndex(h => h.includes('emel') || h.includes('email')),
      gender: headers.findIndex(h => h.includes('jantina') || h.includes('gender')),
      room: headers.findIndex(h => h.includes('bilik') || h.includes('room')),
      roommate: headers.findIndex(h => h.includes('teman') || h.includes('rakan') || h.includes('roommate')),
      group: headers.findIndex(h => h.includes('kumpulan') || h.includes('group') || h.includes('kump')),
      requirements: headers.findIndex(h => h.includes('keperluan') || h.includes('diet') || h.includes('alahan') || h.includes('special')),
    };

    // If name wasn't detected by header, test if first column looks like names
    if (colIndex.name === -1 && headers.length > 1) {
      colIndex.name = 0;
    }
    // If phone wasn't detected by header, search column with digits
    if (colIndex.phone === -1) {
      for (let c = 0; c < headers.length; c++) {
        if (c !== colIndex.name) {
          const sample = lines.slice(1, 4).map(l => parseRow(l)[c] || '');
          if (sample.some(s => s.replace(/\D/g, '').length >= 9)) {
            colIndex.phone = c;
            break;
          }
        }
      }
    }

    const rows: ExtractedParticipantRow[] = [];

    // Parse data rows (skip header row 0)
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const rawName = colIndex.name >= 0 ? (row[colIndex.name] || '') : row[0] || '';
      const rawPhone = colIndex.phone >= 0 ? (row[colIndex.phone] || '') : '';
      const rawSalary = colIndex.salary >= 0 ? (row[colIndex.salary] || '') : '';
      const rawInst = colIndex.institution >= 0 ? (row[colIndex.institution] || '') : '';
      const rawDesig = colIndex.designation >= 0 ? (row[colIndex.designation] || '') : '';
      const rawEmail = colIndex.email >= 0 ? (row[colIndex.email] || '') : '';
      const rawGender = colIndex.gender >= 0 ? (row[colIndex.gender] || '').toUpperCase() : '';
      const rawRoom = colIndex.room >= 0 ? (row[colIndex.room] || '') : '';
      const rawRoommate = colIndex.roommate >= 0 ? (row[colIndex.roommate] || '') : '';
      const rawGroup = colIndex.group >= 0 ? (row[colIndex.group] || '') : '';
      const rawReqs = colIndex.requirements >= 0 ? (row[colIndex.requirements] || '') : '';

      // Skip lines that look like duplicate headers or totals
      if (rawName.toLowerCase() === 'nama' || rawName.toLowerCase() === 'jumlah') continue;

      // Smart normalization:
      const cleanName = rawName
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase())
        .join(' ');

      const normalizedPhone = normalizePhoneNumber(rawPhone);
      const validationErrors: string[] = [];

      if (!cleanName || cleanName.length < 2) {
        validationErrors.push('Nama peserta kosong atau terlalu pendek.');
      }
      if (!normalizedPhone || normalizedPhone.length < 8) {
        validationErrors.push('Nombor telefon tidak sah atau hilang.');
      }

      // Duplicate detection against existing course enrollments
      let isDuplicate = false;
      let duplicateReason: string | undefined;
      let existingParticipantId: string | undefined;

      const existingMatch = existingEnrollments.find(e => {
        const normExistingPhone = normalizePhoneNumber(e.participant.phone);
        const isPhoneMatch = Boolean(normalizedPhone && normExistingPhone && normExistingPhone === normalizedPhone);
        const isSalaryMatch = Boolean(rawSalary && e.participant.salaryNumber && e.participant.salaryNumber === rawSalary);
        return isPhoneMatch || isSalaryMatch;
      });

      if (existingMatch) {
        isDuplicate = true;
        existingParticipantId = existingMatch.participant.id;
        duplicateReason = `Padanan peserta sedia ada: "${existingMatch.participant.name}" (${existingMatch.participant.phone}).`;
      }

      // Confidence determination
      let confidence: ExtractionConfidence = 'HIGH';
      if (validationErrors.length > 0) confidence = 'LOW';
      else if (isDuplicate) confidence = 'AMBIGUOUS';
      else if (!rawInst || !rawPhone) confidence = 'MEDIUM';

      rows.push({
        id: `ext-part-${i}`,
        name: cleanName,
        phone: rawPhone.trim(),
        normalizedPhone,
        email: rawEmail.trim().toLowerCase() || undefined,
        institutionOrAgency: rawInst.trim() || 'Kolej / Agensi Berkenaan',
        designation: rawDesig.trim() || undefined,
        salaryNumber: rawSalary.trim() || undefined,
        gender: rawGender === 'L' || rawGender === 'M' ? 'M' : rawGender === 'P' || rawGender === 'F' ? 'F' : undefined,
        roomNumber: rawRoom.trim() || undefined,
        roommateName: rawRoommate.trim() || undefined,
        assignedGroup: rawGroup.trim() || undefined,
        specialRequirements: rawReqs.trim() || undefined,
        confidence,
        validationErrors,
        isDuplicate,
        duplicateReason,
        existingParticipantId,
        selectedForImport: validationErrors.length === 0 && !isDuplicate,
        status: 'PENDING'
      });
    }

    return { rows, columns: detectedColumns };
  }
}
