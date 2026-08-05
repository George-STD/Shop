import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

function getScrollDirection(deltaY) {
  if (Math.abs(deltaY) < 4) return null;
  return deltaY > 0 ? 'down' : 'up';
}

export default function ScrollVideoSequence({
  segments = DEFAULT_SEGMENTS,
  poster,
  ariaLabel = 'تجربة فتح صندوق الهدايا التفاعلية 3D',
  onComplete,
}) {
  const totalSegments = segments.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isActiveRef = useRef(true);
  const hasStartedRef = useRef(false);
  const cooldownRef = useRef(false);
  const cooldownTimer = useRef(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAllLoaded(true);
      return;
    }

    let loadedCount = 0;
    const loadedSet = new Set();

    const checkLoaded = (index) => {
      if (!loadedSet.has(index)) {
        loadedSet.add(index);
        loadedCount++;
        const pct = Math.round((loadedCount / totalSegments) * 100);
        setLoadProgress(pct);
        if (loadedCount >= totalSegments) {
          setAllLoaded(true);
        }
      }
    };

    const timers = [];

    segments.forEach((_, idx) => {
      const vid = videoRefs.current[idx];
      if (vid) {
        if (vid.readyState >= 3) {
          checkLoaded(idx);
        } else {
          const onCanPlay = () => checkLoaded(idx);
          vid.addEventListener('canplaythrough', onCanPlay, { once: true });
          vid.addEventListener('loadeddata', onCanPlay, { once: true });

          const t = setTimeout(() => checkLoaded(idx), 3500);
          timers.push(t);
        }
      } else {
        checkLoaded(idx);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [segments, totalSegments, prefersReducedMotion]);

  const playSegment = useCallback(
    (targetIndex) => {
      if (targetIndex < 0 || targetIndex >= totalSegments) return;

      const vid = videoRefs.current[targetIndex];
      if (!vid) return;

      videoRefs.current.forEach((v, idx) => {
        if (v && idx !== targetIndex) {
          v.pause();
        }
      });

      setCurrentIndex(targetIndex);
      currentIndexRef.current = targetIndex;

      setIsPlaying(true);
      isPlayingRef.current = true;

      setHasStarted(true);
      hasStartedRef.current = true;

      try {
        vid.currentTime = 0;
      } catch (_) {}

      const promise = vid.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          setIsPlaying(false);
          isPlayingRef.current = false;
        });
      }
    },
    [totalSegments]
  );

  const handleVideoEnded = useCallback(
    (index) => {
      if (index !== currentIndexRef.current) return;

      setIsPlaying(false);
      isPlayingRef.current = false;

      if (index === totalSegments - 1 && onComplete) {
        onComplete();
      }

      cooldownRef.current = true;
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => {
        cooldownRef.current = false;
      }, 300);
    },
    [totalSegments, onComplete]
  );

  const handleScrollTrigger = useCallback(
    (dir, e) => {
      if (!dir) return;

      if (isPlayingRef.current || cooldownRef.current) {
        if (e && e.cancelable) e.preventDefault();
        return;
      }

      const cIdx = currentIndexRef.current;
      const started = hasStartedRef.current;

      if (dir === 'down') {
        if (cIdx >= totalSegments - 1 && started) {
          setIsActive(false);
          isActiveRef.current = false;
          return;
        }

        if (e && e.cancelable) e.preventDefault();

        if (!started) {
          playSegment(0);
        } else {
          const next = cIdx + 1;
          if (next < totalSegments) {
            playSegment(next);
          }
        }
      } else if (dir === 'up') {
        if (cIdx <= 0 && started) {
          setIsActive(false);
          isActiveRef.current = false;
          return;
        }

        if (e && e.cancelable) e.preventDefault();

        const prev = cIdx - 1;
        if (prev >= 0) {
          playSegment(prev);
        }
      }
    },
    [totalSegments, playSegment]
  );

  useEffect(() => {
    if (prefersReducedMotion || !allLoaded) return;

    const onWheel = (e) => {
      if (!isActiveRef.current) return;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const inView =
        rect.top <= window.innerHeight * 0.5 &&
        rect.bottom >= window.innerHeight * 0.5;

      if (!inView) return;

      const dir = getScrollDirection(e.deltaY);
      handleScrollTrigger(dir, e);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [allLoaded, prefersReducedMotion, handleScrollTrigger]);

  useEffect(() => {
    if (prefersReducedMotion || !allLoaded) return;

    const section = sectionRef.current;
    if (!section) return;

    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (isActiveRef.current) {
        const deltaY = touchStartY.current - e.touches[0].clientY;
        if (Math.abs(deltaY) > 5 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e) => {
      if (!isActiveRef.current) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const threshold = 25;

      if (Math.abs(deltaY) < threshold) return;

      const dir = deltaY > 0 ? 'down' : 'up';
      handleScrollTrigger(dir, e);
    };

    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchmove', onTouchMove, { passive: false });
    section.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchmove', onTouchMove);
      section.removeEventListener('touchend', onTouchEnd);
    };
  }, [allLoaded, prefersReducedMotion, handleScrollTrigger]);

  useEffect(() => {
    if (prefersReducedMotion || !allLoaded) return;

    const onKeyDown = (e) => {
      if (!isActiveRef.current) return;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const inView =
        rect.top <= window.innerHeight * 0.5 &&
        rect.bottom >= window.innerHeight * 0.5;

      if (!inView) return;

      const downKeys = ['ArrowDown', 'Space', 'PageDown'];
      const upKeys = ['ArrowUp', 'PageUp'];

      if (downKeys.includes(e.code)) {
        handleScrollTrigger('down', e);
      } else if (upKeys.includes(e.code)) {
        handleScrollTrigger('up', e);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allLoaded, prefersReducedMotion, handleScrollTrigger]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          isActiveRef.current = true;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const skipAnimation = useCallback(() => {
    videoRefs.current.forEach((v) => v?.pause());
    setCurrentIndex(totalSegments - 1);
    currentIndexRef.current = totalSegments - 1;

    setIsPlaying(false);
    isPlayingRef.current = false;

    setIsActive(false);
    isActiveRef.current = false;

    setHasStarted(true);
    hasStartedRef.current = true;

    // Scroll smoothly to Hero content
    const heroContent = document.getElementById('main-hero-content');
    if (heroContent) {
      heroContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, [totalSegments]);

  if (!allLoaded) {
    return (
      <section
        ref={sectionRef}
        className={styles.section}
        aria-label={ariaLabel}
      >
        <div style={{ display: 'none' }}>
          {segments.map((src, idx) => (
            <video
              key={idx}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              src={src}
              muted
              playsInline
              preload="auto"
            />
          ))}
        </div>

        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>جاري تجهيز مفاجأة الفتح 🎁</p>
          <div className={styles.loadingBar}>
            <div
              className={styles.loadingBarFill}
              style={{ '--progress': `${loadProgress}%` }}
            />
          </div>
          <p className={styles.loadingPercent}>{loadProgress}%</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${isActive ? styles.active : ''}`}
      aria-label={ariaLabel}
      role="region"
      id="video-sequence-section"
    >
      <button
        type="button"
        className={styles.skipButton}
        onClick={skipAnimation}
        aria-label="تخطي العرض التفاعلي للبوكس"
        id="skip-animation-btn"
      >
        تخطي الأنيميشن ↓
      </button>

      {segments.map((src, idx) => (
        <video
          key={idx}
          ref={(el) => {
            videoRefs.current[idx] = el;
          }}
          src={src}
          className={styles.video}
          style={{
            opacity: idx === currentIndex ? 1 : 0,
            pointerEvents: idx === currentIndex ? 'auto' : 'none',
            transition: 'opacity 0.25s ease-in-out',
          }}
          muted
          playsInline
          preload="auto"
          poster={poster}
          onEnded={() => handleVideoEnded(idx)}
          aria-hidden={idx !== currentIndex}
        />
      ))}

      {!hasStarted && (
        <div
          className={styles.scrollPrompt}
          aria-hidden="true"
          onClick={() => playSegment(0)}
        >
          <div className={styles.scrollIcon}>
            <div className={styles.scrollDot} />
          </div>
          <p className={styles.scrollText}>اسحب لفتح صندوق الهدايا ✨</p>
        </div>
      )}

      {hasStarted && (
        <div
          className={styles.progressContainer}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSegments}
          aria-label={`المرحلة ${currentIndex + 1} من ${totalSegments}`}
        >
          <div className={styles.progressDots}>
            {segments.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.dot} ${
                  idx <= currentIndex ? styles.dotActive : ''
                } ${idx === currentIndex && isPlaying ? styles.dotPlaying : ''}`}
              />
            ))}
          </div>
          <span className={styles.progressLabel}>
            {currentIndex + 1} / {totalSegments}
          </span>
        </div>
      )}
    </section>
  );
}
