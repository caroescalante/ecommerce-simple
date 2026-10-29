import app from './app.js';
import { prismaWeb, prismaAdmin } from './prisma.js';

const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, () => console.log(`API Dismarco escuchando en http://localhost:${port}`));

const shutdown = async () => {
  server.close();
  await Promise.allSettled([prismaWeb().$disconnect(), prismaAdmin().$disconnect()]);
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);