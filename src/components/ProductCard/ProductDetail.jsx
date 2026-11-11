import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import { getProductOptions } from '../../data/productOptions';
import { ProductImage } from './ProductImage';
import './ProductDetail.css';

const MAX_QTY = 999; // tope cuando el producto no controla stock

export default function ProductDetail({ product, onClose }) {
  const { add } = useCart();
  const config = getProductOptions(product);
  const [variant, setVariant] = useState(null);
  // Se guarda como texto para poder borrar y escribir la cantidad (ej. 60) sin pasar por 1, 2, 3...
  const [qtyText, setQtyText] = useState('1');
  const qty = Number(qtyText) || 0;
  const closeRef = useRef(null);

  const soldOut = product.stock === 0;
  const max = product.stock ?? MAX_QTY;
  const missingChoice = Boolean(config?.required) && !variant;

  // Escape cierra, se bloquea el scroll de fondo y el foco va al modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Solo números; si se pasa del máximo disponible queda en el máximo
  const onQtyChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setQtyText(digits === '' ? '' : String(Math.min(Number(digits), max)));
  };
  const onQtyBlur = () => { if (qty < 1) setQtyText('1'); };
  const step = (delta) => setQtyText(String(Math.min(max, Math.max(1, qty + delta))));

  const submit = () => {
    if (missingChoice || soldOut || qty < 1) return;
    add(product, variant, qty);
    onClose();
  };

  const label = config?.label ?? '';

  return createPortal(
    <div className="pdetail__overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pdetail" role="dialog" aria-modal="true" aria-labelledby="pdetail-title">
        <button ref={closeRef} type="button" className="pdetail__close" onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="pdetail__media">
          <ProductImage product={product} className="pdetail__img" />
        </div>

        <div className="pdetail__body">
          <h2 id="pdetail-title" className="pdetail__name">{product.name}</h2>
          <p className="pdetail__price">{formatPrice(product.price)}</p>
          {product.description && <p className="pdetail__desc">{product.description}</p>}

          {config && (
            <fieldset className="pdetail__options">
              <legend>{label}{config.required ? ' (obligatoria, elegí una)' : ' (opcional)'}</legend>
              <div className="pdetail__chips" role="radiogroup" aria-required={config.required}>
                {config.values.map((v) => (
                  <label key={v} className={`pdetail__chip ${variant === v ? 'is-on' : ''}`}>
                    <input
                      type="radio"
                      name="variant"
                      value={v}
                      checked={variant === v}
                      onChange={() => setVariant(v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="pdetail__actions">
            <div className="pdetail__qty" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => step(-1)} disabled={qty <= 1} aria-label="Quitar uno">−</button>
              <input
                className="pdetail__qty-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={qtyText}
                onChange={onQtyChange}
                onBlur={onQtyBlur}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                aria-label="Cantidad a agregar"
              />
              <button type="button" onClick={() => step(1)} disabled={qty >= max} aria-label="Agregar uno más">+</button>
            </div>
            <button type="button" className="pdetail__submit" onClick={submit} disabled={missingChoice || soldOut || qty < 1}>
              {soldOut
                ? 'Sin stock'
                : missingChoice
                  ? `Elegí una ${label.toLowerCase()}`
                  : qty < 1
                    ? 'Ingresá una cantidad'
                    : `Agregar · ${formatPrice(product.price * qty)}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}