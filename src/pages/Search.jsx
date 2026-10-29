import { useSearchParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import ProductGrid from '../components/ProductGrid/ProductGrid';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const { products, loading, error, retry } = useProducts({ q });

  return (
    <main className="page">
      <h2>Resultados para “{q}”</h2>
      <ProductGrid products={products} loading={loading} error={error} onRetry={retry} emptyText="No encontramos productos con esa búsqueda." />
    </main>
  );
}
