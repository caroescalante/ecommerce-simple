import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../ProductCard/ProductCard';
import { formatPrice } from '../../utils/format';
import { getProductOptions } from '../../data/productOptions';
import { DISCOUNT_THRESHOLD, DISCOUNT_THRESHOLD_TEXT, VOLUME_RATE, EARLY_RATE, EARLY_END, PROMO_CATEGORY_NAME, isPromoItem } from '../../utils/discounts';
import OrderTotals from '../OrderTotals/OrderTotals';
import { useProducts } from '../../hooks/useProducts';
import useDiscount from '../../hooks/useDiscount';
import './CartDrawer.css';

const MIN_ORDER = 20000;
const MAX_SUGGESTIONS = 3;
const NEAR_AMOUNT = 20000; // a esta distancia del descuento se avisa "¡Estás cerca!"

const pct = (r) => `${Math.round(r * 100)}%`;
const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

// Los productos con opciones no se sugieren: no se pueden agregar sin elegir una
const suggestable = (p, inCart) =>
  p.isActive !== false && !getProductOptions(p) && !inCart.has(p.id) && (p.stock == null || p.stock > 0);

function SuggestionList({ list, label, onAdd }) {
  if (!list.length) return null;
  return (
    <ul className="cart__suggest" aria-label={label}>
      {list.map((p) => (
        <li key={p.id} className="csug">
          <ProductImage product={p} className="csug__img" />
          <div className="csug__info">
            <p className="csug__name">{p.name}</p>
            <p className="csug__price">{formatPrice(p.price)}</p>
          </div>
          <button className="btn csug__add" onClick={() => onAdd(p)}>Agregar</button>
        </li>
      ))}
    </ul>
  );
}

