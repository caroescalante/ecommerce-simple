import { useEffect, useState } from 'react';
import { promoBanners, BANNER_INTERVAL_MS } from '../../data/banners';
import './HeroBanner.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroBanner({ store }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = prefersReducedMotion();

  // Slide 1: el banner de siempre (imagen o arte con el lema). Luego, los promocionales.
  const slides = [
    store.banner
      ? <img src={store.banner} alt="" />
      : <div className="hero__art" aria-hidden="true"><span>{store.tagline}</span></div>,
    ...promoBanners.map((b, n) => (
      <div key={b.id} className={`hero__art hbanner__promo--${(n % 2) + 1}`}>
        <span>{b.text}</span>
      </div>
    )),
  ];
  const count = slides.length;

  // Un temporizador por imagen: al cambiar de slide (solo o con los puntos) vuelve a contar 3 s
  useEffect(() => {
    if (paused || reduced || count < 2) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), BANNER_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced, count]);

  return (
    <div
      className="hbanner"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Novedades y promociones"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hbanner__slide ${i === index ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="diapositiva"
          aria-label={`${i + 1} de ${count}`}
          aria-hidden={i !== index}
        >
          {slide}
        </div>
      ))}

      {count > 1 && (
        <div className="hbanner__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al banner ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
