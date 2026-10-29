// Crea un usuario administrador con la contraseña hasheada (argon2id).
// La clave se pide por consola (oculta) y nunca se guarda en ningún archivo.
//
//   DATABASE_URL=postgres://postgres:CLAVE@localhost:5432/dismarco \
//     node scripts/crear-admin.js dueno@correo.com "Nombre del dueño"
//
// Se usa la cuenta DUEÑA de la base (no dismarco_admin, que no puede crear usuarios).
import readline from 'node:readline';
import argon2 from 'argon2';
import pg from 'pg';

const [emailArg, nombre = 'Administrador'] = process.argv.slice(2);
if (!emailArg || !process.env.DATABASE_URL) {
  console.error('Uso: DATABASE_URL=postgres://dueño:clave@host:5432/dismarco node scripts/crear-admin.js email@dominio.com "Nombre"');
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (s) => rl.output.write(rl.stdoutMuted && !s.includes(question) ? '*' : s);
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    rl.stdoutMuted = true;
  });
}

let password = process.env.ADMIN_PASSWORD; // opcional, solo para automatizar
if (!password) {
  password = await askHidden('Contraseña (mínimo 12 caracteres): ');
  const again = await askHidden('Repetí la contraseña: ');
  if (password !== again) { console.error('Las contraseñas no coinciden.'); process.exit(1); }
}
if (password.length < 12) { console.error('La contraseña debe tener al menos 12 caracteres.'); process.exit(1); }

// Parámetros recomendados por OWASP para argon2id
const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query(
    "INSERT INTO public.usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin') RETURNING id",
    [nombre, email, hash],
  );
  console.log(`Usuario creado: ${email} (id ${rows[0].id})`);
} catch (err) {
  console.error(err.code === '23505' ? 'Ya existe un usuario con ese email.' : `Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
