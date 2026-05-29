'use client';

import { useState, useEffect, useRef } from 'react';
import type { ObjectDetection } from '@tensorflow-models/coco-ssd';

export type AiVerifyState = 'idle' | 'loading' | 'cat' | 'no-cat' | 'error';

const IDB_KEY = 'indexeddb://catsee-coco-ssd';

// Singleton in-memory: evita di ricaricare il modello nella stessa sessione tab.
let cachedModel: ObjectDetection | null = null;
// Promise condivisa per evitare download paralleli concorrenti.
let loadingPromise: Promise<ObjectDetection> | null = null;

export function isModelCached() {
  return cachedModel !== null;
}

async function loadModel(): Promise<ObjectDetection> {
  if (cachedModel) return cachedModel;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const [tf, cocoSsd] = await Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/coco-ssd'),
    ]);
    await tf.ready();

    // Prova prima la cache IndexedDB (persiste tra sessioni, sia browser che PWA).
    let model: ObjectDetection | null = null;
    try {
      const saved = await tf.io.listModels();
      if (IDB_KEY in saved) {
        model = await cocoSsd.load({ modelUrl: IDB_KEY });
      }
    } catch {
      // IndexedDB non disponibile o modello corrotto — ricade sul download di rete.
    }

    if (!model) {
      model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      // Salva il graph model in IndexedDB per le sessioni future (fire-and-forget).
      try {
        const raw = (model as unknown as { model: { save(url: string): Promise<unknown> } }).model;
        await raw.save(IDB_KEY);
      } catch {
        // Salvataggio fallito (es. storage quota) — nessun problema, si riscarica la prossima volta.
      }
    }

    cachedModel = model;
    return model;
  })();

  // Se il caricamento fallisce, azzera la promise per permettere un retry.
  loadingPromise.catch(() => { loadingPromise = null; });

  return loadingPromise;
}

/** Pre-carica il modello in background. Idempotente: sicuro da chiamare più volte. */
export function preloadModel() {
  loadModel().catch(() => { /* silent — l'errore verrà gestito all'uso effettivo */ });
}

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
        const model = await loadModel();
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
