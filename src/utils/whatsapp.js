import { formatPrice } from './format';
import { computeCartDiscount, isPromoItem, PROMO_CATEGORY_NAME } from './discounts';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

export function buildOrderMessage({ storeName, items, method, pickup, name, phone, address, locality, freeShipping, reference, payment, transfer }) {
  const L = [`*Nuevo pedido - ${storeName}*`, '', '*Productos*'];
  // Formato: descripción (opción elegida) x cantidad - subtotal de la línea
  items.forEach((i) => {
    const option = clean(i.variant) ? ` (${clean(i.variant)})` : '';
    const promo = isPromoItem(i) ? ` [${PROMO_CATEGORY_NAME}]` : '';
    L.push(`• ${clean(i.name)}${option} x ${i.qty} - ${formatPrice(i.price * i.qty)}${promo}`);
  });

  // Los totales se calculan acá, con la hora del momento de enviar: no dependen de lo que pase la página.
  // El descuento solo alcanza a los productos que no son de Promociones.
  const d = computeCartDiscount(items);
  const hasPromo = d.promoSubtotal > 0;
  L.push('', `*Subtotal:* ${formatPrice(d.subtotal)}`);
  if (hasPromo) L.push(`*Productos en ${PROMO_CATEGORY_NAME} (sin descuento):* ${formatPrice(d.promoSubtotal)}`);
  if (d.amount > 0) {
    L.push(`*${d.label}${hasPromo ? ` (sobre ${formatPrice(d.eligibleSubtotal)})` : ''}:* -${formatPrice(d.amount)}`);
  }
  L.push('');

  if (method === 'domicilio') {
    L.push(
      '*Entrega:* A domicilio',
      `*Nombre:* ${clean(name)}`,
      `*Teléfono:* ${clean(phone)}`,
      `*Dirección:* ${clean(address.text)}`,
      `*Localidad:* ${locality === 'otra' ? 'Otra localidad' : locality}`,
      `*Ubicación:* https://www.google.com/maps?q=${address.lat},${address.lng}`,
    );
    if (clean(reference)) L.push(`*Referencias:* ${clean(reference)}`);
    L.push(`*Envío:* ${freeShipping ? 'Sin cargo' : 'A cotizar al finalizar la compra'}`);
  } else {
    L.push('*Entrega:* Retiro por el local', `*Nombre:* ${clean(name)}`, `*Local:* ${pickup.address}`, `*Horario:* ${pickup.hours}`);
  }

  L.push('', `*Forma de pago:* ${payment}`);
  if (payment === 'Transferencia' && transfer) {
    L.push(`*Alias:* ${transfer.alias}`, `*Banco o billetera:* ${transfer.bank}`, `*Titular:* ${transfer.holder}`);
  }

  const extra = method === 'domicilio' && !freeShipping ? ' + envío a cotizar' : '';
  L.push('', `*Total:* ${formatPrice(d.total)}${extra}`);
  L.push('', `_Aclaración: los productos de la categoría ${PROMO_CATEGORY_NAME} no son acumulables con los Descuentos._`);
  return L.join('\n');
}