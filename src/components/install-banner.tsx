'use client';

import { useEffect, useState } from 'react';
import { X, Share, Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

export default function InstallBanner() {
  const { state, install, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  // Piccolo delay per non sparare il banner appena aperta l'app
  useEffect(() => {
    if (state === 'android' || state === 'ios') {
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [state]);

  function handleDismiss() {
    setVisible(false);
    // Aspetta la fine dell'animazione prima di rimuovere dal DOM
    setTimeout(dismiss, 300);
  }

  if (state === 'unsupported' || state === 'hidden') return null;

  return (
    <div
      className="fixed bottom-24 inset-x-0 z-900 flex justify-center px-4 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        {/* Icona app */}
        <img src="/icon-192" alt="CatSee" className="w-10 h-10 rounded-xl shrink-0" />

        {/* Testo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Installa CatSee</p>
          {state === 'ios' ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tocca <Share className="inline w-3 h-3 mx-0.5 -mt-0.5" /> poi "Aggiungi a Home"
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggiungila alla schermata Home
            </p>
          )}
        </div>

        {/* CTA Android */}
        {state === 'android' && (
          <button
            onClick={install}
            className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            <Download className="w-3.5 h-3.5" />
            Installa
          </button>
        )}

        {/* Chiudi */}
        <button
          onClick={handleDismiss}
          aria-label="Chiudi"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
