'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { CheckCircle, Download, LogOut, Share, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { logout, savePrivacyLevel, deleteAccount } from '../actions';
import type { PrivacyLevel } from '../actions';
import { toast } from 'sonner';
import type { UserSettings } from '@/db/schema';

interface Props {
  settings: UserSettings;
  username: string;
}

function settingsToLevel(s: UserSettings): PrivacyLevel {
  if (s.preciseLocation) return 'precise';
  if (s.highPrivacy) return 'high';
  return 'standard';
}

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: 'Posizione approssimata di ±150m' },
  { value: 'high', label: 'Privacy rafforzata', desc: 'Posizione approssimata di ±300m' },
  { value: 'precise', label: 'Posizione precisa', desc: 'Mostra esattamente dove hai scattato' },
];

export default function ImpostazioniClient({ settings, username }: Props) {
  const [logoutPending, startLogoutTransition] = useTransition();
  const [, startPrivacyTransition] = useTransition();
  const { state, install, reset } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);

  // Privacy level — optimistic UI
  const [committedLevel, setCommittedLevel] = useState<PrivacyLevel>(settingsToLevel(settings));
  const [optimisticLevel, setOptimisticLevel] = useOptimistic(committedLevel);

  // Delete account dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [isDeleting, startDeleteTransition] = useTransition();

  const isInstalled = state === 'unsupported';

  function handleInstall() {
    if (state === 'android') {
      install();
    } else if (state === 'ios') {
      setShowIosHint((v) => !v);
    } else if (state === 'hidden') {
      reset();
    }
  }

  function handlePrivacyChange(newLevel: string) {
    const level = newLevel as PrivacyLevel;
    startPrivacyTransition(async () => {
      setOptimisticLevel(level);
      const result = await savePrivacyLevel(level);
      if (result.success) {
        setCommittedLevel(level);
      } else {
        toast.error(result.error ?? 'Errore nel salvataggio.');
        // optimistic reverts automatically to committedLevel
      }
    });
  }

  function handleDeleteAccount() {
    startDeleteTransition(async () => {
      const result = await deleteAccount(usernameInput);
      if (!result.success) {
        toast.error(result.error ?? "Impossibile eliminare l'account.");
      }
      // On success, signOut() in the action redirects to /login
    });
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      {/* ── Sezione App ──────────────────────────────────────────────────── */}
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
                Tocca <Share className="inline w-3 h-3 mx-0.5 -mt-0.5" /> in Safari, poi &ldquo;Aggiungi a schermata Home&rdquo;.
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Sezione Privacy ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Privacy</h2>

        <RadioGroup
          value={optimisticLevel}
          onValueChange={handlePrivacyChange}
          className="gap-0 divide-y divide-border overflow-hidden rounded-xl border border-border"
        >
          {PRIVACY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 has-data-checked:bg-primary/10 has-data-checked:hover:bg-primary/20 has-disabled:cursor-not-allowed has-disabled:opacity-50"
            >
              <RadioGroupItem value={opt.value} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </div>
            </label>
          ))}
        </RadioGroup>

        {optimisticLevel === 'precise' && (
          <p className="text-xs text-warning px-1">
            La posizione esatta è visibile a chiunque veda i tuoi post.
          </p>
        )}
      </section>

      {/* ── Sezione Account ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>

        <AlertDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            setDeleteOpen(o);
            if (!o) setUsernameInput('');
          }}
        >
          <ButtonGroup orientation="vertical" className="w-full">
            <Button
              variant="destructive"
              className="w-full py-5"
              disabled={logoutPending}
              onClick={() => startLogoutTransition(() => logout())}
            >
              <LogOut className="w-4 h-4" />
              {logoutPending ? 'Uscita in corso…' : 'Esci'}
            </Button>
            <AlertDialogTrigger render={<Button variant="destructive" className="w-full py-5" />}>
              <Trash2 className="w-4 h-4" />
              Elimina account
            </AlertDialogTrigger>
          </ButtonGroup>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare il tuo account?</AlertDialogTitle>
              <AlertDialogDescription>
                Azione irreversibile. I tuoi post resteranno visibili in forma anonima per 30 giorni, poi verranno eliminati definitivamente.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">
                Digita <span className="font-medium text-foreground">@{username}</span> per confermare
              </label>
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={username}
                autoComplete="off"
                autoCapitalize="none"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={usernameInput !== username || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Eliminazione…' : 'Elimina account'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </section>
    </div>
  );
}
