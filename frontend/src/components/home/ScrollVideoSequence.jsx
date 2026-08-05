import { useRef, useState, useEffect, useCallback } from 'react';
import { FiPlay, FiPause, FiChevronDown } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

export default function ScrollVideoSequence({
  segments = DEFAULT_SEGMENTS,
  poster,
  ariaLabel = 'عرض فتح صندوق الهدايا 3D',
}) {
  const totalSegments = segments.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const videoRefs = useRef([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Preload videos
  useEffect(() => {
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

          const t = setTimeout(() => checkLoaded(idx), 2500);
          timers.push(t);
        }
      } else {
        checkLoaded(idx);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [segments, totalSegments]);

  // Play segment by index
  const playSegment = useCallback(
    (targetIndex) => {
      if (targetIndex < 0 || targetIndex >= totalSegments) return;

      videoRefs.current.forEach((v, idx) => {
        if (v && idx !== targetIndex) {
          v.pause();
        }
      });

      setCurrentIndex(targetIndex);
      currentIndexRef.current = targetIndex;
      setIsPlaying(true);

      const vid = videoRefs.current[targetIndex];
      if (vid) {
        try {
          vid.currentTime = 0;
        } catch (_) {}
        const p = vid.play();
        if (p !== undefined) {
          p.catch(() => {
            setIsPlaying(false);
          });
        }
      }
    },
    [totalSegments]
  );

  // Auto transition to next segment on end
  const handleVideoEnded = useCallback(
    (index) => {
      if (index !== currentIndexRef.current) return;
      const nextIndex = (index + 1) % totalSegments;
      playSegment(nextIndex);
    },
    [totalSegments, playSegment]
  );

  // Toggle play/pause
  const togglePlay = () => {
    const vid = videoRefs.current[currentIndex];
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      vid.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const scrollToHeroContent = () => {
    const heroElem = document.getElementById('main-hero-content');
    if (heroElem) {
      heroElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading state
  if (!allLoaded) {
    return (
      <section className={styles.section} aria-label={ariaLabel}>
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
          <p className={styles.loadingText}>جاري تجهيز استعراض الهدايا 🎁</p>
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
      className={styles.section}
      aria-label={ariaLabel}
      role="region"
      id="video-sequence-hero"
    >
      <div className={styles.overlay} />

      {/* Render stacked video segments */}
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
            transition: 'opacity 0.35s ease-in-out',
          }}
          muted
          playsInline
          autoPlay={idx === 0}
          preload="auto"
          poster={poster}
          onEnded={() => handleVideoEnded(idx)}
          aria-hidden={idx !== currentIndex}
        />
      ))}

      {/* Scroll down button */}
      <button
        type="button"
        className={styles.scrollDownBtn}
        onClick={scrollToHeroContent}
        aria-label="الانتقال للعروض والخصومات"
      >
        <span>تصفح العروض</span>
        <FiChevronDown className="w-4 h-4 animate-bounce" />
      </button>

      {/* Bottom controls & segment indicators */}
      <div className={styles.controlsBar}>
        <button
          type="button"
          className={styles.playToggleBtn}
          onClick={togglePlay}
          aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>

        <div className={styles.progressDots}>
          {segments.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => playSegment(idx)}
              className={`${styles.dot} ${
                idx === currentIndex ? styles.dotActive : ''
              }`}
              aria-label={`الانتقال للمقطع ${idx + 1}`}
            />
          ))}
        </div>

        <span className={styles.progressLabel}>
          {currentIndex + 1} / {totalSegments}
        </span>
      </div>
    </section>
  );
}
