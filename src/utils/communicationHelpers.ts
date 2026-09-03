import { Course, Announcement, SessionItem, ResourceMaterial, AnnouncementPriority, AnnouncementCategory } from '../types';

/**
 * Malaysian Course Communication Helpers (PART 08)
 * Formats WhatsApp broadcasts and official participant shareable messages.
 */

export function getPriorityMeta(priority: AnnouncementPriority = 'NORMAL'): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  isHighAlert: boolean;
} {
  switch (priority) {
    case 'CRITICAL':
    case 'URGENT':
      return {
        label: 'SEGERA',
        badgeBg: 'bg-red-600',
        badgeBorder: 'border-red-700',
        badgeText: 'text-white',
        cardBorder: 'border-red-600',
        cardBg: 'bg-red-50/40',
        isHighAlert: true,
      };
    case 'IMPORTANT':
      return {
        label: 'PENTING',
        badgeBg: 'bg-amber-500',
        badgeBorder: 'border-amber-600',
        badgeText: 'text-zinc-950',
        cardBorder: 'border-amber-500',
        cardBg: 'bg-amber-50/40',
        isHighAlert: true,
      };
    case 'NORMAL':
    default:
      return {
        label: 'MAKLUMAN',
        badgeBg: 'bg-zinc-100',
        badgeBorder: 'border-zinc-300',
        badgeText: 'text-zinc-800',
        cardBorder: 'border-zinc-900',
        cardBg: 'bg-white',
        isHighAlert: false,
      };
  }
}

export function getCategoryLabel(category?: AnnouncementCategory): string {
  switch (category) {
    case 'LOCATION_CHANGE':
      return 'Pindaan Bilik / Lokasi';
    case 'SCHEDULE_CHANGE':
      return 'Pindaan Masa / Jadual';
    case 'RESOURCES':
      return 'Bahan & Slaid';
    case 'URGENT':
      return 'Arahan Penting Segera';
    case 'GENERAL':
    default:
      return 'Makluman Am';
  }
}

/**
 * Builds formatted text for WhatsApp distribution
 */
export function formatWhatsAppAnnouncement(
  course: Course,
  announcement: Announcement,
  linkedSession?: SessionItem,
  linkedResource?: ResourceMaterial
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const courseUrl = `${origin}/course/${course.slug}`;
  const priorityMeta = getPriorityMeta(announcement.priority);
  const categoryLabel = getCategoryLabel(announcement.category);

  let text = `📢 *HEBAHAN RASMI KURSUS*\n`;
  text += `🏛️ *${course.title}*\n`;
  text += `---------------------------------\n`;
  text += `📌 *Tajuk:* ${announcement.title}\n`;
  text += `⚠️ *Keutamaan:* ${priorityMeta.label} (${categoryLabel})\n`;
  text += `🕒 *Masa Siaran:* ${new Date(announcement.publishedAt).toLocaleString('ms-MY')}\n\n`;
  text += `${announcement.content}\n\n`;

  if (linkedSession) {
    text += `📅 *Maklumat Sesi Terlibat:*\n`;
    text += `• Hari ${linkedSession.dayNumber}, Sesi ${linkedSession.sessionNumber}: ${linkedSession.title}\n`;
    text += `• Waktu: ${linkedSession.startTime} - ${linkedSession.endTime}\n`;
    if (linkedSession.location) {
      text += `• Lokasi Terkini: *${linkedSession.location}*\n`;
    }
    text += `\n`;
  }

  if (linkedResource) {
    text += `📎 *Bahan Berkaitan:* ${linkedResource.title} (${linkedResource.category})\n\n`;
  }

  text += `---------------------------------\n`;
  text += `🔗 *Pautan Rasmi Kursus (Portal MyKursus):*\n`;
  text += `${courseUrl}\n`;
  text += `_(Sila rujuk portal rasmi untuk maklumat jadual terkini)_\n`;

  return text;
}

/**
 * Formats a clean course share text for WhatsApp
 */
export function formatWhatsAppCourseShare(course: Course): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const courseUrl = `${origin}/course/${course.slug}`;

  let text = `🎓 *PORTAL MAKLUMAT KURSUS: MYKURSUS*\n`;
  text += `---------------------------------\n`;
  text += `*Kursus:* ${course.title}\n`;
  if (course.subtitle) text += `_${course.subtitle}_\n`;
  text += `🗓️ *Tarikh:* ${course.startDate} hingga ${course.endDate}\n`;
  text += `📍 *Lokasi:* ${course.venueName}\n`;
  if (course.venueDetails?.hallName) {
    text += `🏛️ *Dewan / Bilik:* ${course.venueDetails.hallName}\n`;
  }
  text += `\nSila layari portal rasmi untuk melihat jadual terperinci, bilik penginapan, dan hebahan langsung urus setia:\n`;
  text += `👉 *${courseUrl}*\n`;

  return text;
}
