import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 lee la conexión de acá (ya no va en schema.prisma).
// Para comandos que tocan la base (db pull, migrate) usar DIRECT_URL: una cuenta con permisos
// de dueño, nunca los roles dismarco_web / dismarco_admin. `prisma generate` no necesita conexión.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
});