export default function CartDrawer() {
  const { items, count, total: subtotal, add, setQty, remove, clear, isOpen, closeCart } = useCart();
  const { discount, notice, dismissNotice } = useDiscount(items);
  const closeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  // Pedido mínimo (sobre el subtotal de todo el carrito, Promociones incluidas, antes de descuentos)
  const missing = Math.max(0, MIN_ORDER - subtotal);
  const belowMin = items.length > 0 && missing > 0;

  // Camino al descuento por monto: se mide sobre los productos que NO son de Promociones,
  // y lo que falta es para SUPERAR el umbral (con el umbral exacto todavía no aplica)
  const { eligibleSubtotal, promoSubtotal } = discount;
  const toDiscount = DISCOUNT_THRESHOLD - eligibleSubtotal;
  const chasingDiscount = items.length > 0 && !belowMin && toDiscount >= 0;
  const nearDiscount = toDiscount <= NEAR_AMOUNT;

  // Solo pide el catálogo con el carrito abierto y cuando hay algo que sugerir
  const { products } = useProducts({ enabled: isOpen && (belowMin || chasingDiscount) });

  // Para el pedido mínimo: productos cuyo precio más se acerca a lo que falta
  const minSuggestions = useMemo(() => {
    if (!belowMin) return [];
    const inCart = new Set(items.map((i) => i.id));
    return products
      .filter((p) => suggestable(p, inCart))
      .sort((a, b) => Math.abs(a.price - missing) - Math.abs(b.price - missing))
      .slice(0, MAX_SUGGESTIONS);
  }, [products, items, belowMin, missing]);

  // Para el descuento: productos que por sí solos hacen superar el umbral, del más barato al más caro.
  // Los de Promociones no se sugieren: no suman para el descuento
  const discountSuggestions = useMemo(() => {
    if (!chasingDiscount) return [];
    const inCart = new Set(items.map((i) => i.id));
    return products
      .filter((p) => suggestable(p, inCart) && !isPromoItem(p) && p.price > toDiscount)
      .sort((a, b) => a.price - b.price)
      .slice(0, MAX_SUGGESTIONS);
  }, [products, items, chasingDiscount, toDiscount]);

  const checkout = () => {
    if (belowMin) return;
    closeCart();
    navigate('/pedido');
  };

  return (
    <>
      <div className={`cart-scrim ${isOpen ? 'is-open' : ''}`} onClick={closeCart} />
      <aside className={`cart ${isOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Carrito" aria-hidden={!isOpen}>
        <div className="cart__head">
          <h2>Tu pedido {count > 0 && <small>({count})</small>}</h2>
          <button ref={closeRef} className="icon-btn" onClick={closeCart} aria-label="Cerrar carrito"><Icon><path d="M6 6l12 12M18 6 6 18" /></Icon></button>
        </div>

        {items.length === 0 ? (
          <div className="cart__empty">
            <Icon><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></Icon>
            <p>Todavía no agregaste productos.</p>
            <button className="btn" onClick={closeCart}>Seguir comprando</button>
          </div>
        ) : (
          <>
            <ul className="cart__list">
              {items.map((i) => {
                // Cada línea es producto + opción: Baggio 1L (Manzana) y Baggio 1L (Naranja) van por separado
                const label = i.variant ? `${i.name} (${i.variant})` : i.name;
                return (
                  <li key={i.key} className="citem">
                    <ProductImage product={i} className="citem__img" />
                    <div>
                      <p className="citem__name">{label}</p>
                      <p className="citem__price">{formatPrice(i.price * i.qty)}</p>
                      <div className="citem__row">
                        <div className="qty" role="group" aria-label={`Cantidad de ${label}`}>
                          <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Quitar uno"><Icon><path d="M5 12h14" /></Icon></button>
                          <output>{i.qty}</output>
                          <button onClick={() => setQty(i.key, i.qty + 1)} disabled={i.stock != null && i.qty >= i.stock} aria-label="Agregar uno más"><Icon><path d="M12 5v14M5 12h14" /></Icon></button>
                        </div>
                        <button className="citem__remove" onClick={() => remove(i.key)}>Quitar</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="cart__foot">
              {notice && (
                <div className="cart__notice" role="alert">
                  <p>
                    <strong>La promoción de las {EARLY_END} hs terminó.</strong>{' '}
                    Actualizamos el total sin el descuento del {pct(EARLY_RATE)}.
                  </p>
                  <button type="button" onClick={dismissNotice}>Entendido</button>
                </div>
              )}

              {belowMin && (
                <div className="cart__min">
                  <p>
                    Te faltan <strong>{formatPrice(missing)}</strong> para llegar al pedido mínimo de {formatPrice(MIN_ORDER)}.
                  </p>
                  <div className="cart__bar" role="progressbar" aria-valuemin={0} aria-valuemax={MIN_ORDER} aria-valuenow={Math.min(subtotal, MIN_ORDER)} aria-label="Avance hacia el pedido mínimo">
                    <span style={{ width: `${Math.min(100, (subtotal / MIN_ORDER) * 100)}%` }} />
                  </div>
                  <SuggestionList list={minSuggestions} label="Productos sugeridos para completar el mínimo" onAdd={add} />
                </div>
              )}

              {chasingDiscount && (
                <div className="cart__min cart__promo">
                  <p>
                    <strong>{nearDiscount ? `¡Estás cerca del ${pct(VOLUME_RATE)} de descuento!` : `Obtené ${pct(VOLUME_RATE)} de descuento`}</strong>{' '}
                    {toDiscount > 0
                      ? <>Te faltan <strong>{formatPrice(toDiscount)}</strong> para superar los {DISCOUNT_THRESHOLD_TEXT}.</>
                      : <>Sumá un producto más para superar los {DISCOUNT_THRESHOLD_TEXT}.</>}
                  </p>
                  <div className="cart__bar" role="progressbar" aria-valuemin={0} aria-valuemax={DISCOUNT_THRESHOLD} aria-valuenow={Math.min(eligibleSubtotal, DISCOUNT_THRESHOLD)} aria-label={`Avance hacia el ${pct(VOLUME_RATE)} de descuento`}>
                    <span style={{ width: `${Math.min(100, (eligibleSubtotal / DISCOUNT_THRESHOLD) * 100)}%` }} />
                  </div>
                  {promoSubtotal > 0 && (
                    <p className="cart__hint">Tus productos de {PROMO_CATEGORY_NAME} ({formatPrice(promoSubtotal)}) no suman para el descuento.</p>
                  )}
                  {discountSuggestions.length > 0 && <p className="cart__hint">Cualquiera de estos te hace llegar:</p>}
                  <SuggestionList list={discountSuggestions} label={`Productos que te hacen llegar al ${pct(VOLUME_RATE)} de descuento`} onAdd={add} />
                </div>
              )}

              <OrderTotals discount={discount} />

              <button className="btn btn--accent" onClick={checkout} disabled={belowMin}>
                {belowMin ? `Mínimo ${formatPrice(MIN_ORDER)}` : 'Finalizar pedido'}
              </button>
              <button className="cart__clear" onClick={clear}>Vaciar carrito</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}