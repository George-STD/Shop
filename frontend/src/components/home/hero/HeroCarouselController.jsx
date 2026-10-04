'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export default function HeroCarouselController({ trackId, count }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  activeIndexRef.current = activeIndex;

  const goTo = useCallback(
    (index) => {
      const track = document.getElementById(trackId);
      if (!track) return;
      const isRtl = getComputedStyle(track).direction === 'rtl';
      const dir = isRtl ? -1 : 1;
      track.scrollTo({
        left: dir * index * track.clientWidth,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    },
    [trackId]
  );

  useEffect(() => {
    if (count < 2) return;

    const track = document.getElementById(trackId);
    if (!track) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Observe slide intersections within track
    const slides = track.querySelectorAll('[data-hero-slide]');
    const slideObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.prototype.indexOf.call(slides, entry.target);
            if (idx !== -1) {
              setActiveIndex(idx);
            }
          }
        });
      },
      { root: track, threshold: 0.6 }
    );

    slides.forEach((slide) => slideObserver.observe(slide));

    // 2. Autoplay timer
    let autoplayInterval = null;
    let isVisibleInViewport = true;

    const startAutoplay = () => {
      if (prefersReducedMotion || autoplayInterval) return;
      autoplayInterval = setInterval(() => {
        if (!isPausedRef.current && !document.hidden && isVisibleInViewport) {
          const nextIndex = (activeIndexRef.current + 1) % count;
          goTo(nextIndex);
        }
      }, 5000);
    };

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    };

    // 3. User interaction pause (resume after 8s)
    const handleUserInteraction = () => {
      isPausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 8000);
    };

    track.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    track.addEventListener('touchstart', handleUserInteraction, { passive: true });

    // 4. Pause when document is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Pause when track is not in viewport
    const viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleInViewport = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    viewportObserver.observe(track);

    // 6. Defer starting autoplay until browser is idle
    let idleId = null;
    let timeoutId = null;
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => startAutoplay(), { timeout: 3000 });
      } else {
        timeoutId = setTimeout(() => startAutoplay(), 1500);
      }
    }

    return () => {
      stopAutoplay();
      slideObserver.disconnect();
      viewportObserver.disconnect();
      track.removeEventListener('pointerdown', handleUserInteraction);
      track.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [trackId, count, goTo]);

  if (count < 2) return null;

  return (
    <div
      className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 z-20 pointer-events-auto"
      role="tablist"
      aria-label="مؤشرات شرائح العرض"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={activeIndex === i}
          aria-label={`الانتقال إلى الشريحة ${i + 1}`}
          aria-current={activeIndex === i ? 'true' : undefined}
          onClick={() => goTo(i)}
          className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
            activeIndex === i
              ? 'w-8 bg-purple-600 shadow-md shadow-purple-600/30'
              : 'w-2.5 bg-gray-400/60 hover:bg-gray-400'
          }`}
        />
      ))}
    </div>
  );
}
