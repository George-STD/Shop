import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiStar, FiAward, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from './ScrollVideoSequence.module.css';

/* ═══════════════════════════════════════════════════════════════
   ScrollVideoSequence — Apple-grade scroll-scrubbed cinematic
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_VIDEO_SRC = '/videos/hero-sequence.mp4';

const CHAPTER_STEPS = [
  {
    phase: 0,
    range: [0, 0.33],
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
    range: [0.33, 0.66],
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
    range: [0.66, 1.0],
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

/* ── 2. StoryCard — transitionend-driven (no brittle setTimeout)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StoryCard({ chapter, reducedMotion, onCtaClick }) {
  const cardRef = useRef(null);
  const [displayChapter, setDisplayChapter] = useState(chapter);
  const [state, setState] = useState('idle'); // idle | exit | enter

  const chapterRef = useRef(chapter);
  chapterRef.current = chapter;

  // Kick exit when incoming chapter changes
  useLayoutEffect(() => {
    if (chapter.phase === displayChapter.phase) return;
    if (reducedMotion) {
      setDisplayChapter(chapter);
      return;
    }
    setState('exit');
  }, [chapter, displayChapter.phase, reducedMotion]);

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

/* ── 3. Main Component ─────────────────────────────────────── */
export default function ScrollVideoSequence({
  segments,
  videoSrc = segments?.[0] ?? DEFAULT_VIDEO_SRC,
  poster = null,
  ariaLabel = 'تجربة تفاعلية سينمائية 3D لاستكشاف بوكس الهدايا',
}) {
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRef = useRef(null);
  const timelineFillRef = useRef(null);

  const [activePhase, setActivePhase] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const reducedMotion = useReducedMotion();

  // Smoothing & Lerp Refs for rAF Loop
  const targetProgressRef = useRef(0);
  const displayedProgressRef = useRef(0);
  const lastSeekingTimeRef = useRef(-1);
  const phaseRef = useRef(0);
  const tickingRef = useRef(false);
  const isIntersectingRef = useRef(false);

  /* ── 3a. Video preload & metadata ───────────────────────── */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onLoadedMeta = () => {
      if (vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
        setVideoDuration(vid.duration);
      }
      vid.pause();
      if (vid.readyState >= 3) {
        setVideoReady(true);
        setLoadProgress(100);
      }
    };

    const onCanPlayThrough = () => {
      vid.pause();
      if (vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
        setVideoDuration(vid.duration);
      }
      setVideoReady(true);
      setLoadProgress(100);
    };

    const onProgress = () => {
      if (vid.duration && vid.buffered.length > 0) {
        const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
        const pct = Math.min(100, Math.round((bufferedEnd / vid.duration) * 100));
        setLoadProgress(pct);
        if (pct >= 85 || vid.readyState >= 3) {
          setVideoReady(true);
        }
      }
    };

    if (vid.readyState >= 3) {
      onLoadedMeta();
    }

    vid.addEventListener('loadedmetadata', onLoadedMeta);
    vid.addEventListener('canplaythrough', onCanPlayThrough);
    vid.addEventListener('progress', onProgress);

    return () => {
      vid.removeEventListener('loadedmetadata', onLoadedMeta);
      vid.removeEventListener('canplaythrough', onCanPlayThrough);
      vid.removeEventListener('progress', onProgress);
    };
  }, [videoSrc]);

  /* ── 3b. Scroll Listener (Measures raw target progress) ──── */
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return;

    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const winH = window.innerHeight;

      const scrollableDistance = rect.height - winH;
      if (scrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = currentScroll / scrollableDistance;

      targetProgressRef.current = Math.max(0, Math.min(1, rawProgress));

      if (!tickingRef.current && isIntersectingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(runAnimationLoop);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
    // `runAnimationLoop` is a stable useCallback defined below; including it
    // here would be a temporal-dead-zone error because the const is declared
    // after this effect, so it is intentionally omitted from the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* ── 3c. Smooth rAF Animation Loop (Lerp + Video Scrubbing + Ambient Micro-Breathing) ── */
  const runAnimationLoop = useCallback(() => {
    if (!isIntersectingRef.current && Math.abs(targetProgressRef.current - displayedProgressRef.current) < 0.0005) {
      tickingRef.current = false;
      return;
    }

    const vid = videoRef.current;
    const target = targetProgressRef.current;
    let current = displayedProgressRef.current;

    // Lerp smoothing (0.12 factor gives Apple-style spring inertia)
    const smoothingFactor = 0.12;
    const diff = target - current;

    if (Math.abs(diff) > 0.0001) {
      current += diff * smoothingFactor;
    } else {
      current = target;
    }

    displayedProgressRef.current = current;

    // Organic ambient breathing when idle (sine wave oscillation)
    const now = Date.now() / 1000;
    const ambientBreath = Math.sin(now * 1.5) * 0.0025; // subtle 0.25% float
    const effectiveProgress = Math.max(0, Math.min(1, current + ambientBreath));

    // Ease progress for UI transforms
    const eased = effectiveProgress < 0.5 ? 2 * effectiveProgress * effectiveProgress : 1 - Math.pow(-2 * effectiveProgress + 2, 2) / 2;

    // 1. Scrub Video currentTime with ambient breath
    if (vid && vid.readyState >= 2 && vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
      const targetTime = effectiveProgress * vid.duration;
      if (Math.abs(targetTime - lastSeekingTimeRef.current) > 0.01) {
        lastSeekingTimeRef.current = targetTime;
        if (typeof vid.fastSeek === 'function') {
          vid.fastSeek(targetTime);
        } else {
          vid.currentTime = targetTime;
        }
      }
    }

    // 2. Lockstep Chapter Pill & Text Card
    const currentChapter =
      CHAPTER_STEPS.find((ch) => current >= ch.range[0] && current <= ch.range[1]) || CHAPTER_STEPS[0];

    if (currentChapter.phase !== phaseRef.current) {
      phaseRef.current = currentChapter.phase;
      setActivePhase(currentChapter.phase);
    }

    // 3. Update Timeline Fill
    if (timelineFillRef.current) {
      timelineFillRef.current.style.width = `${(current * 100).toFixed(2)}%`;
    }

    // 4. Update Viewport CSS Variables for Smooth Pan, Zoom & Idle Floating
    if (viewportRef.current) {
      const idleFloatX = Math.sin(now * 1.2) * 8;
      const idleFloatY = Math.cos(now * 1.4) * 6;

      viewportRef.current.style.setProperty('--story-progress', current.toFixed(3));
      viewportRef.current.style.setProperty('--story-eased', eased.toFixed(3));
      viewportRef.current.style.setProperty('--camera-scale', (1.02 + current * 0.08 + Math.sin(now) * 0.008).toFixed(3));
      viewportRef.current.style.setProperty('--camera-x', `${(((current - 0.5) * 24) + idleFloatX).toFixed(1)}px`);
      viewportRef.current.style.setProperty('--camera-y', `${(((0.5 - current) * 16) + idleFloatY).toFixed(1)}px`);
      viewportRef.current.style.setProperty('--overlay-strength', (0.72 - current * 0.18).toFixed(3));
    }

    // Keep loop active while section is in viewport for continuous living ambient motion
    if (isIntersectingRef.current) {
      requestAnimationFrame(runAnimationLoop);
    } else {
      tickingRef.current = false;
    }
  }, []);

  /* ── 3d. IntersectionObserver for Loop Control ─────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackEl = trackRef.current;
    if (!trackEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersectingRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !tickingRef.current && !reducedMotion) {
            tickingRef.current = true;
            requestAnimationFrame(runAnimationLoop);
          }
        });
      },
      { threshold: 0.01, rootMargin: '200px 0px 200px 0px' }
    );

    observer.observe(trackEl);
    return () => observer.disconnect();
  }, [runAnimationLoop, reducedMotion]);

  /* ── 3e. Jump-to-phase helper (chapter pills / CTA) ──────── */
  const jumpToPhase = useCallback((phaseIndex) => {
    const track = trackRef.current;
    if (!track) return;

    const targetStep = CHAPTER_STEPS[phaseIndex];
    const targetProgress = (targetStep.range[0] + targetStep.range[1]) / 2;
    const trackTop = track.offsetTop;
    const scrollableDistance = track.offsetHeight - window.innerHeight;
    const targetScroll = trackTop + targetProgress * scrollableDistance;

    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  }, []);

  const activeChapter = CHAPTER_STEPS[activePhase];

  /* ── 3f. Visibility-based entrance (IntersectionObserver) ── */
  const cardWrapRef = useRef(null);
  const [cardInView, setCardInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setCardInView(true);
      return;
    }

    const el = cardWrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCardInView(true);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={trackRef}
      className={styles.scrollTrack}
      aria-label={ariaLabel}
      id="video-scroll-sequence"
      style={{
        height: videoDuration > 0 ? `${Math.max(240, Math.round(videoDuration * 22))}vh` : '300vh',
      }}
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

        {/* Single Full-Screen Video Layer */}
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            src={videoSrc}
            className={styles.video}
            muted
            playsInline
            preload="auto"
            poster={poster}
            aria-hidden="false"
          />
        </div>

        {/* Glassmorphic Story Card — transitionend-driven */}
        {videoReady && (
          <div
            ref={cardWrapRef}
            className={`${styles.cardViewport} ${
              cardInView ? styles.cardViewportVisible : ''
            }`}
          >
            <StoryCard
              chapter={activeChapter}
              reducedMotion={reducedMotion}
              onCtaClick={() => jumpToPhase(2)}
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
          <span>مرّر لأسفل للاستكشاف</span>
          <FiChevronDown className="w-4 h-4 animate-bounce" />
        </div>

        {/* Progress Timeline Track at Bottom Edge */}
        <div className={styles.timelineTrack}>
          <div ref={timelineFillRef} className={styles.timelineFill} />
        </div>
      </div>
    </div>
  );
}
