import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiStar, FiAward, FiArrowLeft } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

const CHAPTER_STEPS = [
  {
    range: [0, 0.35],
    chapterNum: '01',
    chapterLabel: 'كشف البوكس',
    badge: '✨ تجربة إهداء استثنائية',
    icon: FiStar,
    title: 'صُممت بعناية لتصنع الفارق',
    subtitle: 'استمتع بتجربة تفاعلية فريدة في استكشاف تفاصيل البوكس الفاخر مع حركتك على المتجر.',
  },
  {
    range: [0.35, 0.7],
    chapterNum: '02',
    chapterLabel: 'المحتويات والتغليف',
    badge: '🎁 تغليف 3D أنيق ومخصص',
    icon: FiGift,
    title: 'كل هداياك في مكان واحد',
    subtitle: 'تشكيلة راقية من المنتجات المختارة بعناية لتناسب كافة الأذواق والمناسبات السعيدة.',
  },
  {
    range: [0.7, 1.0],
    chapterNum: '03',
    chapterLabel: 'جاهز للإهداء',
    badge: '👑 جاهز للإهداء المباشر',
    icon: FiAward,
    title: 'ابحث عن هديتك المثالية الآن',
    subtitle: 'توصيل سريع وتغليف فاخر مجاني لكل أنحاء مصر لباب البيت مباشرة.',
    cta: {
      text: 'صمّم بوكس هديتك الآن',
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

  // Smooth Scroll Scrubbing driven naturally by window scroll
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
            const totalScrollable = rect.height - windowHeight;

            if (totalScrollable > 0) {
              const currentScroll = -rect.top;
              const rawProgress = currentScroll / totalScrollable;
              const clampedProgress = Math.max(0, Math.min(1, rawProgress));

              setScrollProgress(clampedProgress);

              const targetIndex = Math.min(
                totalSegments - 1,
                Math.floor(clampedProgress * totalSegments)
              );

              if (targetIndex !== activeSegment) {
                setActiveSegment(targetIndex);

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
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [totalSegments, activeSegment]);

  const jumpToProgress = (targetProgress) => {
    const container = containerRef.current;
    if (container) {
      const containerTop = container.offsetTop;
      const totalScrollable = container.offsetHeight - window.innerHeight;
      const targetScroll = containerTop + targetProgress * totalScrollable;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  const activeChapter =
    CHAPTER_STEPS.find(
      (step) =>
        scrollProgress >= step.range[0] && scrollProgress <= step.range[1]
    ) || CHAPTER_STEPS[0];

  return (
    <div
      ref={containerRef}
      className={styles.container}
      aria-label={ariaLabel}
      id="video-scroll-sequence"
    >
      <div className={styles.stickyFrame}>
        {/* Ambient Glowing Orbs */}
        <div className={styles.glowSphere1} />
        <div className={styles.glowSphere2} />

        {/* Soft Vignette Overlays for smooth header and footer blending */}
        <div className={styles.topOverlay} />
        <div className={styles.bottomOverlay} />

        {/* Loading Overlay */}
        {!allLoaded && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>جاري تجهيز التجربة الـ 3D 🎁</p>
            <div className={styles.loadingBar}>
              <div
                className={styles.loadingBarFill}
                style={{ '--progress': `${loadProgress}%` }}
              />
            </div>
            <p className={styles.loadingPercent}>{loadProgress}%</p>
          </div>
        )}

        {/* Video Mask Container */}
        <div className={styles.videoWrapper}>
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
              }}
              muted
              playsInline
              preload="auto"
              poster={poster}
              aria-hidden={idx !== activeSegment}
            />
          ))}
        </div>

        {/* Glassmorphic Content Card */}
        {allLoaded && (
          <div className={styles.contentCard} key={activeChapter.badge}>
            <div className={styles.badge}>
              <activeChapter.icon className="w-4 h-4" />
              <span>{activeChapter.badge}</span>
            </div>
            <div className={styles.cardTextWrapper}>
              <h3 className={styles.title}>{activeChapter.title}</h3>
              <p className={styles.subtitle}>{activeChapter.subtitle}</p>

              {activeChapter.cta ? (
                <Link to={activeChapter.cta.url} className={styles.ctaBtn}>
                  <span>{activeChapter.cta.text}</span>
                  <FiArrowLeft className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => jumpToProgress(0.75)}
                  className={styles.ctaBtn}
                >
                  <span>استكشف البوكسات</span>
                  <FiArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chapter Pill Selector */}
        <div className={styles.chapterPill}>
          {CHAPTER_STEPS.map((ch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => jumpToProgress((ch.range[0] + ch.range[1]) / 2)}
              className={`${styles.chapterBtn} ${
                activeChapter.chapterNum === ch.chapterNum
                  ? styles.chapterBtnActive
                  : ''
              }`}
            >
              <span>{ch.chapterNum}. {ch.chapterLabel}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Progress Timeline */}
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
