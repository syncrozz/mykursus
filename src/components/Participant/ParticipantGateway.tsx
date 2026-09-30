import React, { useState, useEffect } from 'react';
import { Search, Compass, AlertCircle, ArrowRight, BookOpen, CheckCircle, ChevronLeft } from 'lucide-react';
import { Course } from '../../types';
import { platformStorage } from '../../services/storage';
import { formatDateRangeDMY } from '../../utils/dateFormatter';
import { ParticipantCourseView } from './ParticipantCourseView';
import { ParticipantWelcome } from './ParticipantWelcome';

interface ParticipantGatewayProps {
  initialSlug?: string;
  onNavigateToOrganizer?: () => void;
  onNavigateToAdmin?: () => void;
}

export const ParticipantGateway: React.FC<ParticipantGatewayProps> = ({
  initialSlug,
  onNavigateToOrganizer,
  onNavigateToAdmin,
}) => {
  const [slugInput, setSlugInput] = useState(initialSlug || '');
  const [currentSlug, setCurrentSlug] = useState<string>(initialSlug || '');
  const [course, setCourse] = useState<Course | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);

  // Load available published courses for quick navigation
  let allCourses = platformStorage.getCourses();
  const publishedCourses = allCourses.filter(c => c.approvalStatus === 'APPROVED' || c.isFeaturedActive);

  // Resolve slug on mount or when currentSlug changes
  useEffect(() => {
    // If no slug is specified, try looking at window.location
    let activeSlug = currentSlug;
    if (!activeSlug) {
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('course') || searchParams.get('c') || searchParams.get('slug');
      if (querySlug) {
        activeSlug = querySlug;
      }
    }

    if (!activeSlug) {
      const hash = window.location.hash;
      if (hash.startsWith('#/course/')) {
        activeSlug = hash.replace('#/course/', '');
      } else if (hash.startsWith('#course/')) {
        activeSlug = hash.replace('#course/', '');
      } else if (hash.startsWith('#/')) {
        const potential = hash.replace('#/', '');
        if (potential && !['admin', 'organizer', 'participant'].includes(potential)) {
          activeSlug = potential;
        }
      } else if (window.location.pathname.startsWith('/course/')) {
        activeSlug = window.location.pathname.replace('/course/', '');
      } else if (window.location.pathname.length > 1 && !window.location.pathname.includes('.')) {
        const potential = window.location.pathname.replace(/^\/+/, '').split('/')[0];
        if (potential && !['admin', 'organizer', 'participant', 'architecture'].includes(potential)) {
          activeSlug = potential;
        }
      }
    }

    if (activeSlug) {
      const clean = activeSlug.trim().toLowerCase().replace(/^#?\/?course\/?/, '').replace(/\/+$/, '').split('?')[0];
      setCurrentSlug(clean);
      setSlugInput(clean);
      const found = platformStorage.getCourseBySlug(clean);
      if (found) {
        setCourse(found);
        setNotFoundError(false);
      } else {
        // Try pulling latest courses from Cloud Firestore (e.g. Incognito or fresh link)
        platformStorage.syncFromCloud().then(res => {
          const recheck = platformStorage.getCourseBySlug(clean);
          if (recheck) {
            setCourse(recheck);
            setNotFoundError(false);
          } else {
            setCourse(null);
            setNotFoundError(true);
          }
        }).catch(() => {
          setCourse(null);
          setNotFoundError(true);
        });
      }
    }
  }, [currentSlug]);

  // Listen to cross-tab or background cloud sync updates
  useEffect(() => {
    const handleDataChanged = () => {
      if (currentSlug) {
        const updated = platformStorage.getCourseBySlug(currentSlug);
        if (updated) {
          setCourse(updated);
          setNotFoundError(false);
        }
      }
    };
    window.addEventListener('mykursus_data_changed', handleDataChanged);
    return () => window.removeEventListener('mykursus_data_changed', handleDataChanged);
  }, [currentSlug]);

  const handleSelectCourse = (selectedCourse: Course) => {
    setCourse(selectedCourse);
    setCurrentSlug(selectedCourse.slug);
    setSlugInput(selectedCourse.slug);
    setNotFoundError(false);
    window.location.hash = `#/course/${selectedCourse.slug}`;
  };

  const handleSearchSlug = (slugToSearch: string) => {
    const clean = slugToSearch.trim().toLowerCase().replace(/^#?\/?course\/?/, '').replace(/\/+$/, '').split('?')[0];
    if (!clean) return;
    setCurrentSlug(clean);
    setSlugInput(clean);
    const found = platformStorage.getCourseBySlug(clean);
    if (found) {
      setCourse(found);
      setNotFoundError(false);
      window.location.hash = `#/course/${found.slug}`;
    } else {
      setCourse(null);
      setNotFoundError(true);
    }
  };

  if (course) {
    const scheduleDays = platformStorage.getScheduleDaysByCourseId(course.id);
    const sessions = platformStorage.getSessionsByCourseId(course.id);
    const announcements = platformStorage.getAnnouncementsByCourseId(course.id);

    return (
      <div className="relative">
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-white">
          <button
            type="button"
            onClick={() => {
              setCourse(null);
              setCurrentSlug('');
              setSlugInput('');
              window.location.hash = '';
            }}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Senarai Kursus Awam</span>
          </button>
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            mykursus.syncrozz.com/{course.slug}
          </span>
        </div>
        <ParticipantCourseView
          course={course}
          scheduleDays={scheduleDays}
          sessions={sessions}
          announcements={announcements}
          onUpdateCourse={(updated) => setCourse(updated)}
        />
      </div>
    );
  }

  // Option A: Comprehensive Welcome & Course Readiness Gate Screen
  return (
    <ParticipantWelcome
      onSelectCourse={handleSelectCourse}
      onSearchSlug={handleSearchSlug}
      onNavigateToOrganizer={onNavigateToOrganizer}
      onNavigateToAdmin={onNavigateToAdmin}
    />
  );
};
