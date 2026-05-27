'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

type Permission = 'loading' | 'granted' | 'denied' | 'error';
type FacingMode = 'environment' | 'user';

interface ZoomCaps {
  min: number;
  max: number;
  step: number;
}

interface Props {
  onCapture: (blob: Blob) => void;
}

export default function CameraStep({ onCapture }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permission, setPermission] = useState<Permission>('loading');
  const [facing, setFacing] = useState<FacingMode>('environment');
  const [capturing, setCapturing] = useState(false);
  const [zoomCaps, setZoomCaps] = useState<ZoomCaps | null>(null);
  const [zoom, setZoom] = useState(1);

  const startCamera = useCallback(async (facingMode: FacingMode) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setZoomCaps(null);
    setZoom(1);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;

      // Assegna lo stream al video — l'elemento è sempre nel DOM grazie al layout unificato
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Leggi le capabilities di zoom (disponibile su Android Chrome, non su iOS)
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number; step: number };
      };
      if (caps.zoom) setZoomCaps(caps.zoom);

      setPermission('granted');
    } catch (err) {
      setPermission(
        err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'error',
      );
    }
  }, []);

  useEffect(() => {
    startCamera('environment');

    function stopStream() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    function handleVisibilityChange() {
      if (document.hidden) stopStream();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopStream();
    };
  }, [startCamera]);

  // Quando il componente monta, il videoRef è già disponibile ma lo stream potrebbe
  // arrivare prima del primo render. Questo effect sincronizza srcObject se necessario.
  useEffect(() => {
    if (permission === 'granted' && videoRef.current && streamRef.current) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [permission]);

  async function applyZoom(value: number) {
    setZoom(value);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
    } catch { /* dispositivo potrebbe non supportarlo dopo l'avvio */ }
  }

  function flipCamera() {
    const next: FacingMode = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    startCamera(next);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current || capturing) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }

    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.92,
    );
  }

  return (
    <>
      {/* Il video è sempre nel DOM — srcObject viene assegnato appena lo stream è pronto,
          indipendentemente dallo stato permission. Nascosto finché non siamo in 'granted'. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover',
          facing === 'user' && '-scale-x-100',
          permission !== 'granted' && 'invisible',
        )}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Stato loading */}
      {permission === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/60 text-sm">Avvio fotocamera…</p>
        </div>
      )}

      {/* Stato denied */}
      {permission === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <Camera className="w-12 h-12 text-white/40" />
          <p className="text-white font-medium">Accesso fotocamera negato</p>
          <p className="text-white/60 text-sm">
            Permetti l&apos;accesso alla fotocamera nelle impostazioni del browser per usare CatSee.
          </p>
          <button onClick={() => router.back()} className="mt-2 text-sm text-primary underline">
            Torna indietro
          </button>
        </div>
      )}

      {/* Stato error */}
      {permission === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <Camera className="w-12 h-12 text-white/40" />
          <p className="text-white font-medium">Fotocamera non disponibile</p>
          <p className="text-white/60 text-sm">
            Impossibile accedere alla fotocamera. Verifica che il dispositivo ne abbia una.
          </p>
          <button onClick={() => router.back()} className="mt-2 text-sm text-primary underline">
            Torna indietro
          </button>
        </div>
      )}

      {/* Controlli — visibili solo se fotocamera attiva */}
      {permission === 'granted' && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <button
              onClick={() => router.back()}
              aria-label="Chiudi fotocamera"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-4 px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">

            {/* Zoom slider — solo se il dispositivo supporta zoom hardware */}
            {zoomCaps && (
              <div className="w-full flex items-center gap-3 px-4">
                <span className="text-white/70 text-xs font-medium tabular-nums w-10 text-right">
                  {zoom.toFixed(1)}×
                </span>
                <input
                  type="range"
                  min={zoomCaps.min}
                  max={zoomCaps.max}
                  step={zoomCaps.step}
                  value={zoom}
                  onChange={(e) => applyZoom(Number(e.target.value))}
                  className={cn(
                    'flex-1 h-1 appearance-none rounded-full cursor-pointer',
                    'bg-white/30',
                    '[&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                    '[&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:bg-white',
                    '[&::-webkit-slider-thumb]:shadow-md',
                  )}
                />
              </div>
            )}

            {/* Shutter + flip */}
            <div className="w-full flex items-center justify-between px-4">
              <div className="w-10" />

              <button
                onClick={capture}
                disabled={capturing}
                aria-label="Scatta foto"
                className={cn(
                  'w-20 h-20 rounded-full border-4 border-white',
                  'flex items-center justify-center',
                  'transition-transform active:scale-95',
                  capturing && 'opacity-50',
                )}
              >
                <div className="w-17 h-17 rounded-full bg-white" />
              </button>

              <button
                onClick={flipCamera}
                aria-label="Cambia fotocamera"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
