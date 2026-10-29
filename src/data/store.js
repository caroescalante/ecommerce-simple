// Datos del local. Reemplazá los valores marcados con TODO.
const DAY = [['09:30', '17:00']];
const DAY_AND_NIGHT = [['09:30', '17:00'], ['19:00', '02:00']];

const store = {
  name: 'Dismarco',
  tagline: 'Delivery de bebidas',
  whatsapp: '5491127710951',
  phoneLabel: '+54 9 11 2771-0951',
  banner: '', // TODO: URL de la imagen de portada (ej: '/banner.jpg'). Vacío = banner generado con CSS
  pickup: { address: 'Juan Pablo II 2126', hours: 'Lunes a Sábado 09:30hs a 17:00 hs' },
  transfer: { alias: 'Nico.francos27', bank: 'Mercado Pago', holder: 'Nicolas Agustin Francos' },
  timeZone: 'America/Argentina/Buenos_Aires',
  // Turnos por día (0 = domingo ... 6 = sábado). Si el cierre es menor que la apertura,
  // el turno termina de madrugada del día siguiente (ej: 19:00 a 02:00).
  schedule: {
    0: [],
    1: DAY,
    2: DAY,
    3: DAY,
    4: DAY,
    5: DAY_AND_NIGHT,
    6: DAY_AND_NIGHT,
  },
};

export default store;
