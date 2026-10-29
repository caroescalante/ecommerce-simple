import { Router } from 'express';
import { prismaWeb } from '../prisma.js';
import { likeEscape } from '../lib/search.js';

const router = Router();
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const MAX_RESULTS = 500;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const absolute = (path) => (path && path.startsWith('/') ? `${PUBLIC_URL}${path}` : path);

// Forma que consume el front (src/services/api.js)
const toProduct = (p) => ({
  id: p.id,
  name: p.descripcion,
  description: '',
  price: Number(p.precio),
  image_url: absolute(p.imagenUrl),
  category_slug: p.categoria.slug,
  stock: null, // la tabla actual no controla stock
  is_active: true,
});

// GET /api/products?category=<slug>&q=<texto>
router.get('/products', async (req, res, next) => {
  try {
    const category = str(req.query.category, 60);
    const q = str(req.query.q, 100);
    const rows = await prismaWeb().producto.findMany({
      where: {
        ...(category && { categoria: { slug: category } }),
        ...(q && { descripcion: { contains: likeEscape(q), mode: 'insensitive' } }),
      },
      select: { id: true, descripcion: true, precio: true, imagenUrl: true, categoria: { select: { slug: true } } },
      orderBy: [{ descripcion: 'asc' }, { id: 'asc' }],
      take: MAX_RESULTS,
    });
    res.json(rows.map(toProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/categories
router.get('/categories', async (_req, res, next) => {
  try {
    const rows = await prismaWeb().categoria.findMany({
      select: { slug: true, nombre: true },
      orderBy: [{ posicion: 'asc' }, { id: 'asc' }],
    });
    res.json(rows.map((c) => ({ slug: c.slug, name: c.nombre })));
  } catch (err) {
    next(err);
  }
});

export default router;
