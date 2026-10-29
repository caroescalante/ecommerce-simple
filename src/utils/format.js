const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
export const formatPrice = (value) => money.format(Number(value) || 0);
