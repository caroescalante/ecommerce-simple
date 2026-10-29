// Cliente de la API del portal Admin. La sesión viaja en una cookie httpOnly que el navegador envía solo:
// el front nunca ve ni guarda la contraseña ni el token.
const API = import.meta.env.VITE_API_URL || '';
export const isApiConfigured = Boolean(API);

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  if (!API) throw new ApiError(0, 'Falta configurar VITE_API_URL en el .env del front');
  let res;
  try {
    res = await fetch(`${API}/admin${path}`, {
      method,
      credentials: 'include',
      // Encabezado propio: la API lo exige en los pedidos que modifican datos (defensa CSRF)
      headers: { 'X-Requested-With': 'dismarco-admin', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Ocurrió un error inesperado');
  return data;
}

const query = (p) => new URLSearchParams(Object.entries(p).filter(([, v]) => v !== '' && v != null));

export const adminApi = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),
  categories: () => request('/categories'),
  products: (params) => request(`/products?${query(params)}`),
  product: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', { method: 'POST', body }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  upload: (file) => {
    const form = new FormData();
    form.append('imagen', file);
    return request('/upload', { method: 'POST', form });
  },
};
