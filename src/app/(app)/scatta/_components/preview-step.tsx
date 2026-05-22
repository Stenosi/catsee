'use client';

import { RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  imageUrl: string;
  onRetry: () => void;
  onContinue: () => void;
}

export default function PreviewStep({ imageUrl, onRetry, onContinue }: Props) {
  return (
    <>
      {/* Foto fullscreen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Foto scattata"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Azioni */}
      <div className="absolute bottom-0 inset-x-0 flex items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex-1 bg-black/50 border-white/30 text-white hover:bg-black/70 hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
          Scarta
        </Button>
        <Button onClick={onContinue} className="flex-1">
          Continua
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}
