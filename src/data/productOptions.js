/**
 * Las opciones vienen de la base (productos.enum_si_no / enum_detalle),
 * cargadas desde el admin. Devuelve { label, values, required } o null si el producto no tiene opciones.
 */
export const getProductOptions = (product) =>
  product?.hasOptions && product.options?.length
    ? { label: 'Opción', values: product.options, required: true }
    : null;
