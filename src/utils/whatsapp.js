import { formatPrice } from './format';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

export function buildOrderMessage({ storeName, items, subtotal, method, pickup, name, phone, address, locality, freeShipping, reference, payment, transfer }) {
  const L = [`*Nuevo pedido - ${storeName}*`, '', '*Productos*'];
  items.forEach((i) => L.push(`• ${i.qty} x ${clean(i.name)} - ${formatPrice(i.price * i.qty)}`));
  L.push('', `*Subtotal:* ${formatPrice(subtotal)}`, '');

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
  L.push('', `*Total:* ${formatPrice(subtotal)}${extra}`);
  return L.join('\n');
}