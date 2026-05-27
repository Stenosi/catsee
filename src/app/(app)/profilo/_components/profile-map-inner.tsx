'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const CLOCK_BADGE = `
  <div style="
    position:absolute;bottom:-3px;right:-3px;
    width:18px;height:18px;border-radius:50%;
    background:white;border:1.5px solid #8e8e93;
    display:flex;align-items:center;justify-content:center;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  </div>`;

function createProfilePin(thumbnailUrl: string, pending: boolean): L.DivIcon {
  const border = pending
    ? '2px solid #8e8e93'
    : '2px solid oklch(0.705 0.213 47.604)';
  const filter = pending ? 'filter:grayscale(1);' : '';
  const badge = pending ? CLOCK_BADGE : '';

  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:44px;height:44px;">
      <div style="
        width:44px;height:44px;border-radius:50%;
        border:${border};overflow:hidden;background:#e5e5ea;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);${filter}
      ">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" draggable="false"/>
      </div>
      ${badge}
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export interface ProfileMapSighting {
  id: string;
  lat: number;
  lng: number;
  thumbnailUrl: string;
  catNickname: string;
  pending: boolean;
}

interface MarkersProps {
  sightings: ProfileMapSighting[];
}

function Markers({ sightings }: MarkersProps) {
  const map = useMap();
  const router = useRouter();

  useEffect(() => {
    const markers: L.Marker[] = [];

    for (const s of sightings) {
      const marker = L.marker([s.lat, s.lng], {
        icon: createProfilePin(s.thumbnailUrl, s.pending),
      });
      marker.on('click', () => {
        if (s.pending) {
          toast.info('Post in attesa di approvazione', {
            description: 'Questo avvistamento sarà visibile a tutti una volta approvato.',
          });
        } else {
          router.push(`/post/${s.id}`);
        }
      });
      marker.addTo(map);
      markers.push(marker);
    }

    if (sightings.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 15 });
    }

    return () => { markers.forEach((m) => m.remove()); };
  }, [map, sightings]);

  return null;
}

interface Props {
  sightings: ProfileMapSighting[];
}

export default function ProfileMapInner({ sightings }: Props) {
  return (
    <MapContainer
      center={[42.5, 12.5]}
      zoom={6}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      {/* dark mode: https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=... */}
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Markers sightings={sightings} />
    </MapContainer>
  );
}
