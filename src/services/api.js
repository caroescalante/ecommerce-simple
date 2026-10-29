import mockProducts from '../data/products.mock';

// Con VITE_API_URL definida (ver .env.example) se usa el backend; si no, los datos de ejemplo.
const API_URL = import.meta.env.VITE_API_URL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Postgres devuelve snake_case y NUMERIC como string: se normaliza a lo que usa el front.
export function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: Number(p.price),
    imageUrl: p.imageUrl ?? p.image_url ?? null,
    categorySlug: p.categorySlug ?? p.category_slug,
    stock: p.stock ?? null, // null = sin control de stock
    isActive: p.isActive ?? p.is_active ?? true,
  };
}

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

// GET /products?category=slug&q=texto
export async function getProducts({ category, q } = {}) {
  if (!API_URL) {
    await wait(350);
    const term = q?.toLowerCase();
    return mockProducts.filter(
      (p) => p.isActive && (!category || p.categorySlug === category) && (!term || p.name.toLowerCase().includes(term)),
    );
  }
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (q) qs.set('q', q);
  return (await request(`/products?${qs}`)).map(normalizeProduct);
}

// POST /orders (pendiente de backend, ver docs/BACKEND.md)
export async function createOrder(order) {
  if (!API_URL) throw new Error('Backend no configurado');
  return request('/orders', { method: 'POST', body: JSON.stringify(order) });
}
