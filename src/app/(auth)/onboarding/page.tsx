'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, CheckCircle, XCircle, Info, Check, X, Minus,
  Camera, MapPin, CheckCircle2, AlertCircle, Smartphone, Share,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { checkUsername, saveUsernameNickname, getOnboardingAvatarUploadUrl, saveOnboardingAvatarUrl, saveOnboardingPrivacyLevel, type PrivacyLevel } from './actions';
import AvatarCropModal from '@/app/(app)/profilo/modifica/_components/avatar-crop-modal';

// ── Shared components ─────────────────────────────────────────────────────────

function ConstraintRow({ met, idle, children }: { met: boolean; idle: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('flex items-center gap-2 text-sm transition-colors duration-150',
      idle ? 'text-muted-foreground' : met ? 'text-success' : 'text-destructive',
    )}>
      {idle ? <Minus className="w-3.5 h-3.5 shrink-0" /> : met
        ? <Check className="w-3.5 h-3.5 shrink-0" />
        : <X className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </li>
  );
}

const STEPS = ['username', 'nickname', 'avatar', 'privacy', 'gps', 'pwa'] as const;
type Step = typeof STEPS[number];

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied';

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: '±150m — bilancia privacy e utilità' },
  { value: 'high', label: 'Privacy rafforzata', desc: '±300m — più anonimato' },
  { value: 'precise', label: 'Posizione precisa', desc: '0m — coordinate esatte pubblicate' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Step
  const [step, setStep] = useState<Step>('username');

  // Step 1 — username
  const [username, setUsername] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [usernameError, setUsernameError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 — nickname
  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState('');
  const [isPendingNickname, startNicknameTransition] = useTransition();

  // Step 3 — avatar
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4 — privacy
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('standard');
  const [isSavingPrivacy, startPrivacyTransition] = useTransition();

  // Step 5 — GPS
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');

  // Step 6 — PWA
  const [pwaStatus, setPwaStatus] = useState<'checking' | 'standalone' | 'installable' | 'installing' | 'installed' | 'unsupported_ios' | 'unsupported_other'>('checking');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // ── PWA install prompt — cattura al mount ──────────────────────────────────

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaStatus('standalone');
      return;
    }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

    // Leggi il prompt già catturato dallo script inline nel root layout
    const existing = (window as Window & { __deferredInstallPrompt?: BeforeInstallPromptEvent }).__deferredInstallPrompt;
    if (existing) {
      setDeferredPrompt(existing);
      setPwaStatus('installable');
      return;
    }

    if (isIos) { setPwaStatus('unsupported_ios'); return; }

    // Ascolta eventi futuri (es. primo caricamento in produzione)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaStatus('installable');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: se dopo 5s nessun prompt, l'ambiente non supporta l'installazione
    const timeout = setTimeout(() => {
      setPwaStatus((prev) => prev === 'checking' ? 'unsupported_other' : prev);
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, []);

  async function handlePwaInstall() {
    if (!deferredPrompt) return;
    setPwaStatus('installing');
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPwaStatus(outcome === 'accepted' ? 'installed' : 'installable');
  }

  // ── Username live check ─────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) { setUsernameState('idle'); setUsernameError(''); return; }
    setUsernameState('checking');
    debounceRef.current = setTimeout(async () => {
      const result = await checkUsername(username);
      if (result.error) { setUsernameState('invalid'); setUsernameError(result.error); }
      else if (result.available) { setUsernameState('available'); setUsernameError(''); }
      else { setUsernameState('taken'); setUsernameError('Username già in uso.'); }
    }, 400);
  }, [username]);

  const usernameIdle = username === '';
  const usernameRules = [
    { label: 'Da 3 a 30 caratteri', met: username.length >= 3 && username.length <= 30 },
    { label: 'Solo lettere, numeri, . e _', met: /^[a-zA-Z0-9._]+$/.test(username) },
    { label: 'Non inizia o finisce con . o _', met: username.length > 0 && !/^[._]/.test(username) && !/[._]$/.test(username) },
  ];

  const nicknameIdle = nickname === '';
  const nicknameRules = [
    { label: 'Almeno 1 carattere', met: nickname.trim().length >= 1 },
    { label: 'Massimo 30 caratteri', met: nickname.length <= 30 },
  ];

  const canProceedUsername = usernameState === 'available';
  const isUsernameError = usernameState === 'taken' || usernameState === 'invalid';

  // ── Step 2 submit ───────────────────────────────────────────────────────────

  function handleNicknameContinue() {
    setFormError('');
    const formData = new FormData();
    formData.set('username', username);
    formData.set('nickname', nickname);
    startNicknameTransition(async () => {
      const result = await saveUsernameNickname(formData);
      if ('error' in result) { setFormError(result.error); }
      else { setStep('avatar'); }
    });
  }

  // ── Step 3 — avatar ─────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  }

  const handleCropConfirm = useCallback(async (blob: Blob) => {
    setCropSrc(null);
    setIsUploadingAvatar(true);
    try {
      const urlResult = await getOnboardingAvatarUploadUrl();
      if (!urlResult.success) return;
      await fetch(urlResult.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      const saveResult = await saveOnboardingAvatarUrl(urlResult.key);
      if (saveResult.success) setAvatarPreviewUrl(saveResult.avatarUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  // ── Step 4 — privacy ────────────────────────────────────────────────────────

  function handlePrivacyChange(value: string) {
    const level = value as PrivacyLevel;
    setPrivacyLevel(level);
    startPrivacyTransition(async () => { await saveOnboardingPrivacyLevel(level); });
  }

  // ── Step 5 — GPS ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 'gps') return;
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') setGpsStatus('granted');
      else if (result.state === 'denied') setGpsStatus('denied');
    });
  }, [step]);

  function requestGps() {
    setGpsStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('granted'),
      () => setGpsStatus('denied'),
      { timeout: 10000 },
    );
  }

  // ── Progress indicator ──────────────────────────────────────────────────────

  const stepIndex = STEPS.indexOf(step);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-8 max-w-sm mx-auto w-full">

      {/* Progress dots */}
      <div
        className="w-full mb-10"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}
        aria-label={`Step ${stepIndex + 1} di ${STEPS.length}`}
      >
        {STEPS.map((s, i) => (
          <div key={s} className="relative flex items-center justify-center py-1">
            {i > 0 && (
              <div
                className="absolute h-0.5 top-1/2 -translate-y-1/2 bg-muted overflow-hidden"
                style={{ left: 'calc(-50% + 6px)', right: 'calc(50% + 6px)' }}
              >
                <div className={cn('h-full bg-primary transition-all duration-500 ease-in-out', stepIndex >= i ? 'w-full' : 'w-0')} />
              </div>
            )}
            <div className={cn(
              'relative z-10 w-2 h-2 rounded-full shrink-0 transition-colors duration-200',
              stepIndex >= i ? 'bg-primary' : 'bg-muted',
              stepIndex >= i && i > 0 ? 'delay-300' : 'delay-0',
            )} />
          </div>
        ))}
      </div>

      {/* ── Step 1: username ── */}
      {step === 'username' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Crea il tuo username</h1>
            <p className="text-sm text-muted-foreground">Il tuo nome unico su CatSee. Nessun altro può averlo.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none z-10">@</span>
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
                {usernameState === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {usernameState === 'available' && <CheckCircle className="w-4 h-4 text-success" />}
                {isUsernameError && <XCircle className="w-4 h-4 text-destructive" />}
              </div>
            </div>
            <p id="username-feedback" role="status" className={cn('text-xs min-h-4', usernameState === 'available' ? 'text-success' : 'text-destructive')}>
              {usernameState === 'available' && 'Disponibile!'}
              {isUsernameError && usernameError}
            </p>
          </div>

          <Alert>
            <Info />
            <AlertTitle>Requisiti username</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1.5 mt-1">
                {usernameRules.map((rule) => (
                  <ConstraintRow key={rule.label} met={rule.met} idle={usernameIdle}>{rule.label}</ConstraintRow>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">Modificabile ogni 30 giorni.</p>
            </AlertDescription>
          </Alert>

          <Button onClick={() => setStep('nickname')} disabled={!canProceedUsername} className="w-full mt-auto">
            Continua
          </Button>
        </div>
      )}

      {/* ── Step 2: nickname ── */}
      {step === 'nickname' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Come vuoi essere chiamato?</h1>
            <p className="text-sm text-muted-foreground">Il nome che gli altri vedono sul tuo profilo.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nickname" className="text-sm font-medium">Nickname</label>
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
            <AlertTitle>Requisiti nickname</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1.5 mt-1">
                {nicknameRules.map((rule) => (
                  <ConstraintRow key={rule.label} met={rule.met} idle={nicknameIdle}>{rule.label}</ConstraintRow>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">Può contenere spazi, emoji e caratteri speciali. Modificabile in qualsiasi momento.</p>
            </AlertDescription>
          </Alert>

          {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}

          <div className="flex flex-col gap-3 mt-auto">
            <Button
              onClick={handleNicknameContinue}
              disabled={nickname.trim().length === 0 || isPendingNickname}
              className="w-full"
            >
              {isPendingNickname ? <><Loader2 className="w-4 h-4 animate-spin" />Salvataggio…</> : 'Continua'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('username')} disabled={isPendingNickname} className="w-full">
              Indietro
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: avatar ── */}
      {step === 'avatar' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Aggiungi una foto profilo</h1>
            <p className="text-sm text-muted-foreground">Facoltativa — puoi aggiungerla o cambiarla in qualsiasi momento.</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative w-28 h-28 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Scegli foto profilo"
            >
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreviewUrl} alt="Anteprima avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </button>

            {avatarPreviewUrl && (
              <p className="text-sm text-success flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Foto aggiunta
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            {avatarPreviewUrl ? (
              <>
                <Button onClick={() => setStep('privacy')} className="w-full">Continua</Button>
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar} className="w-full">
                  Cambia foto
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar} className="w-full">
                  {isUploadingAvatar ? <><Loader2 className="w-4 h-4 animate-spin" />Caricamento…</> : 'Scegli foto'}
                </Button>
                <Button variant="ghost" onClick={() => setStep('privacy')} className="w-full">Salta</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: privacy ── */}
      {step === 'privacy' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Dove mostri i tuoi gatti?</h1>
            <p className="text-sm text-muted-foreground">Scegli quanto precisa vuoi che sia la posizione dei tuoi avvistamenti sulla mappa. Modificabile in qualsiasi momento.</p>
          </div>

          <RadioGroup value={privacyLevel} onValueChange={handlePrivacyChange} disabled={isSavingPrivacy}>
            <div className="divide-y divide-border overflow-hidden rounded-xl border">
              {PRIVACY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`privacy-${opt.value}`}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors',
                    privacyLevel === opt.value ? 'bg-accent/50' : 'bg-card hover:bg-muted/50',
                  )}
                >
                  <RadioGroupItem id={`privacy-${opt.value}`} value={opt.value} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium leading-tight">{opt.label}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>

          <Button onClick={() => setStep('gps')} className="w-full mt-auto">
            Continua
          </Button>
        </div>
      )}

      {/* ── Step 5: GPS primer ── */}
      {step === 'gps' && (
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Attiva la posizione</h1>
            <p className="text-sm text-muted-foreground">CatSee usa il GPS per posizionare i gatti sulla mappa. Senza posizione non puoi pubblicare avvistamenti.</p>
          </div>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
              gpsStatus === 'granted' ? 'bg-success/15' : gpsStatus === 'denied' ? 'bg-destructive/10' : 'bg-primary/10',
            )}>
              {gpsStatus === 'granted'
                ? <CheckCircle2 className="w-10 h-10 text-success" />
                : gpsStatus === 'denied'
                  ? <AlertCircle className="w-10 h-10 text-destructive" />
                  : <MapPin className="w-10 h-10 text-primary" />
              }
            </div>

            {gpsStatus === 'idle' && (
              <p className="text-sm text-center text-muted-foreground">
                Toccando il bottone qui sotto il browser ti chiederà il permesso. Puoi concederlo o negarlo — potrai cambiare idea in qualsiasi momento dalle impostazioni del telefono.
              </p>
            )}
            {gpsStatus === 'granted' && (
              <p className="text-sm text-center text-success font-medium">Posizione attivata!</p>
            )}
            {gpsStatus === 'denied' && (
              <p className="text-sm text-center text-muted-foreground">
                Nessun problema — potrai attivare la posizione in seguito dalle impostazioni del browser.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            {gpsStatus === 'idle' && (
              <>
                <Button onClick={requestGps} className="w-full">
                  <MapPin className="w-4 h-4" /> Attiva posizione
                </Button>
                <Button variant="ghost" onClick={() => setStep('pwa')} className="w-full">
                  Decidi dopo
                </Button>
              </>
            )}
            {gpsStatus === 'requesting' && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 animate-spin" /> In attesa…
              </Button>
            )}
            {(gpsStatus === 'granted' || gpsStatus === 'denied') && (
              <Button onClick={() => setStep('pwa')} className="w-full">
                Continua
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 6: PWA install ── */}
      {step === 'pwa' && (
        <div className="flex flex-col flex-1 gap-8">

          {/* Già installata */}
          {pwaStatus === 'standalone' && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">CatSee è già installata</h1>
                <p className="text-sm text-muted-foreground">Ottimo — stai già usando la versione app.</p>
              </div>
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </div>
              <Button onClick={() => router.push('/profilo')} className="w-full mt-auto">
                Inizia ad avvistare!
              </Button>
            </>
          )}

          {/* Installazione completata */}
          {pwaStatus === 'installed' && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Installazione completata!</h1>
                <p className="text-sm text-muted-foreground">Trovi CatSee sulla schermata Home del tuo dispositivo.</p>
              </div>
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </div>
              <Button onClick={() => router.push('/profilo')} className="w-full mt-auto">
                Inizia ad avvistare!
              </Button>
            </>
          )}

          {/* Installabile (Chrome/Android) o in attesa del prompt */}
          {(pwaStatus === 'installable' || pwaStatus === 'installing' || pwaStatus === 'checking') && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Installa CatSee</h1>
                <p className="text-sm text-muted-foreground">Aggiungi l'app alla schermata Home per la miglior esperienza.</p>
              </div>

              <div className="flex flex-col items-center gap-6 py-2">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
                <ul className="w-full space-y-3">
                  {[
                    { icon: '🏠', text: 'Accesso rapido dalla schermata Home' },
                    { icon: '🚀', text: 'Schermo intero, senza barre del browser' },
                    { icon: '📶', text: 'Più veloce e reattiva del sito web' },
                    { icon: '🔔', text: 'Notifiche native per nuovi gatti (prossimamente)' },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                      <span className="text-base w-6 text-center shrink-0">{icon}</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <Button
                  onClick={handlePwaInstall}
                  disabled={pwaStatus !== 'installable'}
                  className="w-full"
                >
                  {pwaStatus === 'installing'
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Installazione…</>
                    : pwaStatus === 'checking'
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Preparazione…</>
                      : <><Smartphone className="w-4 h-4" />Installa CatSee</>
                  }
                </Button>
                <Button variant="ghost" onClick={() => router.push('/profilo')} className="w-full">
                  Continua senza installare
                </Button>
              </div>
            </>
          )}

          {/* Non supportato / altri browser (Android non-Chrome, desktop, ecc.) */}
          {pwaStatus === 'unsupported_other' && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Installa CatSee</h1>
                <p className="text-sm text-muted-foreground">Puoi aggiungere CatSee alla schermata Home per un accesso rapido e un'esperienza a schermo intero.</p>
              </div>
              <div className="flex flex-col items-center gap-6 py-2">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Cerca l'icona di installazione nella barra degli indirizzi del browser, oppure usa il menu del browser e seleziona <span className="font-medium text-foreground">"Installa app"</span> o <span className="font-medium text-foreground">"Aggiungi alla schermata Home"</span>.
                </p>
              </div>
              <Button onClick={() => router.push('/profilo')} className="w-full mt-auto">
                Continua
              </Button>
            </>
          )}

          {/* Non supportato / iOS — istruzioni manuali Safari */}
          {pwaStatus === 'unsupported_ios' && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Aggiungi alla Home</h1>
                <p className="text-sm text-muted-foreground">Il tuo browser non supporta l'installazione automatica, ma puoi aggiungerla manualmente in pochi secondi.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {[
                    { step: '1', text: 'Apri Safari (se non sei già qui)' },
                    { step: '2', icon: <Share className="w-4 h-4 text-primary shrink-0" />, text: 'Tocca l\'icona condividi nella barra in basso' },
                    { step: '3', text: 'Scorri e seleziona "Aggiungi alla schermata Home"' },
                    { step: '4', text: 'Tocca "Aggiungi" in alto a destra' },
                  ].map(({ step: s, icon, text }) => (
                    <div key={s} className="flex items-center gap-3 px-4 py-3 bg-card">
                      {icon ?? (
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{s}</span>
                      )}
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <Button onClick={() => router.push('/profilo')} className="w-full">
                  Ho capito, vai avanti
                </Button>
              </div>
            </>
          )}

        </div>
      )}

      {/* Crop modal (portal-like, rendered on top) */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
