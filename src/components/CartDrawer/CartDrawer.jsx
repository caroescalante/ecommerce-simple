import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../ProductCard/ProductCard';
import { formatPrice } from '../../utils/format';
import './CartDrawer.css';

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

export default function CartDrawer() {
  const { items, count, total, setQty, remove, clear, isOpen, closeCart } = useCart();
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

  const checkout = () => {
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
              <div className="cart__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
              <button className="btn btn--accent" onClick={checkout}>Finalizar pedido</button>
              <button className="cart__clear" onClick={clear}>Vaciar carrito</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
