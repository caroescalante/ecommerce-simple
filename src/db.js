import pg from 'pg';

// pg devuelve NUMERIC como string; lo dejamos así y convertimos en el mapeo de productos.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 3,
});

pool.on('error', (err) => console.error('Error inesperado en el pool de Postgres:', err.message));
