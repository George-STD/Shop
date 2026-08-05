import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiGift, FiStar, FiAward } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

const STORY_STEPS = [
  {
    range: [0, 2],
    badge: '✨ تجربة إهداء استثنائية',
    icon: FiStar,
    title: 'صُممت بعناية لتصنع الفارق',
    subtitle: 'استمتع بتجربة تفاعلية فريدة في كشف البوكس الفاخر أثناء السكرول.',
  },
  {
    range: [3, 5],
    badge: '🎁 تغليف 3D أنيق ومخصص',
    icon: FiGift,
    title: 'كل هداياك في مكان واحد',
    subtitle: 'تشكيلة راقية من المنتجات المختارة بعناية لتناسب كافة الأذواق والمناسبات.',
  },
  {
    range: [6, 7],
    badge: '👑 جاهز للإهداء المباشر',
    icon: FiAward,
    title: 'ابحث عن هديتك المثالية الآن',
    subtitle: 'توصيل سريع وتغليف مجاني لكل أنحاء مصر لباب البيت.',
    cta: {
      text: 'صمّم بوكس هديتك الآن ←',
      url: '/build-a-box',
    },
  },
];

export default function ScrollVideoSequence({
  segments = DEFAULT_SEGMENTS,
  poster = null,
  ariaLabel = 'تجربة تفاعلية 3D لاستكشاف بوكس الهدايا',
}) {
  const totalSegments = segments.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const currentIndexRef = useRef(0);
  const isActiveRef = useRef(true);
  const cooldownRef = useRef(false);
  const cooldownTimer = useRef(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Preload videos into memory
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

          const t = setTimeout(() => checkLoaded(idx), 2000);
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

  // Play specific segment
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

      const vid = videoRefs.current[targetIndex];
      if (vid) {
        try {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } catch (_) {}
      }
    },
    [totalSegments]
  );

  const scrollToHeroContent = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    const heroElem = document.getElementById('main-hero-content');
    if (heroElem) {
      heroElem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Fast Step Scroll Handler (Wheel & Touch)
  const handleStepScroll = useCallback(
    (direction, e) => {
      if (cooldownRef.current) {
        if (e && e.cancelable) e.preventDefault();
        return;
      }

      const cIdx = currentIndexRef.current;

      if (direction === 'down') {
        if (cIdx < totalSegments - 1) {
          if (e && e.cancelable) e.preventDefault();
          playSegment(cIdx + 1);

          // Fast 120ms cooldown for snappy stepping
          cooldownRef.current = true;
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => {
            cooldownRef.current = false;
          }, 120);
        } else {
          // Reached end of animation -> release lock for smooth scroll to Hero
          setIsActive(false);
          isActiveRef.current = false;
        }
      } else if (direction === 'up') {
        if (cIdx > 0) {
          if (e && e.cancelable) e.preventDefault();
          playSegment(cIdx - 1);

          cooldownRef.current = true;
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => {
            cooldownRef.current = false;
          }, 120);
        } else {
          // Reached top of animation -> release lock for smooth scroll to Header
          setIsActive(false);
          isActiveRef.current = false;
        }
      }
    },
    [totalSegments, playSegment]
  );

  // Attach Wheel Listener
  useEffect(() => {
    if (!allLoaded) return;

    const onWheel = (e) => {
      if (!isActiveRef.current) return;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const inView =
        rect.top <= window.innerHeight * 0.4 &&
        rect.bottom >= window.innerHeight * 0.6;

      if (!inView) return;

      if (Math.abs(e.deltaY) < 5) return;

      const dir = e.deltaY > 0 ? 'down' : 'up';
      handleStepScroll(dir, e);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [allLoaded, handleStepScroll]);

  // Attach Touch Listener for Mobile
  useEffect(() => {
    if (!allLoaded) return;

    const section = sectionRef.current;
    if (!section) return;

    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (isActiveRef.current) {
        const deltaY = touchStartY.current - e.touches[0].clientY;
        if (Math.abs(deltaY) > 8 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e) => {
      if (!isActiveRef.current) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 20) return;

      const dir = deltaY > 0 ? 'down' : 'up';
      handleStepScroll(dir, e);
    };

    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchmove', onTouchMove, { passive: false });
    section.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchmove', onTouchMove);
      section.removeEventListener('touchend', onTouchEnd);
    };
  }, [allLoaded, handleStepScroll]);

  // Re-engage lock when scrolling back into section
  useEffect(() => {
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
  }, []);

  // Determine active story card based on currentIndex
  const activeStory =
    STORY_STEPS.find(
      (step) => currentIndex >= step.range[0] && currentIndex <= step.range[1]
    ) || STORY_STEPS[0];

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label={ariaLabel}
      id="video-step-sequence"
    >
      <div className={styles.overlay} />
      <div className={styles.bottomFade} />

      {/* Loading overlay if preloading */}
      {!allLoaded && (
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
      )}

      {/* Stacked Video Segments */}
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
            pointerEvents: 'none',
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          muted
          playsInline
          preload="auto"
          poster={poster}
          aria-hidden={idx !== currentIndex}
        />
      ))}

      {/* Dynamic Floating Arabic Story Card */}
      {allLoaded && (
        <div className={styles.storyCard} key={activeStory.badge}>
          <div className={styles.badge}>
            <activeStory.icon className="w-4 h-4" />
            <span>{activeStory.badge}</span>
          </div>
          <div className={styles.storyCardText}>
            <h3 className={styles.title}>{activeStory.title}</h3>
            <p className={styles.subtitle}>{activeStory.subtitle}</p>

            {activeStory.cta ? (
              <Link to={activeStory.cta.url} className={styles.ctaBtn}>
                <span>{activeStory.cta.text}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={scrollToHeroContent}
                className={styles.ctaBtn}
              >
                <span>تصفح المنتجات ←</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Skip to Hero Button */}
      <button
        type="button"
        className={styles.skipButton}
        onClick={scrollToHeroContent}
        aria-label="تخطي الأنيميشن"
      >
        <span>تخطي الأنيميشن ↓</span>
      </button>

      {/* Stepped Progress Indicator */}
      <div className={styles.progressIndicator}>
        <div className={styles.progressDots}>
          {segments.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => playSegment(idx)}
              className={`${styles.dot} ${
                idx === currentIndex ? styles.dotActive : ''
              }`}
              aria-label={`المرحلة ${idx + 1}`}
            />
          ))}
        </div>
        <span className={styles.progressText}>
          {currentIndex + 1} / {totalSegments}
        </span>
      </div>
    </section>
  );
}
