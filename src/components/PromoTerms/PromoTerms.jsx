import { PROMO_CATEGORY_NAME } from '../../utils/discounts';
import './PromoTerms.css';

// Aclaración fija: se muestra en el home, en el carrito y al confirmar la compra
export default function PromoTerms({ flush = false }) {
  return (
    <p className={`promo-terms ${flush ? 'promo-terms--flush' : ''}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></svg>
      <span>Los productos de la categoría <strong>{PROMO_CATEGORY_NAME}</strong> no son acumulables con los descuentos.</span>
    </p>
  );
}
