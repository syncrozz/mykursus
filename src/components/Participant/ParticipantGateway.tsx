import React, { useState, useEffect } from 'react';
import { Search, Compass, AlertCircle, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { Course } from '../../types';
import { platformStorage } from '../../services/storage';
import { ParticipantCourseView } from './ParticipantCourseView';

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
  if (allCourses.length === 0) {
    platformStorage.loadKiarPilot();
    allCourses = platformStorage.getCourses();
  }
  const publishedCourses = allCourses.filter(c => c.approvalStatus === 'APPROVED' || c.isFeaturedActive);

  // Resolve slug on mount or when currentSlug changes
  useEffect(() => {
    // If no slug is specified, try looking at window.location
    let activeSlug = currentSlug;
    if (!activeSlug) {
      const hash = window.location.hash;
      if (hash.startsWith('#/course/')) {
        activeSlug = hash.replace('#/course/', '');
      } else if (window.location.pathname.startsWith('/course/')) {
        activeSlug = window.location.pathname.replace('/course/', '');
      }
    }

    if (!activeSlug) {
      // Default to first published or pilot course if available
      const pilot = allCourses.find(c => c.slug === 'transformasi-pedagogi-kiar-2026') || allCourses[0];
      if (pilot) {
        activeSlug = pilot.slug;
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
        setCourse(null);
        setNotFoundError(true);
      }
    }
  }, [currentSlug]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slugInput.trim().toLowerCase().replace(/^#?\/?course\/?/, '').replace(/\/+$/, '').split('?')[0];
    if (!clean) return;
    setCurrentSlug(clean);
    const found = platformStorage.getCourseBySlug(clean);
    if (found) {
      setCourse(found);
      setNotFoundError(false);
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
        <ParticipantCourseView
          course={course}
          scheduleDays={scheduleDays}
          sessions={sessions}
          announcements={announcements}
        />
      </div>
    );
  }

  // Fallback / Slug Not Found State
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-zinc-900 p-6 sm:p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-zinc-900 text-white mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950">
            {notFoundError ? 'Kursus Tidak Dijumpai' : 'Laman Awam Peserta MyKursus'}
          </h2>
          <p className="text-xs text-zinc-600">
            {notFoundError 
              ? `Tiada kursus berdaftar dengan slug "/course/${currentSlug}". Sila semak semula ejaan atau pilih kursus daripada senarai.`
              : 'Sila masukkan slug pautan rasmi kursus untuk membuka halaman maklumat.'
            }
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Masukkan Slug Kursus:
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-xs font-mono font-bold bg-zinc-200 border-2 border-r-0 border-zinc-900 text-zinc-700">
                /course/
              </span>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="transformasi-pedagogi-kiar-2026"
                className="flex-1 px-3 py-2 text-xs font-mono font-bold border-2 border-zinc-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Buka Kursus</span>
          </button>
        </form>

        {/* Quick Links to Published or Pilot Courses */}
        <div className="space-y-2 pt-4 border-t border-zinc-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Kursus Tersedia:
          </span>
          <div className="space-y-1.5">
            {allCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCurrentSlug(c.slug);
                  setSlugInput(c.slug);
                  setCourse(c);
                  setNotFoundError(false);
                }}
                className="w-full text-left p-2.5 bg-zinc-50 hover:bg-blue-50 border border-zinc-300 hover:border-blue-600 transition-colors flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-zinc-900 block truncate">{c.title}</span>
                  <span className="font-mono text-[10px] text-zinc-500">/course/{c.slug}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
