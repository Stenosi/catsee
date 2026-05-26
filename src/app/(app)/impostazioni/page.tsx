'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, Download, LogOut, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { logout } from './actions';

export default function ImpostazioniPage() {
  const [isPending, startTransition] = useTransition();
  const { state, install, reset } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);

  function handleInstall() {
    if (state === 'android') {
      install();
    } else if (state === 'ios') {
      setShowIosHint((v) => !v);
    } else if (state === 'hidden') {
      reset();
      // Se il prompt è ancora in memoria lo stato diventa 'android' e al prossimo
      // click si installa; altrimenti l'utente deve ricaricare la pagina.
    }
  }

  const isInstalled = state === 'unsupported';

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">App</h2>

        {isInstalled ? (
          <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 shrink-0 text-success" />
            App già installata
          </div>
        ) : (
          <>
            <Button variant="outline" className="w-full" onClick={handleInstall}>
              <Download className="w-4 h-4" />
              {state === 'hidden' ? 'Riabilita installazione' : 'Installa CatSee'}
            </Button>

            {state === 'hidden' && (
              <p className="text-xs text-muted-foreground px-1">
                Ricarica la pagina dopo aver tappato il bottone per far riapparire il prompt.
              </p>
            )}

            {state === 'ios' && showIosHint && (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Tocca <Share className="inline w-3 h-3 mx-0.5 -mt-0.5" /> in Safari, poi "Aggiungi a schermata Home".
              </div>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
        <Button
          variant="destructive"
          className="w-full"
          disabled={isPending}
          onClick={() => startTransition(() => logout())}
        >
          <LogOut className="w-4 h-4" />
          {isPending ? 'Uscita in corso…' : 'Esci'}
        </Button>
      </section>
    </div>
  );
}
