import Link from 'next/link';

export default function HeroSlide({ slide, headingLevel = 2, index, total }) {
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div
      data-hero-slide
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}`}
      className={`relative h-full w-full shrink-0 snap-start snap-always flex flex-col justify-center overflow-hidden py-8 sm:py-10 md:py-16 ${slide.themeClassName || ''}`}
    >
      {slide.decorativeGradients && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="container-custom relative z-10 w-full">
        <div className="max-w-3xl">
          {slide.badge && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-5 ${slide.badge.className}`}
            >
              <span>{slide.badge.icon}</span>
              <span>{slide.badge.text}</span>
            </div>
          )}

          <HeadingTag
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight ${slide.titleClassName || 'text-gray-800'}`}
          >
            {slide.title}{' '}
            {slide.highlight && (
              <span className={slide.highlightClassName || 'text-gradient'}>
                {slide.highlight}
              </span>
            )}
          </HeadingTag>

          <p
            className={`text-sm sm:text-base md:text-lg mb-7 leading-relaxed max-w-xl ${slide.subtitleClassName || 'text-gray-600'}`}
          >
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            {slide.ctas.map((cta, i) => (
              <Link key={i} href={cta.href} className={cta.className}>
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
