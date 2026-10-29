import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import './ProductCard.css';

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

// Las imágenes viven en public/Assets/productos/ (Vite las sirve desde /Assets/productos/)
const IMG_BASE = `${import.meta.env.BASE_URL}img/productos/`;

// Extensiones que se prueban en orden. Si usás una sola, dejá solo esa (ej. ['jpg']).
const EXTENSIONS = ['webp', 'jpg', 'png'];

// "Bidón agua 6.5 L" -> "bidon-agua-6-5-l"
export const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Lista de URLs posibles, en orden de prioridad.
function imageCandidates(product) {
  // 1) Si la base trae imagen_url, se usa (quedándose con el nombre del archivo)
  if (product.imageUrl) {
    if (/^https?:\/\//i.test(product.imageUrl)) return [product.imageUrl];
    return [IMG_BASE + encodeURIComponent(product.imageUrl.split('/').pop())];
  }
  // 2) Si no, se arma desde la descripción del producto
  const slug = slugify(product.name);
  return EXTENSIONS.map((ext) => `${IMG_BASE}${slug}.${ext}`);
}

export function ProductImage({ product, className = '' }) {
  const [attempt, setAttempt] = useState(0);
  const src = imageCandidates(product)[attempt];

  if (src) {
    // Si el archivo no existe, onError prueba la siguiente extensión y al final muestra el ícono
    return <img className={className} src={src} alt="" loading="lazy" onError={() => setAttempt((a) => a + 1)} />;
  }
  return (
    <div className={`ph ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M10 2h4v3l1.2 3.2c.5 1.2.8 2.2.8 3.4V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9.4c0-1.2.3-2.2.8-3.4L10 5V2z" /><path d="M8 14h8" /></svg>
    </div>
  );
}

export default function ProductCard({ product }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(product.id);
  const soldOut = product.stock === 0;
  const atMax = product.stock != null && qty >= product.stock;

  return (
    <li className={`pcard ${soldOut ? 'is-soldout' : ''}`}>
      <div className="pcard__media">
        <ProductImage product={product} />
        {soldOut && <span className="pcard__tag">Sin stock</span>}
        {!soldOut && qty === 0 && (
          <button className="pcard__add" onClick={() => add(product)} aria-label={`Agregar ${product.name} al carrito`}>
            <Icon><path d="M12 5v14M5 12h14" /></Icon>
          </button>
        )}
        {!soldOut && qty > 0 && (
          <div className="pcard__stepper" role="group" aria-label={`Cantidad de ${product.name}`}>
            <button onClick={() => setQty(product.id, qty - 1)} aria-label="Quitar uno"><Icon><path d="M5 12h14" /></Icon></button>
            <output aria-live="polite">{qty}</output>
            <button onClick={() => add(product)} disabled={atMax} aria-label="Agregar uno más"><Icon><path d="M12 5v14M5 12h14" /></Icon></button>
          </div>
        )}
      </div>
      <p className="pcard__price">{formatPrice(product.price)}</p>
      <h3 className="pcard__name">{product.name}</h3>
    </li>
  );
}