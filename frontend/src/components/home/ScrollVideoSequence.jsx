import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiStar, FiAward, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

/* ═══════════════════════════════════════════════════════════════
   ScrollVideoSequence — Step-Scroll Segment Engine + Apple Showcase
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_SEGMENTS = Array.from(
  { length: 8 },
  (_, i) => `/videos/segment-${i + 1}.mp4`
);

const CHAPTER_STEPS = [
  {
    phase: 0,
    range: [0, 2],
    chapterNum: '01',
    chapterLabel: 'الافتتاح',
    badge: '✨ دخول بصري هادئ وواضح',
    icon: FiStar,
    title: 'فور يو تبدأ بهدوء ثم تثبت الانطباع',
    subtitle:
      'المشهد الأول يقدّم البراند كواجهة أنيقة بدل فيديو صاخب، بحيث يشعر المستخدم أن الحركة جزء طبيعي من الموقع.',
  },
  {
    phase: 1,
    range: [3, 5],
    chapterNum: '02',
    chapterLabel: 'القيمة',
    badge: '🎁 إبراز المنتج والتفاصيل',
    icon: FiGift,
    title: 'المشهد يوضح الفخامة بدون تشويش',
    subtitle:
      'هنا تتبدل الطبقات والرسالة بوضوح: المنتج يبقى في المركز بينما النص يشرح القيمة بشكل مباشر ومقنع.',
  },
  {
    phase: 2,
    range: [6, 7],
    chapterNum: '03',
    chapterLabel: 'التحويل',
    badge: '👑 انتقال طبيعي إلى الإجراء',
    icon: FiAward,
    title: 'المشهد الأخير يقود لخطوة واضحة',
    subtitle:
      'بدل أن ينتهي التأثير فجأة، يختتم المشهد برسالة خفيفة تدفع المستخدم لبدء الاختيار أو بناء بوكسه.',
    cta: {
      text: 'صمّم بوكس هديتك الآن',
      url: '/build-a-box',
    },
  },
];

/* ── 1. Detect prefers-reduced-motion ─────────────────────── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/* ── 2. StoryCard — transitionend-driven (no brittle setTimeout) ── */
function StoryCard({ chapter, reducedMotion, onCtaClick }) {
  const cardRef = useRef(null);
  const [displayChapter, setDisplayChapter] = useState(chapter);
  const [state, setState] = useState('idle'); // idle | exit | enter

  const chapterRef = useRef(chapter);
  chapterRef.current = chapter;

  useLayoutEffect(() => {
    if (chapter.phase === displayChapter.phase) return;
    if (reducedMotion) {
      setDisplayChapter(chapter);
      return;
    }
    setState('exit');
  }, [chapter.phase, displayChapter.phase, reducedMotion]);

  const handleTransitionEnd = useCallback(
    (e) => {
      if (e.target !== cardRef.current) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;

      if (state === 'exit') {
        setDisplayChapter(chapterRef.current);
        setState('enter');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setState('idle');
          });
        });
      }
    },
    [state]
  );

  const cardClass =
    state === 'exit'
      ? styles.cardExit
      : state === 'enter'
      ? styles.cardEnter
      : styles.cardIdle;

  const ch = displayChapter;
  const Icon = ch.icon;

  return (
    <div
      ref={cardRef}
      className={`${styles.storyCard} ${cardClass}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div data-stagger="0" className={styles.badge}>
        <Icon className="w-4 h-4" />
        <span>{ch.badge}</span>
      </div>

      <div className={styles.cardTextWrapper}>
        <h3 data-stagger="1" className={styles.title}>
          {ch.title}
        </h3>
        <p data-stagger="2" className={styles.subtitle}>
          {ch.subtitle}
        </p>

        <div data-stagger="3">
          {ch.cta ? (
            <Link to={ch.cta.url} className={styles.ctaBtn}>
              <span>{ch.cta.text}</span>
              <FiArrowLeft className="w-4 h-4" />
            </Link>
          ) : (
            <button type="button" onClick={onCtaClick} className={styles.ctaBtn}>
              <span>استكشف البوكسات</span>
              <FiArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 3. Main Step-Scroll Component ─────────────────────────── */
export default function ScrollVideoSequence({
  segments = DEFAULT_SEGMENTS,
  poster = null,
  ariaLabel = 'تجربة تفاعلية 3D لاستكشاف بوكس الهدايا',
  scrollSpeed = 1.0, // Multiplier for scroll speed sensitivity (e.g. 0.5 = slower, 1.5 = faster)
  scrollCooldown = 150, // Cooldown in ms between segment steps (lower = faster)
}) {
  const totalSegments = segments.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRefs = useRef([]);
  const currentIndexRef = useRef(0);
  const isActiveRef = useRef(true);
  const cooldownRef = useRef(false);
  const cooldownTimer = useRef(null);
  const touchStartY = useRef(0);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    const currentChapter =
      CHAPTER_STEPS.find(
        (ch) => currentIndex >= ch.range[0] && currentIndex <= ch.range[1]
      ) || CHAPTER_STEPS[0];
    setActivePhase(currentChapter.phase);
  }, [currentIndex]);

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
        if (loadedCount >= Math.min(3, totalSegments)) {
          setVideoReady(true);
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

  // Play target video segment
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

  const jumpToPhase = useCallback(
    (phaseIndex) => {
      const targetStep = CHAPTER_STEPS[phaseIndex];
      const targetIdx = targetStep.range[0];
      playSegment(targetIdx);
    },
    [playSegment]
  );

  const scrollToHeroContent = useCallback(() => {
    const heroElem = document.getElementById('main-hero-content');
    if (heroElem) {
      heroElem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Step-scroll handler with configurable scrollSpeed & cooldown
  const handleStepScroll = useCallback(
    (direction, e) => {
      if (cooldownRef.current) {
        if (e && e.cancelable) e.preventDefault();
        return;
      }

      const cIdx = currentIndexRef.current;
      const effectiveCooldown = Math.max(50, Math.round(scrollCooldown / scrollSpeed));

      if (direction === 'down') {
        if (cIdx < totalSegments - 1) {
          if (e && e.cancelable) e.preventDefault();
          playSegment(cIdx + 1);

          cooldownRef.current = true;
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => {
            cooldownRef.current = false;
          }, effectiveCooldown);
        } else {
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
          }, effectiveCooldown);
        } else {
          setIsActive(false);
          isActiveRef.current = false;
        }
      }
    },
    [totalSegments, playSegment, scrollSpeed, scrollCooldown]
  );

  // Wheel listener
  useEffect(() => {
    if (!videoReady || reducedMotion) return;

    const onWheel = (e) => {
      if (!isActiveRef.current) return;

      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const inView =
        rect.top <= window.innerHeight * 0.4 &&
        rect.bottom >= window.innerHeight * 0.6;

      if (!inView) return;

      const threshold = 10 / scrollSpeed;
      if (Math.abs(e.deltaY) < threshold) return;

      const dir = e.deltaY > 0 ? 'down' : 'up';
      handleStepScroll(dir, e);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [videoReady, reducedMotion, handleStepScroll, scrollSpeed]);

  // Touch listener for mobile
  useEffect(() => {
    if (!videoReady || reducedMotion) return;

    const track = trackRef.current;
    if (!track) return;

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
      const threshold = 25 / scrollSpeed;

      if (Math.abs(deltaY) < threshold) return;

      const dir = deltaY > 0 ? 'down' : 'up';
      handleStepScroll(dir, e);
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, [videoReady, reducedMotion, handleStepScroll, scrollSpeed]);

  // IntersectionObserver to re-engage active scroll lock when entering view
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isActiveRef.current = true;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const activeChapter = CHAPTER_STEPS[activePhase];

  return (
    <div
      ref={trackRef}
      className={styles.scrollTrack}
      aria-label={ariaLabel}
      id="video-scroll-sequence"
      style={{ height: '300vh' }}
    >
      {/* Pinned Sticky Viewport (100vh) */}
      <div ref={viewportRef} className={styles.stickyViewport}>
        {/* Ambient Glowing Orbs & Sparkles */}
        <div className={styles.glowSphere1} />
        <div className={styles.glowSphere2} />
        <div className={styles.ambientSparkles} />

        {/* Top & Bottom Vignette Gradient Overlays */}
        <div className={styles.topOverlay} />
        <div className={styles.bottomOverlay} />

        {/* Loading Overlay */}
        {!videoReady && (
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

        {/* Video Segments Layer */}
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
                opacity: idx === currentIndex ? 0.92 : 0,
                pointerEvents: 'none',
                transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              muted
              playsInline
              preload="auto"
              poster={poster}
              aria-hidden={idx !== currentIndex}
            />
          ))}
        </div>

        {/* Glassmorphic Story Card */}
        {videoReady && (
          <div className={`${styles.cardViewport} ${styles.cardViewportVisible}`}>
            <StoryCard
              chapter={activeChapter}
              reducedMotion={reducedMotion}
              onCtaClick={scrollToHeroContent}
            />
          </div>
        )}

        {/* Synchronized Chapter Pill Indicator Bar */}
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
              <span>
                {ch.chapterNum}. {ch.chapterLabel}
              </span>
            </button>
          ))}
        </div>

        {/* Scroll Hint Indicator */}
        <div className={styles.scrollHint}>
          <span>مرّر لأسفل للاستكشاف ({currentIndex + 1} / {totalSegments})</span>
          <FiChevronDown className="w-4 h-4 animate-bounce" />
        </div>

        {/* Progress Timeline Track */}
        <div className={styles.timelineTrack}>
          <div
            className={styles.timelineFill}
            style={{ width: `${((currentIndex + 1) / totalSegments) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
