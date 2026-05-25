'use client';

import { useState, useEffect, useRef } from 'react';

export type AiVerifyState = 'idle' | 'loading' | 'cat' | 'no-cat' | 'error';

export function useAiVerify(imageUrl: string | null, enabled: boolean) {
  const [state, setState] = useState<AiVerifyState>('idle');
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enabled || !imageUrl || ranRef.current) return;
    ranRef.current = true;
    setState('loading');

    let cancelled = false;

    async function run() {
      try {
        const [tf, cocoSsd] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/coco-ssd'),
        ]);
        await tf.ready();

        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (cancelled) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl!;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('img load failed'));
        });
        if (cancelled) return;

        const predictions = await model.detect(img);
        if (cancelled) return;

        const hasCat = predictions.some(
          (p) => p.class === 'cat' && p.score >= 0.35,
        );
        setState(hasCat ? 'cat' : 'no-cat');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [enabled, imageUrl]);

  return state;
}
