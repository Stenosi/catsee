'use client';

import { useState, useEffect } from 'react';
import CameraStep from './camera-step';
import PreviewStep from './preview-step';
import FormStep, { type PostFormData } from './form-step';

type Step = 'camera' | 'preview' | 'form';

export interface CapturedCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function ScattaWizard() {
  const [step, setStep] = useState<Step>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<CapturedCoords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

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

  function handlePublish(data: PostFormData) {
    // Fase D: upload R2 + salvataggio DB
    console.log('publish', data, capturedBlob?.size, 'bytes');
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
        />
      )}
    </div>
  );
}
