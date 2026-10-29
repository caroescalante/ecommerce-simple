import { useState } from 'react';
import MapView from './MapView';
import { searchAddress, reverseGeocode } from '../../services/geocode';
import './AddressPicker.css';

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

// value: { text, lat, lng, localityGuess } | null
export default function AddressPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = (r) => {
    setResults([]);
    setError('');
    setQ(r.text);
    onChange(r);
  };

  const search = async (e) => {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setBusy(true);
    setError('');
    setResults([]);
    try {
      const found = await searchAddress(q.trim());
      if (!found.length) setError('No encontramos esa dirección. Probá con la calle y el número, por ejemplo: Av. Central 123.');
      else if (found.length === 1) choose(found[0]);
      else setResults(found);
    } catch {
      setError('No pudimos buscar la dirección ahora. Intentá de nuevo o marcala en el mapa.');
    } finally {
      setBusy(false);
    }
  };

  // Punto elegido en el mapa, arrastrando el pin o con el GPS
  const pick = async (lat, lng) => {
    setBusy(true);
    setError('');
    setResults([]);
    try {
      choose(await reverseGeocode(lat, lng));
    } catch {
      onChange({ text: '', lat, lng, localityGuess: null });
      setError('Ubicamos el punto, pero no pudimos obtener la dirección. Escribila abajo.');
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite usar la ubicación. Buscá tu dirección escribiéndola.');
      return;
    }
    setBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => {
        setBusy(false);
        setError('No pudimos acceder a tu ubicación. Podés escribir tu dirección o marcarla en el mapa.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="addr">
      <h4 className="addr__title">Ingresá tu dirección</h4>
      <form className="addr__search" onSubmit={search} role="search">
        <div className="addr__input">
          <Icon><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>
          <label className="sr-only" htmlFor="addr-q">Dirección</label>
          <input id="addr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. Calle 123" autoComplete="street-address" />
        </div>
        <button className="addr__go" type="submit" disabled={busy} aria-label="Buscar dirección">
          <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
        </button>
      </form>

      <p className="addr__hint">
        Para encontrar tu dirección, escribí el tipo de vía y el número. <b>ej: Calle central 123, Av. central 123</b>
      </p>

      <button type="button" className="addr__geo" onClick={locate} disabled={busy}>
        <Icon><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Icon>
        Usar mi ubicación actual
      </button>

      {busy && <p className="addr__msg" role="status">Buscando…</p>}
      {error && <p className="addr__msg addr__msg--error" role="alert">{error}</p>}

      {results.length > 0 && (
        <ul className="addr__results" aria-label="Resultados">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button" onClick={() => choose(r)}>{r.text}</button>
            </li>
          ))}
        </ul>
      )}

      <MapView position={value && value.lat ? { lat: value.lat, lng: value.lng } : null} onPick={pick} />
      <p className="addr__tip">Tocá el mapa o arrastrá el pin para ajustar la ubicación exacta.</p>

      {value && (
        <label className="field">
          <span>Dirección de entrega</span>
          <input value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder="Calle y número" />
        </label>
      )}
    </div>
  );
}
