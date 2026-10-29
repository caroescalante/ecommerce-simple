import { useCallback, useEffect, useState } from 'react';

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '').replace(/\/api$/, '');

// Si la imagen viene como /img/..., la pide al backend (puerto 3001)
export function assetUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

// JSON de la API (snake_case) -> forma que usa el front (camelCase)
const fromApi = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description ?? '',
  price: Number(p.price),
  imageUrl: p.image_url,
  categorySlug: p.category_slug,
  stock: p.stock, // null = sin control de stock
  isActive: p.is_active,
});

export function useProducts({ category, q, enabled = true } = {}) {
  const [state, setState] = useState({ products: [], loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const qs = params.toString() ? `?${params}` : '';

    fetch(`${API_URL}/api/products${qs}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setState({ products: data.map(fromApi), loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ products: [], loading: false, error: err });
      });

    return () => ctrl.abort();
  }, [category, q, enabled, tick]);

  return { ...state, retry };
}
export default useProducts;
