import { useState } from 'react';
import { slugify } from '../../utils/slugify';

// Las imágenes viven en public/img/productos/
const IMG_BASE = `${import.meta.env.BASE_URL}img/productos/`;

// Extensiones que se prueban en orden. Si usás una sola, dejá solo esa (ej. ['jpg']).
const EXTENSIONS = ['webp', 'jpg', 'png'];

function imageCandidates(product) {
  if (product.imageUrl) {
    if (/^https?:\/\//i.test(product.imageUrl)) return [product.imageUrl];
    return [IMG_BASE + encodeURIComponent(product.imageUrl.split('/').pop())];
  }
  const slug = slugify(product.name);
  return EXTENSIONS.map((ext) => `${IMG_BASE}${slug}.${ext}`);
}

export function ProductImage({ product, className = '' }) {
  const [attempt, setAttempt] = useState(0);
  const src = imageCandidates(product)[attempt];

  if (src) {
    return <img className={className} src={src} alt="" loading="lazy" onError={() => setAttempt((a) => a + 1)} />;
  }
  return (
    <div className={`ph ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M10 2h4v3l1.2 3.2c.5 1.2.8 2.2.8 3.4V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9.4c0-1.2.3-2.2.8-3.4L10 5V2z" /><path d="M8 14h8" /></svg>
    </div>
  );
}

export default ProductImage;
