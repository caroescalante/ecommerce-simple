# Dismarco API (Node + Express + PostgreSQL)

## Puesta en marcha
1. En pgAdmin, base `ecommerce-dismarco` > Query Tool: abrir y ejecutar `dismarco_local_setup.sql` (tablas, categorías, usuarios y roles)
2. (Opcional) datos de ejemplo: ejecutar `seed.sql` de la misma forma
3. El archivo `.env` ya viene completo para desarrollo local (no subirlo a Git)
4. `npm install`
5. `npm run dev`  (Node 18.11 o superior)

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica la conexión a la base |
| GET | `/api/products?category=<slug>&q=<texto>` | Productos (filtros opcionales) |
| GET | `/api/categories` | Categorías ordenadas |

## Conectar el front
En el proyecto del front, copiar `.env.example` a `.env` con `VITE_API_URL=http://localhost:3001/api`
y reiniciar `npm run dev`.

## Imágenes
Guardar los archivos en `public/img/productos/` y en la columna `imagen_url` poner `/img/productos/archivo.jpg`.
La API los devuelve con URL absoluta (usando `PUBLIC_URL`).

## Prisma
- `prisma/schema.prisma` describe las tablas (`categorias`, `productos`, `usuarios`). Los CHECK, triggers, roles y permisos
  siguen viviendo en los `.sql` de la carpeta superior.
- `npm install` ejecuta `prisma generate` solo. No necesita conexión a la base.
- `src/prisma.js` exporta dos clientes, uno por rol: `prismaWeb()` (solo lectura) y `prismaAdmin()` (edita productos y login).
- Si cambiás la base con SQL: ejecutá `npm run prisma:pull` (usa `DIRECT_URL`, con la cuenta dueña) para actualizar el schema.
- Requiere Node ^20.19, ^22.12 o 24+.
- Los endpoints públicos todavía usan `pg`. Pasarlos a Prisma es el próximo paso.
