import React, { useState } from 'react';
import { Course, Participant, CourseEnrollment, SessionItem, ScheduleDay, Announcement } from '../types';
import { ParticipantCourseView } from './Participant/ParticipantCourseView';
import { SupportModal } from './Support/SupportModal';

interface PublicCourseViewerProps {
  course: Course;
  enrollments?: Array<{ participant: Participant; enrollment: CourseEnrollment }>;
  sessions?: SessionItem[];
  scheduleDays?: ScheduleDay[];
  announcements?: Announcement[];
  onClose: () => void;
}

export const PublicCourseViewer: React.FC<PublicCourseViewerProps> = ({
  course,
  sessions = [],
  scheduleDays = [],
  announcements = [],
  onClose,
}) => {
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-xs overflow-y-auto flex flex-col min-h-screen">
      <div className="flex-1">
        <ParticipantCourseView
          course={course}
          scheduleDays={scheduleDays}
          sessions={sessions}
          announcements={announcements}
          isOrganizerPreview={true}
          onClosePreview={onClose}
        />
      </div>

      {/* Platform Standard Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-3.5 pb-16 sm:pb-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            <span>
              Developed by{' '}
              <a
                href="https://www.syncrozz.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Syncrozz
              </a>
            </span>
            <a
              href="https://wa.me/60145313756"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Syncrozz"
              title="Hubungi melalui WhatsApp"
              className="inline-flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <img
                src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/MAIN/Logo%20Whatapp%20v2.png"
                alt="WhatsApp"
                className="w-5 h-5 object-contain"
                loading="lazy"
              />
            </a>
          </div>

          <button
            id="public-viewer-footer-support-btn"
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/5 text-white/50 text-[11px] font-normal hover:text-white/80 hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <span>Support</span>
            <span className="text-rose-400/60">❤️</span>
          </button>
        </div>
      </footer>

      {/* SYNCROZZ Support Experience Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
};
