'use client';

import { useTransition } from 'react';
import { Download, LogOut, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { logout } from './actions';

export default function ImpostazioniPage() {
  const [isPending, startTransition] = useTransition();
  const { state, install, reset } = useInstallPrompt();

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      {/* Sezione App — nascosta se già installata */}
      {state !== 'unsupported' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">App</h2>

          {state === 'android' && (
            <Button variant="outline" className="w-full" onClick={install}>
              <Download className="w-4 h-4" />
              Installa CatSee
            </Button>
          )}

          {state === 'ios' && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-col gap-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                Installa su iPhone
              </p>
              <p className="text-xs text-muted-foreground">
                Tocca <Share className="inline w-3 h-3 mx-0.5 -mt-0.5" /> in Safari, poi "Aggiungi a schermata Home".
              </p>
            </div>
          )}

          {/* Android: banner precedentemente dismissato, prompt non più disponibile */}
          {state === 'hidden' && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Hai chiuso il banner di installazione. Ricarica la pagina per far riapparire il prompt.
              </p>
              <Button variant="outline" size="sm" className="self-start" onClick={reset}>
                Riabilita banner
              </Button>
            </div>
          )}
        </section>
      )}

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
