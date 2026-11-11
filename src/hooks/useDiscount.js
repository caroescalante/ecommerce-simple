import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeCartDiscount } from '../utils/discounts';

const FLAG = 'dismarco-promo-seen'; // "el usuario llegó a ver aplicado el descuento por horario"
const FLAG_TTL = 3 * 60 * 60 * 1000;
const TICK_MS = 5000;

const seen = {
  get() { try { const t = Number(sessionStorage.getItem(FLAG)); return Boolean(t) && Date.now() - t < FLAG_TTL; } catch { return false; } },
  set() { try { sessionStorage.setItem(FLAG, String(Date.now())); } catch { /* sin storage */ } },
  clear() { try { sessionStorage.removeItem(FLAG); } catch { /* sin storage */ } },
};

/**
 * Calcula el descuento del carrito (items de useCart) y lo mantiene al día con el reloj.
 *  - discount: { subtotal, promoSubtotal, eligibleSubtotal, rate, code, label, reason, amount, total, earlyActive }
 *  - notice: true cuando la promo por horario terminó después de que el usuario la vio aplicada
 *  - dismissNotice(): cierra el aviso
 *  - revalidate(): llamarla justo antes de enviar el pedido. Devuelve true si el descuento
 *    cambió (en ese caso muestra el aviso y conviene NO enviar todavía).
 */
export default function useDiscount(items) {
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState(false);

  // Reloj: re-evalúa cada pocos segundos y al volver a la pestaña (los timers se frenan en segundo plano)
  useEffect(() => {
    const tick = () => setNow((prev) => {
      const d = new Date();
      return Math.floor(d / 60000) === Math.floor(prev / 60000) ? prev : d; // solo cuando cambia el minuto
    });
    const id = setInterval(tick, TICK_MS);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const discount = useMemo(() => computeCartDiscount(items, now), [items, now]);

  useEffect(() => {
    if (discount.subtotal <= 0) { seen.clear(); setNotice(false); return; }
    if (discount.code === 'horario') { seen.set(); return; }
    // La promo por horario se vio aplicada y ya terminó (y no hay otro descuento que la reemplace)
    if (!discount.earlyActive && discount.code !== 'volumen' && seen.get()) setNotice(true);
  }, [discount.subtotal, discount.code, discount.earlyActive]);

  const dismissNotice = useCallback(() => { seen.clear(); setNotice(false); }, []);

  const revalidate = useCallback(() => {
    const fresh = computeCartDiscount(items, new Date());
    if (fresh.amount === discount.amount) return false;
    setNow(new Date());
    if (discount.code === 'horario' && !fresh.earlyActive && fresh.code !== 'volumen') setNotice(true);
    return true;
  }, [items, discount.amount, discount.code]);

  return { discount, notice, dismissNotice, revalidate };
}

export { useDiscount };
