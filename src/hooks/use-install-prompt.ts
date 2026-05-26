'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState =
  | 'unsupported'   // già installata o browser non compatibile
  | 'android'       // beforeinstallprompt disponibile
  | 'ios'           // iOS: istruzioni manuali
  | 'hidden';       // l'utente ha già dismissato il banner

const DISMISSED_KEY = 'pwa-install-dismissed';

export function useInstallPrompt() {
  const [state, setState] = useState<InstallState>('unsupported');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Già installata come PWA → non mostrare nulla
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Già dismissata in precedenza
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Rileva iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setState('ios');
      return;
    }

    // Android / Chrome: aspetta beforeinstallprompt
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState('android');
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setState('unsupported');
    }
    setDeferredPrompt(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setState('hidden');
  }

  function reset() {
    localStorage.removeItem(DISMISSED_KEY);
    if (deferredPrompt) {
      // Prompt ancora in memoria (stessa sessione) → torna subito installabile
      setState('android');
    } else {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIos) setState('ios');
      // Android senza prompt: stato rimane 'hidden', il chiamante mostra
      // un messaggio "ricarica la pagina"
    }
  }

  return { state, install, dismiss, reset };
}
