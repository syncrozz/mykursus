import { ScheduleDay, SessionItem, Course } from '../types';

export interface SessionStatusInfo {
  currentSession: SessionItem | null;
  nextSession: SessionItem | null;
  todaySessions: SessionItem[];
  completedSessions: SessionItem[];
  upcomingSessions: SessionItem[];
  isCourseCompleted: boolean;
  statusLabel: string;
  currentSessionRemainingMinutes?: number;
  minutesUntilNextSession?: number;
  todayDay?: ScheduleDay;
}

/**
 * Calculates real-time session progress for a course
 * Data-driven: computes against scheduleDays and session times
 */
export function calculateCourseSessionStatus(
  course: Course,
  scheduleDays: ScheduleDay[],
  sessions: SessionItem[],
  nowDate: Date = new Date()
): SessionStatusInfo {
  if (!sessions || sessions.length === 0) {
    return {
      currentSession: null,
      nextSession: null,
      todaySessions: [],
      completedSessions: [],
      upcomingSessions: [],
      isCourseCompleted: false,
      statusLabel: 'Tiada jadual sesi direkodkan',
    };
  }

  // Parse time "HH:MM" into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  // Format today's date as YYYY-MM-DD
  const nowIso = nowDate.toISOString();
  const todayStr = nowIso.split('T')[0];
  const nowHours = nowDate.getHours();
  const nowMinutes = nowDate.getMinutes();
  const nowTotalMinutes = nowHours * 60 + nowMinutes;

  // Find day corresponding to today
  const todayDay = (scheduleDays || []).find(d => d.date === todayStr);
  const todaySessions = todayDay 
    ? (sessions || []).filter(s => s.dayNumber === todayDay.dayNumber).sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  let currentSession: SessionItem | null = null;
  let nextSession: SessionItem | null = null;
  const completedSessions: SessionItem[] = [];
  const upcomingSessions: SessionItem[] = [];
  let currentSessionRemainingMinutes: number | undefined;
  let minutesUntilNextSession: number | undefined;

  // Check if course is already in the past
  if (course.endDate && todayStr > course.endDate) {
    return {
      currentSession: null,
      nextSession: null,
      todaySessions: [],
      completedSessions: [...sessions].sort((a, b) => a.dayNumber - b.dayNumber || a.startTime.localeCompare(b.startTime)),
      upcomingSessions: [],
      isCourseCompleted: true,
      statusLabel: 'Kursus telah selesai',
    };
  }

  // Evaluate all sessions relative to current date and time
  const sortedDays = [...(scheduleDays || [])].sort((a, b) => a.dayNumber - b.dayNumber);

  sessions.forEach(session => {
    const day = sortedDays.find(d => d.dayNumber === session.dayNumber);
    const sessionDate = day ? day.date : todayStr;
    const startMin = parseTimeToMinutes(session.startTime);
    const endMin = parseTimeToMinutes(session.endTime);

    if (sessionDate < todayStr) {
      completedSessions.push(session);
    } else if (sessionDate > todayStr) {
      upcomingSessions.push(session);
    } else {
      // It is today!
      if (nowTotalMinutes > endMin) {
        completedSessions.push(session);
      } else if (nowTotalMinutes < startMin) {
        upcomingSessions.push(session);
      } else {
        currentSession = session;
        currentSessionRemainingMinutes = Math.max(0, endMin - nowTotalMinutes);
      }
    }
  });

  // Sort upcoming to find immediate next session
  upcomingSessions.sort((a, b) => {
    const dayDiff = a.dayNumber - b.dayNumber;
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  if (upcomingSessions.length > 0) {
    nextSession = upcomingSessions[0];
    const nextDay = sortedDays.find(d => d.dayNumber === nextSession?.dayNumber);
    if (nextDay && nextDay.date === todayStr) {
      const nextStartMin = parseTimeToMinutes(nextSession.startTime);
      minutesUntilNextSession = Math.max(0, nextStartMin - nowTotalMinutes);
    }
  }

  // Fallback if course has not started yet (all sessions in future)
  if (!currentSession && !nextSession && sessions.length > 0) {
    const firstDay = sortedDays[0];
    const firstDaySessions = (sessions || [])
      .filter(s => firstDay && s.dayNumber === firstDay.dayNumber)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (firstDaySessions.length > 0) {
      nextSession = firstDaySessions[0];
    }
  }

  let statusLabel = 'Kursus Akan Datang';
  if (currentSession) {
    statusLabel = 'Sedang Berlangsung Sekarang';
  } else if (nextSession) {
    statusLabel = 'Sesi Seterusnya Bersedia';
  }

  return {
    currentSession,
    nextSession,
    todaySessions,
    completedSessions,
    upcomingSessions,
    isCourseCompleted: false,
    statusLabel,
    currentSessionRemainingMinutes,
    minutesUntilNextSession,
    todayDay,
  };
}

/**
 * Parses course instructions or guidelines into checklist items
 */
export function parseRequirementsList(instructions?: string): string[] {
  if (!instructions || !instructions.trim()) return [];

  // Split by newlines or full-stops followed by space
  const lines = instructions
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map(s => s.trim().replace(/^[-*•\d.)]\s*/, ''))
    .filter(s => s.length > 4);

  return lines;
}
