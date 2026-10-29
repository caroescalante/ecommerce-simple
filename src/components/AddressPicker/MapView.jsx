import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-34.595, -58.58]; // zona de reparto

export default function MapView({ position, onPick }) {
  const el = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    map.current = L.map(el.current).setView(DEFAULT_CENTER, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current);
    map.current.on('click', (e) => pickRef.current(e.latlng.lat, e.latlng.lng));
    return () => {
      map.current.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!position || !map.current) return;
    const ll = [position.lat, position.lng];
    if (!marker.current) {
      marker.current = L.marker(ll, {
        draggable: true,
        icon: L.divIcon({ className: 'pin', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 36] }),
      }).addTo(map.current);
      marker.current.on('dragend', () => {
        const p = marker.current.getLatLng();
        pickRef.current(p.lat, p.lng);
      });
    } else {
      marker.current.setLatLng(ll);
    }
    map.current.setView(ll, Math.max(map.current.getZoom(), 16));
  }, [position]);

  return <div ref={el} className="map" role="application" aria-label="Mapa para ubicar tu dirección" />;
}
