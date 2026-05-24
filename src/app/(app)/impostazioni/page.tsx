'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from './actions';

export default function ImpostazioniPage() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
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
