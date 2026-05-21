'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { checkUsername, completeOnboarding } from './actions';

type Step = 'username' | 'nickname';
type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) {
      setUsernameState('idle');
      setUsernameError('');
      return;
    }
    setUsernameState('checking');
    debounceRef.current = setTimeout(async () => {
      const result = await checkUsername(username);
      if (result.error) {
        setUsernameState('invalid');
        setUsernameError(result.error);
      } else if (result.available) {
        setUsernameState('available');
        setUsernameError('');
      } else {
        setUsernameState('taken');
        setUsernameError('Username già in uso.');
      }
    }, 400);
  }, [username]);

  function handleSubmit() {
    setFormError('');
    const formData = new FormData();
    formData.set('username', username);
    formData.set('nickname', nickname);
    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (result?.error) setFormError(result.error);
    });
  }

  const canProceedUsername = usernameState === 'available';
  const canSubmit = canProceedUsername && nickname.trim().length > 0 && !isPending;
  const isUsernameError = usernameState === 'taken' || usernameState === 'invalid';

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-8 max-w-sm mx-auto w-full">

      {/* Progress indicator */}
      <div className="flex items-center mb-10" aria-label={`Step ${step === 'username' ? 1 : 2} di 2`}>
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
        <div className="relative w-10 h-0.5 bg-muted mx-1">
          <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-in-out ${step === 'nickname' ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-200 ${step === 'nickname' ? 'delay-300' : 'delay-0'} ${step === 'nickname' ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {step === 'username' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">Crea il tuo username</h1>
            <p className="text-sm text-muted-foreground">Il tuo nome unico su CatSee. Nessun altro può averlo - modificabile ogni 30 giorni.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none z-10">
                @
              </span>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="mario_rossi"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                aria-describedby="username-feedback"
                aria-invalid={isUsernameError}
                className="pl-7 pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameState === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden="true" />
                )}
                {usernameState === 'available' && (
                  <CheckCircle className="w-4 h-4 text-success" aria-hidden="true" />
                )}
                {isUsernameError && (
                  <XCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
                )}
              </div>
            </div>
            <p
              id="username-feedback"
              role="status"
              className={`text-xs min-h-4 ${usernameState === 'available' ? 'text-success' : 'text-destructive'}`}
            >
              {usernameState === 'available' && 'Disponibile!'}
              {isUsernameError && usernameError}
            </p>
          </div>

          <Alert>
            <Info />
            <AlertTitle>Requisiti username</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Solo lettere, numeri, punto e underscore</li>
                <li>Da 3 a 30 caratteri</li>
                <li>Non può iniziare o finire con <code>.</code> o <code>_</code></li>
                <li>Modificabile ogni 30 giorni</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setStep('nickname')}
            disabled={!canProceedUsername}
            className="w-full mt-auto"
          >
            Continua
          </Button>
        </div>
      )}

      {step === 'nickname' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">Come vuoi essere chiamato?</h1>
            <p className="text-sm text-muted-foreground">Il nome che gli altri vedono sul tuo profilo. Puoi cambiarlo quando vuoi.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nickname" className="text-sm font-medium text-foreground">
              Nickname
            </label>
            <Input
              id="nickname"
              type="text"
              autoComplete="nickname"
              placeholder="Mario Rossi 🐱"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground text-right">{nickname.length}/30</p>
          </div>

          <Alert>
            <Info />
            <AlertTitle>Note sul nickname</AlertTitle>
            <AlertDescription>
              <ul className="list-none pl-0 space-y-1 mt-1">
                <li>Può contenere spazi, emoji e caratteri speciali</li>
                <li>Massimo 30 caratteri</li>
                <li>Modificabile in qualsiasi momento</li>
              </ul>
            </AlertDescription>
          </Alert>

          {formError && (
            <p className="text-sm text-destructive" role="alert">{formError}</p>
          )}

          <div className="flex gap-3 mt-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep('username')}
              disabled={isPending}
              className="flex-1"
            >
              Indietro
            </Button>
            <Button type="submit" disabled={!canSubmit} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Salvataggio…
                </>
              ) : (
                'Inizia ad avvistare!'
              )}
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}