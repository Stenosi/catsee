import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export const metadata = { title: 'Termini di servizio - CatSee' };

export default function TerminiPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background px-6 pt-4 pb-8">

      <Link
        href="/login"
        className="flex items-center gap-1 text-sm text-muted-foreground w-fit -ml-1 py-2"
        aria-label="Torna indietro"
      >
        <ArrowLeft className="w-4 h-4" />
        Indietro
      </Link>

      <div className="flex flex-col flex-1 items-center justify-center gap-4 max-w-sm mx-auto w-full text-center">
        <Construction className="w-10 h-10 text-muted-foreground opacity-50" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">Termini di servizio</h1>
          <p className="text-sm text-muted-foreground">
            Questa pagina è in preparazione e sarà disponibile prima del lancio ufficiale di CatSee.
          </p>
        </div>
      </div>

    </div>
  );
}
