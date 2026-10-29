import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { prismaWeb, prismaAdmin } from './prisma.js';
import productsRouter from './routes/products.js';
import adminRouter from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // Vercel va por delante: necesario para el límite de intentos del login y las cookies seguras
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);

// Detrás de un proxy (Render, Railway, etc.) definir TRUST_PROXY=1 para que el límite de intentos use la IP real
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // permite que el front cargue /img
app.use(cors({
  origin: origins.length ? origins : false,
  credentials: true, // necesario para la cookie de sesión del Admin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Imágenes: public/img/productos/archivo.jpg  ->  /img/productos/archivo.jpg
app.use('/img', express.static(fileURLToPath(new URL('../public/img', import.meta.url)), { maxAge: '7d' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prismaWeb().$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/api/admin', adminRouter);
app.use('/api', productsRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'La imagen supera los 3 MB' });
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ error: 'Datos inválidos' });
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, () => console.log(`API Dismarco escuchando en http://localhost:${port}`));

const shutdown = async () => {
  server.close();
  await Promise.allSettled([prismaWeb().$disconnect(), prismaAdmin().$disconnect()]);
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
