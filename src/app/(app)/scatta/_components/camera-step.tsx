'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

type Permission = 'loading' | 'granted' | 'denied' | 'error';
type FacingMode = 'environment' | 'user';

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

  const startCamera = useCallback(async (facingMode: FacingMode) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
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

  if (permission === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60 text-sm">Avvio fotocamera…</p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <Camera className="w-12 h-12 text-white/40" />
        <p className="text-white font-medium">Accesso fotocamera negato</p>
        <p className="text-white/60 text-sm">
          Permetti l&apos;accesso alla fotocamera nelle impostazioni del browser per usare CatSee.
        </p>
        <button onClick={() => router.back()} className="mt-2 text-sm text-primary underline">
          Torna indietro
        </button>
      </div>
    );
  }

  if (permission === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <Camera className="w-12 h-12 text-white/40" />
        <p className="text-white font-medium">Fotocamera non disponibile</p>
        <p className="text-white/60 text-sm">
          Impossibile accedere alla fotocamera. Verifica che il dispositivo ne abbia una.
        </p>
        <button onClick={() => router.back()} className="mt-2 text-sm text-primary underline">
          Torna indietro
        </button>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover',
          facing === 'user' && '-scale-x-100',
        )}
      />

      <canvas ref={canvasRef} className="hidden" />

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
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-10 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
        <div className="w-10" />

        {/* Shutter */}
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
          <div className="w-[68px] h-[68px] rounded-full bg-white" />
        </button>

        {/* Flip */}
        <button
          onClick={flipCamera}
          aria-label="Cambia fotocamera"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
