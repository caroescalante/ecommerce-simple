import { formatPrice } from '../../utils/format';
import { PROMO_CATEGORY_NAME } from '../../utils/discounts';
import PromoTerms from '../PromoTerms/PromoTerms';
import './OrderTotals.css';

// Uso: <OrderTotals discount={discount} />   (discount viene de useDiscount(items))
export default function OrderTotals({ discount }) {
  const { subtotal, promoSubtotal, eligibleSubtotal, amount, total, label, reason } = discount;
  const hasPromo = promoSubtotal > 0;

  return (
    <div className="otot">
      {(amount > 0 || hasPromo) && (
        <div className="otot__row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
      )}
      {hasPromo && (
        <div className="otot__row otot__row--sub">
          <span>Incluye {PROMO_CATEGORY_NAME}<small>Sin descuento</small></span>
          <span>{formatPrice(promoSubtotal)}</span>
        </div>
      )}
      {amount > 0 && (
        <div className="otot__row otot__row--discount">
          <span>
            {label}
            <small>{reason}{hasPromo ? ` · sobre ${formatPrice(eligibleSubtotal)}` : ''}</small>
          </span>
          <span>−{formatPrice(amount)}</span>
        </div>
      )}
      <div className="otot__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
      <PromoTerms flush />
    </div>
  );
}
