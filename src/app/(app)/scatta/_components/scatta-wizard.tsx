'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import CameraStep from './camera-step';
import PreviewStep from './preview-step';
import FormStep, { type PostFormData } from './form-step';
import { getUploadUrls, publishSighting } from '../actions';

type Step = 'camera' | 'preview' | 'form';

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

  // GPS avviato subito, mentre l'utente è ancora sulla camera
  useEffect(() => {
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
      const result = await publishSighting({
        photoKey: urlResult.photoKey,
        thumbnailKey: urlResult.thumbnailKey,
        catName: data.catName,
        colors: data.colors,
        furLength: data.furLength,
        notes: data.notes,
        pinLat: data.pinLat,
        pinLng: data.pinLng,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // 5. Successo
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      toast.success('Avvistamento pubblicato!');
      router.replace('/profilo');
    } catch {
      toast.error('Qualcosa è andato storto. Riprova.');
    } finally {
      setPublishing(false);
    }
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
        <FormStep
          imageUrl={capturedUrl}
          coords={coords}
          geoError={geoError}
          onBack={handleRetry}
          onPublish={handlePublish}
          publishing={publishing}
        />
      )}
    </div>
  );
}
