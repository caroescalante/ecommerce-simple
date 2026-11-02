import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import { getProductOptions } from '../../data/productOptions';
import { slugify } from '../../utils/slugify';
import { ProductImage } from './ProductImage';
import ProductDetail from './ProductDetail';
import './ProductCard.css';

// Se re-exportan para no romper imports existentes
export { slugify, ProductImage };

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

export default function ProductCard({ product }) {
  const { qtyOf, add, setQty } = useCart();
  const [detailOpen, setDetailOpen] = useState(false);

  const qty = qtyOf(product.id); // total del producto, sumando todas sus opciones
  const hasOptions = Boolean(getProductOptions(product));
  const soldOut = product.stock === 0;
  const atMax = product.stock != null && qty >= product.stock;

  const openDetail = () => setDetailOpen(true);
  const closeDetail = () => setDetailOpen(false);

  // Tocar cualquier parte de la tarjeta abre el detalle, salvo los botones (+, cantidad).
  // El modal se renderiza en un portal pero sus eventos igual suben por React hasta acá,
  // por eso se verifica que el clic haya ocurrido dentro de la tarjeta en el DOM.
  const onCardClick = (e) => {
    if (!e.currentTarget.contains(e.target)) return;
    if (e.target.closest('button, output')) return;
    openDetail();
  };

  return (
    <li className={`pcard ${soldOut ? 'is-soldout' : ''}`} onClick={onCardClick}>
      <div className="pcard__media">
        <ProductImage product={product} />
        {soldOut && <span className="pcard__tag">Sin stock</span>}

        {/* Producto con opciones: el + abre el detalle para elegir; el contador muestra cuánto hay en el carrito */}
        {!soldOut && hasOptions && (
          <>
            {qty > 0 && <span className="pcard__badge" aria-label={`${qty} en el carrito`}>{qty}</span>}
            <button className="pcard__add" onClick={openDetail} aria-label={`Elegir opción de ${product.name}`}>
              <Icon><path d="M12 5v14M5 12h14" /></Icon>
            </button>
          </>
        )}

        {/* Producto sin opciones: igual que antes */}
        {!soldOut && !hasOptions && qty === 0 && (
          <button className="pcard__add" onClick={() => add(product)} aria-label={`Agregar ${product.name} al carrito`}>
            <Icon><path d="M12 5v14M5 12h14" /></Icon>
          </button>
        )}
        {!soldOut && !hasOptions && qty > 0 && (
          <div className="pcard__stepper" role="group" aria-label={`Cantidad de ${product.name}`}>
            <button onClick={() => setQty(product.id, qty - 1)} aria-label="Quitar uno"><Icon><path d="M5 12h14" /></Icon></button>
            <output aria-live="polite">{qty}</output>
            <button onClick={() => add(product)} disabled={atMax} aria-label="Agregar uno más"><Icon><path d="M12 5v14M5 12h14" /></Icon></button>
          </div>
        )}
      </div>

      <p className="pcard__price">{formatPrice(product.price)}</p>
      <h3 className="pcard__name">
        <button type="button" className="pcard__open" onClick={openDetail}>{product.name}</button>
      </h3>

      {detailOpen && <ProductDetail product={product} onClose={closeDetail} />}
    </li>
  );
}