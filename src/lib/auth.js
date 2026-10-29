import jwt from 'jsonwebtoken';
import { prismaAdmin } from '../prisma.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error('Falta JWT_SECRET en el .env (mínimo 32 caracteres). Generá una con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
}

const COOKIE = 'dismarco_admin';
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // la sesión dura 8 horas

// La cookie no es accesible desde JavaScript (httpOnly), por eso el inspector del navegador no puede leerla.
// En producción con front y API en dominios distintos: NODE_ENV=production y COOKIE_SAMESITE=none (exige HTTPS).
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  path: '/api/admin',
};

export function startSession(res, user) {
  const token = jwt.sign({ sub: user.id }, SECRET, { algorithm: 'HS256', expiresIn: '8h' });
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: MAX_AGE_MS });
}

export const endSession = (res) => res.clearCookie(COOKIE, cookieOptions);

// Exige sesión válida. En cada pedido se vuelve a consultar el usuario: si se lo desactiva, pierde el acceso al instante.
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    const user = await prismaAdmin().usuario.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    if (!user || !user.activo) return res.status(401).json({ error: 'No autenticado' });
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión vencida' });
    }
    return next(err);
  }
}

// Defensa CSRF: los pedidos que modifican datos deben traer un encabezado propio.
// Un sitio ajeno no puede enviarlo sin que el CORS (limitado a tu front) lo bloquee.
export function requireCustomHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'dismarco-admin') return res.status(403).json({ error: 'Solicitud no permitida' });
  return next();
}
