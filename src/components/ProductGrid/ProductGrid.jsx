import ProductCard from '../ProductCard/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import './ProductGrid.css';

export default function ProductGrid({
  products, loading, error, onRetry, category, q,
  emptyText = 'No hay productos para mostrar.',
}) {
  // Si no le pasan products, los trae solo desde la API
  const selfFetch = products === undefined;
  const data = useProducts({ category, q, enabled: selfFetch });

  const list = selfFetch ? data.products : products;
  const isLoading = selfFetch ? data.loading : loading;
  const hasError = selfFetch ? data.error : error;
  const retry = selfFetch ? data.retry : onRetry;

  if (isLoading) {
    return (
      <ul className="pgrid" aria-busy="true" aria-label="Cargando productos">
        {Array.from({ length: 10 }, (_, i) => <li key={i} className="pgrid__skeleton"><div /><span /><span /></li>)}
      </ul>
    );
  }
  if (hasError) {
    return (
      <div className="pgrid__state" role="alert">
        <p>No pudimos cargar los productos.</p>
        <button className="btn" onClick={retry}>Reintentar</button>
      </div>
    );
  }
  if (!list.length) return <div className="pgrid__state"><p>{emptyText}</p></div>;
  return <ul className="pgrid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</ul>;
}