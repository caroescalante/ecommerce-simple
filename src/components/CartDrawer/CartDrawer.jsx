import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../ProductCard/ProductCard';
import { formatPrice } from '../../utils/format';
import { useProducts } from '../../hooks/useProducts';
import './CartDrawer.css';

const MIN_ORDER = 20000;
const MAX_SUGGESTIONS = 3;

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

export default function CartDrawer() {
  const { items, count, total, add, setQty, remove, clear, isOpen, closeCart } = useCart();
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

  const missing = Math.max(0, MIN_ORDER - total);
  const belowMin = items.length > 0 && missing > 0;

  // Solo pide el catálogo cuando el drawer está abierto y falta para el mínimo
  const { products } = useProducts({ enabled: isOpen && belowMin });

  // Productos cuyo precio más se acerca a lo que falta (sin los que ya están en el carrito ni sin stock)
  const suggestions = useMemo(() => {
    if (missing === 0) return [];
    const inCart = new Set(items.map((i) => i.id));
    return products
      .filter((p) => p.isActive !== false && !inCart.has(p.id) && (p.stock == null || p.stock > 0))
      .sort((a, b) => Math.abs(a.price - missing) - Math.abs(b.price - missing))
      .slice(0, MAX_SUGGESTIONS);
  }, [products, items, missing]);

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
              {items.map((i) => (
                <li key={i.id} className="citem">
                  <ProductImage product={i} className="citem__img" />
                  <div>
                    <p className="citem__name">{i.name}</p>
                    <p className="citem__price">{formatPrice(i.price * i.qty)}</p>
                    <div className="citem__row">
                      <div className="qty" role="group" aria-label={`Cantidad de ${i.name}`}>
                        <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Quitar uno"><Icon><path d="M5 12h14" /></Icon></button>
                        <output>{i.qty}</output>
                        <button onClick={() => setQty(i.id, i.qty + 1)} disabled={i.stock != null && i.qty >= i.stock} aria-label="Agregar uno más"><Icon><path d="M12 5v14M5 12h14" /></Icon></button>
                      </div>
                      <button className="citem__remove" onClick={() => remove(i.id)}>Quitar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart__foot">
              {belowMin && (
                <div className="cart__min">
                  <p>
                    Te faltan <strong>{formatPrice(missing)}</strong> para llegar al pedido mínimo de {formatPrice(MIN_ORDER)}.
                  </p>
                  <div className="cart__bar" role="progressbar" aria-valuemin={0} aria-valuemax={MIN_ORDER} aria-valuenow={Math.min(total, MIN_ORDER)} aria-label="Avance hacia el pedido mínimo">
                    <span style={{ width: `${Math.min(100, (total / MIN_ORDER) * 100)}%` }} />
                  </div>
                  {suggestions.length > 0 && (
                    <ul className="cart__suggest" aria-label="Productos sugeridos para completar el mínimo">
                      {suggestions.map((p) => (
                        <li key={p.id} className="csug">
                          <ProductImage product={p} className="csug__img" />
                          <div className="csug__info">
                            <p className="csug__name">{p.name}</p>
                            <p className="csug__price">{formatPrice(p.price)}</p>
                          </div>
                          <button className="btn csug__add" onClick={() => add(p)}>Agregar</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="cart__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
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
