import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiStar, FiAward, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

const CHAPTER_STEPS = [
  {
    phase: 0,
    range: [0, 0.33],
    chapterNum: '01',
    chapterLabel: 'كشف البوكس',
    badge: '✨ تجربة إهداء استثنائية',
    icon: FiStar,
    title: 'صُممت بعناية لتصنع الفارق',
    subtitle: 'استمتع بتجربة تفاعلية فريدة في استكشاف تفاصيل البوكس الفاخر مع حركتك على المتجر.',
  },
  {
    phase: 1,
    range: [0.33, 0.66],
    chapterNum: '02',
    chapterLabel: 'المحتويات والتغليف',
    badge: '🎁 تغليف 3D أنيق ومخصص',
    icon: FiGift,
    title: 'كل هداياك في مكان واحد',
    subtitle: 'تشكيلة راقية من المنتجات المختارة بعناية تشمل المحفظة، العطر الفاخر، والقلم.',
  },
  {
    phase: 2,
    range: [0.66, 1.0],
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
  ariaLabel = 'تجربة تفاعلية سينمائية 3D لاستكشاف بوكس الهدايا',
}) {
  const totalSegments = segments.length;

  const trackRef = useRef(null);
  const videoRefs = useRef([]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSegment, setActiveSegment] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Preload video segments
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

  // Scroll Scrubbing & Frame Interpolation via RAF
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const track = trackRef.current;
          if (track) {
            const rect = track.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const scrollableDistance = rect.height - windowHeight;

            if (scrollableDistance > 0) {
              const currentScroll = -rect.top;
              const rawProgress = currentScroll / scrollableDistance;
              const clampedProgress = Math.max(0, Math.min(1, rawProgress));

              setScrollProgress(clampedProgress);

              // Map scrollProgress (0 to 1) to segment (0 to 7)
              const targetSegment = Math.min(
                totalSegments - 1,
                Math.floor(clampedProgress * totalSegments)
              );

              if (targetSegment !== activeSegment) {
                setActiveSegment(targetSegment);

                const targetVid = videoRefs.current[targetSegment];
                if (targetVid) {
                  try {
                    targetVid.currentTime = 0;
                    targetVid.play().catch(() => {});
                  } catch (_) {}
                }
              }

              // Determine chapter phase (0, 1, or 2)
              const currentChapter = CHAPTER_STEPS.find(
                (ch) =>
                  clampedProgress >= ch.range[0] &&
                  clampedProgress <= ch.range[1]
              ) || CHAPTER_STEPS[0];

              if (currentChapter.phase !== activePhase) {
                setIsCardAnimating(true);
                setActivePhase(currentChapter.phase);

                setTimeout(() => {
                  setIsCardAnimating(false);
                }, 150);
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
  }, [totalSegments, activeSegment, activePhase]);

  // Jump to specific chapter phase when clicking pills
  const jumpToPhase = useCallback(
    (phaseIndex) => {
      const track = trackRef.current;
      if (track) {
        const targetStep = CHAPTER_STEPS[phaseIndex];
        const targetProgress = (targetStep.range[0] + targetStep.range[1]) / 2;
        const trackTop = track.offsetTop;
        const scrollableDistance = track.offsetHeight - window.innerHeight;
        const targetScroll = trackTop + targetProgress * scrollableDistance;

        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    },
    []
  );

  const activeChapter = CHAPTER_STEPS[activePhase];

  return (
    <div
      ref={trackRef}
      className={styles.scrollTrack}
      aria-label={ariaLabel}
      id="video-scroll-sequence"
    >
      {/* Pinned Sticky Viewport (100vh) */}
      <div className={styles.stickyViewport}>
        {/* Ambient Glowing Orbs */}
        <div className={styles.glowSphere1} />
        <div className={styles.glowSphere2} />

        {/* Top & Bottom Vignette Gradient Overlays */}
        <div className={styles.topOverlay} />
        <div className={styles.bottomOverlay} />

        {/* Loading Overlay */}
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

        {/* Full-Screen Video Mask Layer */}
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

        {/* Glassmorphic Story Card with Fade In/Out + Y-Slide Keyframed Animations */}
        {allLoaded && (
          <div
            className={`${styles.storyCard} ${
              isCardAnimating ? styles.cardEntering : styles.cardActive
            }`}
            key={activePhase}
          >
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
                  onClick={() => jumpToPhase(2)}
                  className={styles.ctaBtn}
                >
                  <span>استكشف البوكسات</span>
                  <FiArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Synchronized Chapter Pill Indicator Bar (Lockstep Sync) */}
        <div className={styles.chapterPillBar}>
          {CHAPTER_STEPS.map((ch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => jumpToPhase(idx)}
              className={`${styles.chapterBtn} ${
                activePhase === idx ? styles.chapterBtnActive : ''
              }`}
            >
              <span>{ch.chapterNum}. {ch.chapterLabel}</span>
            </button>
          ))}
        </div>

        {/* Scroll Hint Indicator */}
        <div className={styles.scrollHint}>
          <span>مرّر لأسفل للاستكشاف</span>
          <FiChevronDown className="w-4 h-4 animate-bounce" />
        </div>

        {/* Progress Timeline Track at Bottom Edge */}
        <div className={styles.timelineTrack}>
          <div
            className={styles.timelineFill}
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
