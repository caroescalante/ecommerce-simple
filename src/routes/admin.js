import { Router } from 'express';
import argon2 from 'argon2';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prismaAdmin } from '../prisma.js';
import { likeEscape } from '../lib/search.js';
import { startSession, endSession, requireAdmin, requireCustomHeader } from '../lib/auth.js';
import { loginSchema, productSchema } from '../lib/validation.js';

const router = Router();
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const UPLOAD_DIR = fileURLToPath(new URL('../../public/img/productos/', import.meta.url));


const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
// Hash falso: se verifica igual cuando el email no existe, para que el tiempo de respuesta no delate si la cuenta existe
const DUMMY_HASH = await argon2.hash('contraseña-falsa-para-igualar-tiempos', { type: argon2.argon2id });

const absolute = (path) => (path && path.startsWith('/') ? `${PUBLIC_URL}${path}` : path);
const publicUser = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo más tarde.' },
});

router.use(requireCustomHeader);

// ---------------- Sesión ----------------
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Completá el email y la contraseña' });
    const { email, password } = parsed.data;

    const db = prismaAdmin();
    const user = await db.usuario.findFirst({ where: { email: email.toLowerCase() } });
    const now = new Date();

    if (user?.bloqueadoHasta && user.bloqueadoHasta > now) {
      return res.status(429).json({ error: 'Cuenta bloqueada por varios intentos fallidos. Probá en unos minutos.' });
    }

    const valid = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password).catch(() => false);
    if (!user || !user.activo || !valid) {
      if (user) {
        const attempts = user.intentosFallidos + 1;
        await db.usuario.update({
          where: { id: user.id },
          data: attempts >= MAX_ATTEMPTS
            ? { intentosFallidos: 0, bloqueadoHasta: new Date(now.getTime() + LOCK_MINUTES * 60_000) }
            : { intentosFallidos: attempts },
        });
      }
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    await db.usuario.update({ where: { id: user.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoLogin: now } });
    startSession(res, user);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (_req, res) => {
  endSession(res);
  res.status(204).end();
});

// Todo lo que sigue requiere sesión
router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ user: publicUser(req.user) }));

// ---------------- Productos ----------------
const select = {
  id: true, descripcion: true, precio: true, imagenUrl: true, categoriaId: true, created: true, modified: true,
  categoria: { select: { nombre: true } },
};
const toAdminProduct = (p) => ({
  id: p.id,
  descripcion: p.descripcion,
  precio: Number(p.precio),
  imagenUrl: p.imagenUrl,
  imagenSrc: absolute(p.imagenUrl),
  categoriaId: p.categoriaId,
  categoria: p.categoria?.nombre ?? '',
  created: p.created,
  modified: p.modified,
});
const parseId = (v) => (/^\d{1,9}$/.test(v) ? Number(v) : null);
const fail = (res, status, error) => res.status(status).json({ error });

router.get('/categories', async (_req, res, next) => {
  try {
    const rows = await prismaAdmin().categoria.findMany({ select: { id: true, slug: true, nombre: true }, orderBy: [{ posicion: 'asc' }, { id: 'asc' }] });
    res.json(rows.map((c) => ({ id: c.id, slug: c.slug, name: c.nombre })));
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const categoriaId = parseId(String(req.query.categoriaId ?? ''));
    const pageSize = 30;
    const page = Math.max(1, parseId(String(req.query.page ?? '1')) ?? 1);
    const where = {
      ...(q && { descripcion: { contains: likeEscape(q), mode: 'insensitive' } }),
      ...(categoriaId && { categoriaId }),
    };
    const db = prismaAdmin();
    const [total, rows] = await Promise.all([
      db.producto.count({ where }),
      db.producto.findMany({ where, select, orderBy: [{ descripcion: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    res.json({ items: rows.map(toAdminProduct), total, page, pageSize });
  } catch (err) { next(err); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const row = id && (await prismaAdmin().producto.findUnique({ where: { id }, select }));
    if (!row) return fail(res, 404, 'Producto no encontrado');
    return res.json(toAdminProduct(row));
  } catch (err) { return next(err); }
});

const toData = (d) => ({ descripcion: d.descripcion, precio: d.precio.toFixed(2), categoriaId: d.categoriaId, imagenUrl: d.imagenUrl });

router.post('/products', async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, parsed.error.issues[0].message);
    const row = await prismaAdmin().producto.create({ data: toData(parsed.data), select });
    return res.status(201).json(toAdminProduct(row));
  } catch (err) {
    if (err.code === 'P2003') return fail(res, 400, 'La categoría no existe');
    return next(err);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 404, 'Producto no encontrado');
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, parsed.error.issues[0].message);
    const row = await prismaAdmin().producto.update({ where: { id }, data: toData(parsed.data), select });
    return res.json(toAdminProduct(row));
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 404, 'Producto no encontrado');
    if (err.code === 'P2003') return fail(res, 400, 'La categoría no existe');
    return next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 404, 'Producto no encontrado');
    await prismaAdmin().producto.delete({ where: { id } });
    return res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 404, 'Producto no encontrado');
    return next(err);
  }
});

// ---------------- Imágenes ----------------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 } });

// El tipo se decide por el contenido del archivo, no por su nombre ni por lo que declare el navegador
function detectImageType(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

router.post('/upload', upload.single('imagen'), async (req, res, next) => {
  try {
    // En Vercel el disco es de solo lectura: ahí las fotos se agregan a mano en public/img/productos
    if (process.env.VERCEL) return fail(res, 503, 'La subida de imágenes está desactivada en producción');
    if (!req.file) return fail(res, 400, 'Elegí una imagen');
    const ext = detectImageType(req.file.buffer);
    if (!ext) return fail(res, 400, 'Formato no permitido. Usá JPG, PNG o WebP');
    const name = `${randomUUID()}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(`${UPLOAD_DIR}${name}`, req.file.buffer, { flag: 'wx' });
    const url = `/img/productos/${name}`;
    return res.status(201).json({ url, src: absolute(url) });
  } catch (err) { return next(err); }
});

export default router;
