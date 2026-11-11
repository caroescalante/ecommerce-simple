import store from '../data/store';

// ---- Reglas de descuento (se cambian acá) ----
export const DISCOUNT_THRESHOLD = 70000; // se aplica VOLUME_RATE si el subtotal SUPERA este monto
export const VOLUME_RATE = 0.3;
export const EARLY_RATE = 0.2;
export const EARLY_START = '09:30'; // apertura
export const EARLY_END = '16:00'; // inclusive: a las 16:00 vale, a las 16:01 ya no
export const DISCOUNT_THRESHOLD_TEXT = `$${DISCOUNT_THRESHOLD.toLocaleString('es-AR')}`;

// Los productos de esta categoría NO entran en los descuentos (no son acumulables).
// Poné acá el slug EXACTO de la categoría en la base (categorias.slug).
export const PROMO_CATEGORY_SLUGS = ['promociones'];
export const PROMO_CATEGORY_NAME = 'Promociones';

const TIME_ZONE = store.timeZone || 'America/Argentina/Buenos_Aires';

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const round2 = (n) => Math.round(n * 100) / 100;

// Minutos transcurridos del día en la zona horaria del local (no la del dispositivo)
export function minutesInZone(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get('hour') * 60 + get('minute');
}

// Sirve para productos y para líneas del carrito (ambos tienen categorySlug)
export const isPromoItem = (item) =>
  PROMO_CATEGORY_SLUGS.includes(String(item?.categorySlug ?? '').toLowerCase());

// Separa el carrito: lo que puede tener descuento y lo que está en Promociones
export function splitSubtotals(items = []) {
  let promoSubtotal = 0;
  let eligibleSubtotal = 0;
  items.forEach((i) => {
    const line = (Number(i.price) || 0) * (Number(i.qty) || 0);
    if (isPromoItem(i)) promoSubtotal += line;
    else eligibleSubtotal += line;
  });
  return {
    subtotal: round2(promoSubtotal + eligibleSubtotal),
    promoSubtotal: round2(promoSubtotal),
    eligibleSubtotal: round2(eligibleSubtotal),
  };
}

export function isEarlyPromoActive(date = new Date()) {
  const m = minutesInZone(date);
  return m >= toMinutes(EARLY_START) && m <= toMinutes(EARLY_END);
}

/**
 * Descuento que corresponde a una BASE (subtotal sin productos de Promociones) en un momento dado.
 * Los descuentos NO se acumulan entre sí: si corresponden los dos, se aplica el mayor (30%).
 * Para un carrito completo usar computeCartDiscount.
 */
export function computeDiscount(subtotal, date = new Date()) {
  const base = Number(subtotal) || 0;
  const earlyActive = isEarlyPromoActive(date);

  let rate = 0;
  let code = null;
  let reason = '';
  if (base > DISCOUNT_THRESHOLD) {
    rate = VOLUME_RATE;
    code = 'volumen';
    reason = `Compra mayor a ${DISCOUNT_THRESHOLD_TEXT}`;
  } else if (base > 0 && earlyActive) {
    rate = EARLY_RATE;
    code = 'horario';
    reason = `Válido hasta las ${EARLY_END} hs`;
  }

  const amount = round2(base * rate);
  return {
    subtotal: base,
    rate,
    code, // 'volumen' | 'horario' | null
    label: rate ? `Descuento ${Math.round(rate * 100)}%` : '',
    reason,
    amount,
    total: round2(base - amount),
    earlyActive,
  };
}

/**
 * Descuento de un carrito completo.
 *  - El descuento se calcula SOLO sobre los productos que no son de Promociones (eligibleSubtotal)
 *  - El umbral de $70.000 también se mide sobre esa base
 *  - total = subtotal (todo el carrito) - descuento
 */
export function computeCartDiscount(items, date = new Date()) {
  const { subtotal, promoSubtotal, eligibleSubtotal } = splitSubtotals(items);
  const d = computeDiscount(eligibleSubtotal, date);
  return { ...d, subtotal, promoSubtotal, eligibleSubtotal, total: round2(subtotal - d.amount) };
}
