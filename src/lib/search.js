// Prisma `contains` no escapa los comodines de LIKE: sin esto, buscar "%" devolvería todos los productos.
export const likeEscape = (s) => s.replace(/[\\%_]/g, '\\$&');
