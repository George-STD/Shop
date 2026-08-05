import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiArrowLeft, FiGift, FiStar, FiAward } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

const STORY_STEPS = [
  {
    range: [0, 0.32],
    badge: '✨ تجربة إهداء استثنائية',
    icon: FiStar,
    title: 'صُممت بعناية لتصنع الفارق',
    subtitle: 'استمتع بتجربة تفاعلية فريدة في كشف البوكس الفاخر أثناء السكرول.',
  },
  {
    range: [0.32, 0.68],
    badge: '🎁 تغليف 3D أنيق ومخصص',
    icon: FiGift,
    title: 'كل هداياك في مكان واحد',
    subtitle: 'تشكيلة راقية من المنتجات المختارة بعناية لتناسب كافة الأذواق والمناسبات.',
  },
  {
    range: [0.68, 1.0],
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

  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSegment, setActiveSegment] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

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

  // Sticky Scroll Scrubbing Logic (Apple Style)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalScrollableDistance = rect.height - windowHeight;

            if (totalScrollableDistance > 0) {
              const currentScroll = -rect.top;
              const rawProgress = currentScroll / totalScrollableDistance;
              const clampedProgress = Math.max(0, Math.min(1, rawProgress));

              setScrollProgress(clampedProgress);

              const targetIndex = Math.min(
                totalSegments - 1,
                Math.floor(clampedProgress * totalSegments)
              );

              if (targetIndex !== activeSegment) {
                setActiveSegment(targetIndex);

                // Ensure current video plays smoothly
                const targetVid = videoRefs.current[targetIndex];
                if (targetVid) {
                  try {
                    targetVid.currentTime = 0;
                    targetVid.play().catch(() => {});
                  } catch (_) {}
                }
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [totalSegments, activeSegment]);

  const scrollToHeroContent = useCallback(() => {
    const heroElem = document.getElementById('main-hero-content');
    if (heroElem) {
      heroElem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Determine active story card based on scrollProgress
  const activeStory =
    STORY_STEPS.find(
      (step) =>
        scrollProgress >= step.range[0] && scrollProgress <= step.range[1]
    ) || STORY_STEPS[0];

  return (
    <div
      ref={containerRef}
      className={styles.scrollContainer}
      aria-label={ariaLabel}
      id="video-scroll-sequence"
    >
      <div className={styles.stickyWrapper}>
        <div className={styles.overlay} />

        {/* Loading overlay if assets are still preloading */}
        {!allLoaded && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>جاري تحميل التجربة الـ 3D 🎁</p>
            <div className={styles.loadingBar}>
              <div
                className={styles.loadingBarFill}
                style={{ '--progress': `${loadProgress}%` }}
              />
            </div>
            <p className={styles.loadingPercent}>{loadProgress}%</p>
          </div>
        )}

        {/* Stacked Video Segments Scrubbed by Scroll */}
        {segments.map((src, idx) => (
          <video
            key={idx}
            ref={(el) => {
              videoRefs.current[idx] = el;
            }}
            src={src}
            className={styles.video}
            style={{
              opacity: idx === activeSegment ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            muted
            playsInline
            preload="auto"
            poster={poster}
            aria-hidden={idx !== activeSegment}
          />
        ))}

        {/* Floating Arabic Story Card */}
        {allLoaded && (
          <div className={styles.storyCard} key={activeStory.badge}>
            <div className={styles.badge}>
              <activeStory.icon className="w-4 h-4" />
              <span>{activeStory.badge}</span>
            </div>
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
        )}

        {/* Scroll Indicator Prompt */}
        <button
          type="button"
          onClick={scrollToHeroContent}
          className={styles.scrollHint}
          aria-label="تخطي إلى العروض"
        >
          <div className={styles.mouseIcon}>
            <div className={styles.wheelDot} />
          </div>
          <span>مرّر لأسفل للاستكشاف</span>
          <FiChevronDown className="w-4 h-4" />
        </button>

        {/* Progress Timeline at bottom edge */}
        <div className={styles.timeline}>
          <div
            className={styles.timelineFill}
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
