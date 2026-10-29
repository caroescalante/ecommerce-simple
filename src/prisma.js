import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Dos clientes, uno por rol de la base (mínimo privilegio):
//   prismaWeb()   -> rol dismarco_web   (DATABASE_URL):       solo LEE categorías y productos
//   prismaAdmin() -> rol dismarco_admin (DATABASE_URL_ADMIN): edita productos y gestiona el login
// Se crean recién al usarlos, así la tienda pública no necesita las credenciales del Admin.
const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

function create(url, name) {
  if (!url) throw new Error(`Falta la variable de entorno de ${name}`);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl, max: 3 }) });
}

let web;
let admin;
export const prismaWeb = () => (web ??= create(process.env.DATABASE_URL, 'DATABASE_URL'));
export const prismaAdmin = () => (admin ??= create(process.env.DATABASE_URL_ADMIN, 'DATABASE_URL_ADMIN'));
