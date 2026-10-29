// Localidades con envío sin cargo
export const FREE_LOCALITIES = [
  'Villa Bosch', 'Martín Coronado', 'Podestá', 'Loma Hermosa', 'Libertador', 'Caseros', 'Palomar',
];

export const normalize = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Recibe nombres de zona (barrio, localidad, etc.) y devuelve la localidad sin cargo que coincida, o null
export function matchFreeLocality(candidates = []) {
  const wanted = FREE_LOCALITIES.map((l) => [l, normalize(l)]);
  for (const c of candidates) {
    const n = normalize(c);
    const hit = wanted.find(([, key]) => new RegExp(`\\b${key}\\b`).test(n));
    if (hit) return hit[0];
  }
  return null;
}
