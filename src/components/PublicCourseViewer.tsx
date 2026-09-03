import React from 'react';
import { Course, Participant, CourseEnrollment, SessionItem, ScheduleDay, Announcement } from '../types';
import { ParticipantCourseView } from './Participant/ParticipantCourseView';

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
  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-xs overflow-y-auto">
      <ParticipantCourseView
        course={course}
        scheduleDays={scheduleDays}
        sessions={sessions}
        announcements={announcements}
        isOrganizerPreview={true}
        onClosePreview={onClose}
      />
    </div>
  );
};
