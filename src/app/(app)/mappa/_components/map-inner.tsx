'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LocateFixed } from 'lucide-react';
import type { MapSighting } from '../actions';
import SightingSheet from './sighting-sheet';

function createCatPin(thumbnailUrl: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;border-radius:50%;
      border:2px solid oklch(0.705 0.213 47.604);
      overflow:hidden;background:#e5e5ea;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">
      <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

interface CatMarkerClusterProps {
  sightings: MapSighting[];
  onPinClick: (s: MapSighting) => void;
}

function CatMarkerCluster({ sightings, onPinClick }: CatMarkerClusterProps) {
  const map = useMap();

  useEffect(() => {
    const cluster = (L as unknown as { markerClusterGroup: (opts: object) => L.LayerGroup }).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (c: { getChildCount: () => number }) => L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:oklch(0.705 0.213 47.604);
          color:white;font-size:13px;font-weight:600;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">${c.getChildCount()}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    });

    for (const s of sightings) {
      const marker = L.marker([s.lat, s.lng], { icon: createCatPin(s.thumbnailUrl) });
      marker.on('click', () => onPinClick(s));
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    return () => { map.removeLayer(cluster); };
  }, [map, sightings, onPinClick]);

  return null;
}

interface InitialPositionProps {
  onLocated: (lat: number, lng: number) => void;
}

function InitialPosition({ onLocated }: InitialPositionProps) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
        onLocated(pos.coords.latitude, pos.coords.longitude);
      },
      () => { /* permission denied or error - stay on default center */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

interface MapFlyToBinderProps {
  flyToRef: React.MutableRefObject<((pos: [number, number] | null) => void) | null>;
}

function MapFlyToBinder({ flyToRef }: MapFlyToBinderProps) {
  const map = useMap();
  flyToRef.current = useCallback((pos: [number, number] | null) => {
    if (pos) {
      map.flyTo(pos, 14, { duration: 1 });
    } else {
      map.flyTo([42.5, 12.5], 6, { duration: 1 });
    }
  }, [map]);
  return null;
}

interface ViewportEmptyCheckerProps {
  sightings: MapSighting[];
  onEmpty: (isEmpty: boolean) => void;
}

function ViewportEmptyChecker({ sightings, onEmpty }: ViewportEmptyCheckerProps) {
  const map = useMapEvents({
    moveend() { check(); },
    zoomend() { check(); },
  });

  function check() {
    const bounds = map.getBounds();
    const visible = sightings.some((s) => bounds.contains([s.lat, s.lng]));
    onEmpty(!visible);
  }

  return null;
}

interface Props {
  sightings: MapSighting[];
}

export default function MapInner({ sightings }: Props) {
  const [selectedSighting, setSelectedSighting] = useState<MapSighting | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const flyToRef = useRef<((pos: [number, number] | null) => void) | null>(null);

  const handlePinClick = useCallback((s: MapSighting) => {
    setSelectedSighting(s);
  }, []);

  const handleLocated = useCallback((lat: number, lng: number) => {
    setUserPosition([lat, lng]);
  }, []);

  return (
    <div className="relative h-full w-full">
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
        <InitialPosition onLocated={handleLocated} />
        <CatMarkerCluster sightings={sightings} onPinClick={handlePinClick} />
        <ViewportEmptyChecker sightings={sightings} onEmpty={setIsEmpty} />
        <MapFlyToBinder flyToRef={flyToRef} />
      </MapContainer>

      {/* FAB outside MapContainer, but still overlays it */}
      <div className="absolute bottom-4 right-4 z-900 pointer-events-auto">
        <button
          onClick={() => flyToRef.current?.(userPosition)}
          aria-label="Torna alla mia posizione"
          className="w-11 h-11 rounded-full bg-card shadow-lg border border-border flex items-center justify-center active:opacity-70"
        >
          <LocateFixed className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div
        className="absolute inset-x-0 top-4 flex justify-center z-900 pointer-events-none transition-opacity duration-300"
        style={{ opacity: isEmpty ? 1 : 0 }}
      >
        <div className="bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 shadow">
          <p className="text-sm text-muted-foreground">Nessun gatto in quest&apos;area</p>
        </div>
      </div>

      <SightingSheet sighting={selectedSighting} onClose={() => setSelectedSighting(null)} />
    </div>
  );
}
