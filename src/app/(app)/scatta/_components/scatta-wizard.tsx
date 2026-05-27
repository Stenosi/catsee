'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { Vibrant } from 'node-vibrant/browser';
import CameraStep from './camera-step';
import PreviewStep from './preview-step';
import FormStep, { type PostFormData } from './form-step';
import { getUploadUrls, publishSighting } from '../actions';
import { useAiVerify } from './use-ai-verify';
import AiLoadingStep from './ai-loading-step';
import type { PaletteEntry } from '@/db/schema/sightings';

type Step = 'camera' | 'preview' | 'form';

// ── Palette → cat color mapping ───────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function matchToCatColor(hex: string): string | null {
  const [h, s, l] = hexToHsl(hex);
  if (l < 18) return 'black';
  if (l > 87) return 'white';
  if (s < 14) return 'gray';
  if (h >= 15 && h <= 55) {
    if (s >= 40 && l > 58) return 'orange';
    if (s >= 20 && l >= 20) return 'brown';
  }
  return null;
}

function mapPaletteToColors(palette: PaletteEntry[]): string[] {
  const totals: Record<string, number> = {};
  for (const { hex, percentage } of palette) {
    const color = matchToCatColor(hex);
    if (color) totals[color] = (totals[color] ?? 0) + percentage;
  }
  return Object.entries(totals)
    .filter(([, pct]) => pct >= 8)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);
}

export interface CapturedCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function ScattaWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<CapturedCoords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<PaletteEntry[]>([]);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [deviceChecked, setDeviceChecked] = useState(false);

  const aiVerifyState = useAiVerify(capturedUrl, step === 'form');

  // GPS avviato subito, mentre l'utente è ancora sulla camera.
  // Su desktop (nessun touch point) mostriamo la schermata di blocco.
  useEffect(() => {
    const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    if (!touchDevice) {
      setIsDesktop(true);
      setDeviceChecked(true);
      return;
    }
    setDeviceChecked(true);
    if (!navigator.geolocation) {
      setGeoError('GPS non supportato dal dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => setGeoError('Impossibile rilevare la posizione'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (step !== 'form' || !capturedUrl) return;
    Vibrant.from(capturedUrl).getPalette().then((swatches) => {
      const valid = Object.values(swatches).filter((s) => s !== null);
      const total = valid.reduce((sum, s) => sum + s.population, 0) || 1;
      const colors: PaletteEntry[] = valid.map((s) => ({
        hex: s.hex,
        percentage: Math.round((s.population / total) * 100),
      }));
      setExtractedPalette(colors);
      setSuggestedColors(mapPaletteToColors(colors));
    }).catch(() => {
      // palette non estratta — si salva [] come fallback
    });
  }, [step, capturedUrl]);

  function handleCapture(blob: Blob) {
    setCapturedBlob(blob);
    setCapturedUrl(URL.createObjectURL(blob));
    setStep('preview');
  }

  function handleRetry() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setStep('camera');
  }

  async function handlePublish(data: PostFormData) {
    if (!capturedBlob) return;
    setPublishing(true);

    try {
      // 1. Genera URL presigned
      const urlResult = await getUploadUrls();
      if (!urlResult.success) {
        toast.error(urlResult.error);
        return;
      }

      // 2. Comprimi thumbnail (max 400px, qualità 0.7)
      const thumbnailBlob = await imageCompression(
        new File([capturedBlob], 'photo.jpg', { type: 'image/jpeg' }),
        { maxWidthOrHeight: 400, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.7 },
      );

      // 3. Upload foto originale + thumbnail in parallelo
      const [photoRes, thumbRes] = await Promise.all([
        fetch(urlResult.photoUploadUrl, { method: 'PUT', body: capturedBlob, headers: { 'Content-Type': 'image/jpeg' } }),
        fetch(urlResult.thumbnailUploadUrl, { method: 'PUT', body: thumbnailBlob, headers: { 'Content-Type': 'image/jpeg' } }),
      ]);

      if (!photoRes.ok || !thumbRes.ok) {
        toast.error('Errore durante il caricamento della foto. Riprova.');
        return;
      }

      // 4. Salva nel DB
      const aiVerified = aiVerifyState === 'cat';
      const result = await publishSighting({
        photoKey: urlResult.photoKey,
        thumbnailKey: urlResult.thumbnailKey,
        catName: data.catName,
        colors: data.colors,
        furLength: data.furLength,
        notes: data.notes,
        pinLat: data.pinLat,
        pinLng: data.pinLng,
        extractedPalette,
        aiVerified,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // 5. Successo
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      if (aiVerified) {
        toast.success('Avvistamento pubblicato!');
      } else {
        toast.success('Avvistamento salvato — in attesa di approvazione.', {
          description: 'Non abbiamo rilevato un gatto con certezza. Sarà visibile dopo la revisione.',
          duration: 6000,
        });
      }
      router.replace('/feed');
    } catch {
      toast.error('Qualcosa è andato storto. Riprova.');
    } finally {
      setPublishing(false);
    }
  }

  if (!deviceChecked) return <div className="fixed inset-0 bg-black z-50" />;

  if (isDesktop) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
          <Camera className="w-9 h-9 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">Funzione solo mobile</h1>
          <p className="text-sm text-muted-foreground">
            Per scattare una foto devi usare CatSee dal tuo smartphone.
          </p>
        </div>
        <Link
          href="/mappa"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Torna alla mappa
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {step === 'camera' && <CameraStep onCapture={handleCapture} />}
      {step === 'preview' && capturedUrl && (
        <PreviewStep
          imageUrl={capturedUrl}
          onRetry={handleRetry}
          onContinue={() => setStep('form')}
        />
      )}
      {step === 'form' && capturedUrl && (
        aiVerifyState === 'idle' || aiVerifyState === 'loading'
          ? <AiLoadingStep />
          : (
            <div className="motion-preset-fade motion-duration-400 absolute inset-0">
              <FormStep
                imageUrl={capturedUrl}
                coords={coords}
                geoError={geoError}
                onBack={handleRetry}
                onPublish={handlePublish}
                publishing={publishing}
                suggestedColors={suggestedColors}
                aiVerifyState={aiVerifyState}
                isDesktop={isDesktop}
              />
            </div>
          )
      )}
    </div>
  );
}
