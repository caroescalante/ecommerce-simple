import { matchFreeLocality } from '../data/delivery';

// Nominatim (OpenStreetMap): gratuito, pensado para uso liviano. Para mucho tráfico conviene
// un proveedor propio o pago (Google Places, Mapbox, LocationIQ). Solo hay que cambiar este archivo.
const BASE = 'https://nominatim.openstreetmap.org';
const ZONE_KEYS = ['suburb', 'neighbourhood', 'quarter', 'city_district', 'town', 'village', 'hamlet', 'city', 'municipality'];
// Sesga la búsqueda hacia Buenos Aires y alrededores
const VIEWBOX = '-58.85,-34.45,-58.15,-34.85';

function toResult(item) {
  const a = item.address || {};
  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const zone = a.suburb || a.neighbourhood || a.town || a.village || a.city_district || a.city || '';
  const text = street
    ? `${street}${zone ? `, ${zone}` : ''}`
    : String(item.display_name || '').split(',').slice(0, 3).join(',').trim();
  return {
    text,
    lat: Number(item.lat),
    lng: Number(item.lon),
    // Solo zonas, nunca la calle: "Av. del Libertador" no debe contar como la localidad Libertador
    localityGuess: matchFreeLocality(ZONE_KEYS.map((k) => a[k]).filter(Boolean)),
  };
}

async function get(path, params) {
  const qs = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', 'accept-language': 'es', ...params });
  const res = await fetch(`${BASE}${path}?${qs}`);
  if (!res.ok) throw new Error(`Geocodificación: error ${res.status}`);
  return res.json();
}

export async function searchAddress(query) {
  const data = await get('/search', { q: query, countrycodes: 'ar', limit: '5', viewbox: VIEWBOX });
  return data.map(toResult);
}

export async function reverseGeocode(lat, lng) {
  const data = await get('/reverse', { lat: String(lat), lon: String(lng), zoom: '18' });
  if (data.error) throw new Error('Sin resultados');
  const r = toResult(data);
  return { ...r, lat, lng }; // conserva el punto exacto elegido en el mapa
}
