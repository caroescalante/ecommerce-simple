import store from '../data/store';

// ---- Reglas de descuento (se cambian acá) ----
export const DISCOUNT_THRESHOLD = 70000; // se aplica VOLUME_RATE si el subtotal SUPERA este monto
export const VOLUME_RATE = 0.3;
export const EARLY_RATE = 0.2;
export const EARLY_START = '09:30'; // apertura
export const EARLY_END = '16:00'; // inclusive: a las 16:00 vale, a las 16:01 ya no
export const DISCOUNT_THRESHOLD_TEXT = `$${DISCOUNT_THRESHOLD.toLocaleString('es-AR')}`;

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

export function isEarlyPromoActive(date = new Date()) {
  const m = minutesInZone(date);
  return m >= toMinutes(EARLY_START) && m <= toMinutes(EARLY_END);
}

/**
 * Descuento que corresponde a un subtotal en un momento dado.
 * Los descuentos NO se acumulan: si corresponden los dos, se aplica el mayor (30%).
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
