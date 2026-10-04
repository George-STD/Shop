import { HERO_SLIDES } from './heroSlides';
import HeroSlide from './HeroSlide';
import HeroCarouselController from './HeroCarouselController';
import { API_URL } from '../../../constants/config';

async function getLoyaltyEnabled() {
  try {
    const res = await fetch(`${API_URL}/settings/loyalty`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return true;
    const json = await res.json();
    return json?.data?.enabled !== false;
  } catch {
    return true; // Fallback to enabled on failure/timeout
  }
}

export default async function HeroSection() {
  const loyaltyEnabled = await getLoyaltyEnabled();

  const slides = [
    HERO_SLIDES.brand,
    loyaltyEnabled ? HERO_SLIDES.loyalty : null,
    HERO_SLIDES.discount,
  ].filter(Boolean);

  return (
    <section
      id="main-hero-content"
      aria-roledescription="carousel"
      aria-label="عروض فور يو"
      className="hero-gradient relative h-[420px] sm:h-[450px] md:h-[550px] min-h-[420px] sm:min-h-[450px] md:min-h-[550px] max-h-[420px] sm:max-h-[450px] md:max-h-[550px] overflow-hidden"
    >
      <div
        id="hero-track"
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-none"
      >
        {slides.map((slide, i) => (
          <HeroSlide
            key={slide.id}
            slide={slide}
            headingLevel={i === 0 ? 1 : 2}
            index={i}
            total={slides.length}
          />
        ))}
      </div>
      <HeroCarouselController trackId="hero-track" count={slides.length} />
    </section>
  );
}
