import { useEffect, useState } from 'react';

export const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY = 1440;
const WEEK = 7 * DAY;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Día y minutos actuales en la zona horaria del local (no la del dispositivo)
function nowInZone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    day: WEEKDAY_INDEX[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

// Convierte los turnos en intervalos absolutos de la semana (minutos desde el domingo 00:00).
// Un turno que cruza la medianoche se extiende al día siguiente.
function buildIntervals(schedule) {
  const list = [];
  Object.entries(schedule).forEach(([d, shifts]) => {
    shifts.forEach(([open, close]) => {
      const start = Number(d) * DAY + toMinutes(open);
      let end = Number(d) * DAY + toMinutes(close);
      if (end <= start) end += DAY;
      list.push({ start, end, close });
    });
  });
  return list;
}

export function computeStatus({ timeZone, schedule }) {
  const { day, minutes } = nowInZone(timeZone);
  const now = day * DAY + minutes;
  const intervals = buildIntervals(schedule);

  // Abierto: el turno puede haber empezado la semana anterior (sábado de noche -> domingo)
  const current = intervals.find(
    (i) => (i.start <= now && now < i.end) || (i.start <= now + WEEK && now + WEEK < i.end),
  );
  if (current) {
    return { isOpen: true, today: day, detail: `Cierra a las ${current.close} hs` };
  }

  // Cerrado: buscar el próximo turno
  let next = null;
  let wait = Infinity;
  intervals.forEach((i) => {
    const w = (i.start - now + WEEK) % WEEK;
    if (w > 0 && w < wait) { wait = w; next = i; }
  });
  if (!next) return { isOpen: false, today: day, detail: 'Cerrado' };

  const startDay = Math.floor(next.start / DAY) % 7;
  const startTime = `${String(Math.floor((next.start % DAY) / 60)).padStart(2, '0')}:${String(next.start % 60).padStart(2, '0')}`;
  const daysAhead = (startDay - day + 7) % 7;
  const when = daysAhead === 0 ? 'hoy' : daysAhead === 1 ? 'mañana' : `el ${DAY_NAMES[startDay]}`;
  return { isOpen: false, today: day, detail: `Abre ${when} a las ${startTime} hs` };
}

export default function useOpenStatus(store) {
  const [status, setStatus] = useState(() => computeStatus(store));
  useEffect(() => {
    const id = setInterval(() => setStatus(computeStatus(store)), 30000);
    return () => clearInterval(id);
  }, [store]);
  return status;
}
