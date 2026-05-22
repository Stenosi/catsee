'use client';

import Cropper from 'react-easy-crop';
import { useState, useCallback } from 'react';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const SIZE = 400;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, SIZE, SIZE);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.9,
    );
  });
}

interface Props {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, cap: Area) => {
    setCroppedAreaPixels(cap);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 text-center">
        <p className="text-sm font-medium text-white">Sposta e ridimensiona</p>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="shrink-0 flex gap-3 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-black">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Elaborazione…' : 'Conferma'}
        </Button>
      </div>
    </div>
  );
}
