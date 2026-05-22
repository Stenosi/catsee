'use client';

import { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAX_METERS = 50;

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:oklch(0.705 0.213 47.604);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

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

interface Props {
  originLat: number;
  originLng: number;
  pinLat: number;
  pinLng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function PositionMap({ originLat, originLng, pinLat, pinLng, onChange }: Props) {
  const markerRef = useRef<L.Marker>(null);

  function handleDragEnd() {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    const dist = haversineMeters(originLat, originLng, lat, lng);
    if (dist <= MAX_METERS) {
      onChange(lat, lng);
    } else {
      const scale = MAX_METERS / dist;
      const snapped = {
        lat: originLat + (lat - originLat) * scale,
        lng: originLng + (lng - originLng) * scale,
      };
      marker.setLatLng(snapped);
      onChange(snapped.lat, snapped.lng);
    }
  }

  return (
    <MapContainer
      center={[originLat, originLng]}
      zoom={17}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle
        center={[originLat, originLng]}
        radius={MAX_METERS}
        pathOptions={{ color: 'oklch(0.705 0.213 47.604)', fillColor: 'oklch(0.705 0.213 47.604)', fillOpacity: 0.1, weight: 1.5 }}
      />
      <Marker
        ref={markerRef}
        position={[pinLat, pinLng]}
        draggable
        icon={pinIcon}
        eventHandlers={{ dragend: handleDragEnd }}
      />
    </MapContainer>
  );
}
