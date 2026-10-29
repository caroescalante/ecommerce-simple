# Contrato con el backend (Node + PostgreSQL)

Todo el front consume datos desde `src/services/api.js`. Para conectar: copiar `.env.example` a `.env`,
poner `VITE_API_URL` e implementar estos endpoints. No hay que tocar componentes.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/products?category=<slug>&q=<texto>` | Productos activos. Ambos filtros son opcionales. |
| POST | `/orders` | Crea un pedido (hoy el checkout se envía por WhatsApp). |

Respuesta de `GET /products` (acepta snake_case o camelCase; `price` puede venir como string):

```json
[{ "id": 12, "name": "Cerveza rubia lata 473 ml", "description": "", "price": "1900.00",
   "image_url": "https://.../cerveza.jpg", "category_slug": "cerveza", "stock": 40, "is_active": true }]
```

`POST /orders`: el front manda solo ids y cantidades. El backend debe recalcular precios desde la base.

```json
{ "items": [{ "productId": 12, "qty": 2 }], "customer": { "name": "", "phone": "", "address": "" }, "notes": "" }
```

## Esquema PostgreSQL sugerido

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, position INT NOT NULL DEFAULT 0
);
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL, description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INT,                       -- NULL = sin control de stock
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`category_slug` sale de un JOIN con `categories`. Las categorías de la Navbar viven hoy en `src/data/categories.js`.
