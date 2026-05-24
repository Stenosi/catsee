'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MAX_METERS = 50;

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="oklch(0.705 0.213 47.604)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"/>
  <circle cx="14" cy="14" r="5" fill="white"/>
</svg>`;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ScrollWheelOnHover() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    container.addEventListener('mouseenter', enable);
    container.addEventListener('mouseleave', disable);
    return () => {
      container.removeEventListener('mouseenter', enable);
      container.removeEventListener('mouseleave', disable);
    };
  }, [map]);
  return null;
}

interface SnapperProps {
  originLat: number;
  originLng: number;
  restrictToOrigin: boolean;
  onChange: (lat: number, lng: number) => void;
}

function CenterTracker({ originLat, originLng, restrictToOrigin, onChange }: SnapperProps) {
  const map = useMapEvents({
    moveend() {
      const { lat, lng } = map.getCenter();
      if (!restrictToOrigin) {
        onChange(lat, lng);
        return;
      }
      const dist = haversineMeters(originLat, originLng, lat, lng);
      if (dist <= MAX_METERS) {
        onChange(lat, lng);
      } else {
        const scale = MAX_METERS / dist;
        const snapped = {
          lat: originLat + (lat - originLat) * scale,
          lng: originLng + (lng - originLng) * scale,
        };
        map.panTo(snapped, { animate: true, duration: 0.25 });
        onChange(snapped.lat, snapped.lng);
      }
    },
  });
  void map;
  return null;
}

interface Props {
  originLat: number;
  originLng: number;
  restrictToOrigin?: boolean;
  onChange: (lat: number, lng: number) => void;
}

export default function PositionMap({ originLat, originLng, restrictToOrigin = true, onChange }: Props) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[originLat, originLng]}
        zoom={restrictToOrigin ? 17 : 6}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <ScrollWheelOnHover />
        <CenterTracker
          originLat={originLat}
          originLng={originLng}
          restrictToOrigin={restrictToOrigin}
          onChange={onChange}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {restrictToOrigin && (
          <Circle
            center={[originLat, originLng]}
            radius={MAX_METERS}
            pathOptions={{ color: 'oklch(0.705 0.213 47.604)', fillColor: 'oklch(0.705 0.213 47.604)', fillOpacity: 0.1, weight: 1.5 }}
          />
        )}
      </MapContainer>

      {/* Pin fisso al centro, punta ancorata al punto esatto */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-1000"
        style={{ paddingBottom: 36 }}
        dangerouslySetInnerHTML={{ __html: PIN_SVG }}
      />
    </div>
  );
}