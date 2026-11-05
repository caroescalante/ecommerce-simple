import { useEffect, useRef } from 'react';
import { formatPrice } from '../../utils/format';
import { EARLY_RATE, EARLY_END } from '../../utils/discounts';
import './PromoExpiredNotice.css';

// Cartel que avisa que la promo por horario terminó mientras el usuario completaba el pedido.
// Uso: <PromoExpiredNotice open={notice} total={discount.total} onClose={dismissNotice} />
export default function PromoExpiredNotice({ open, total, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="promo-notice" onClose={onClose} aria-labelledby="promo-notice-title">
      <h2 id="promo-notice-title">La promoción terminó</h2>
      <p>
        El descuento del {Math.round(EARLY_RATE * 100)}% era válido hasta las {EARLY_END} hs.
        Ya no está disponible, así que actualizamos el total de tu pedido.
      </p>
      <p className="promo-notice__total">Nuevo total: <strong>{formatPrice(total)}</strong></p>
      <button type="button" className="btn btn--accent" onClick={() => ref.current?.close()}>Entendido</button>
    </dialog>
  );
}
