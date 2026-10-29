import { useParams } from 'react-router-dom';
import categories from '../data/categories';
import useProducts from '../hooks/useProducts';
import ProductGrid from '../components/ProductGrid/ProductGrid';

export default function Category() {
  const { slug } = useParams();
  const cat = categories.find((c) => c.slug === slug);
  const { products, loading, error, retry } = useProducts({ category: cat ? slug : undefined });

  if (!cat) return <main className="page"><h2>Categoría no encontrada</h2></main>;

  return (
    <main className="page">
      <h2>{cat.name}</h2>
      <ProductGrid products={products} loading={loading} error={error} onRetry={retry} emptyText="Todavía no hay productos en esta categoría." />
    </main>
  );
}
