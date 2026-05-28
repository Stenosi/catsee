'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, CheckCircle, XCircle, Info, Check, X, Minus,
  Camera, MapPin, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { checkUsername, saveUsernameNickname } from './actions';
import { getAvatarUploadUrl, saveAvatarUrl } from '@/app/(app)/profilo/modifica/actions';
import { savePrivacyLevel, type PrivacyLevel } from '@/app/(app)/impostazioni/actions';
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

const STEPS = ['username', 'nickname', 'avatar', 'privacy', 'gps'] as const;
type Step = typeof STEPS[number];

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
      const urlResult = await getAvatarUploadUrl();
      if (!urlResult.success) return;
      await fetch(urlResult.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      const saveResult = await saveAvatarUrl(urlResult.key);
      if (saveResult.success) setAvatarPreviewUrl(saveResult.avatarUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  // ── Step 4 — privacy ────────────────────────────────────────────────────────

  function handlePrivacyChange(value: string) {
    const level = value as PrivacyLevel;
    setPrivacyLevel(level);
    startPrivacyTransition(async () => { await savePrivacyLevel(level); });
  }

  // ── Step 5 — GPS ────────────────────────────────────────────────────────────

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
      <div className="flex items-center mb-10" aria-label={`Step ${stepIndex + 1} di ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-colors duration-200',
              stepIndex >= i ? 'bg-primary' : 'bg-muted',
              i > 0 && stepIndex === i ? 'delay-300' : 'delay-0',
            )} />
            {i < STEPS.length - 1 && (
              <div className="relative w-8 h-0.5 bg-muted mx-1">
                <div className={cn(
                  'absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-in-out',
                  stepIndex > i ? 'w-full' : 'w-0',
                )} />
              </div>
            )}
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

          <div className="flex gap-3 mt-auto">
            <Button type="button" variant="secondary" onClick={() => setStep('username')} disabled={isPendingNickname} className="flex-1">
              Indietro
            </Button>
            <Button
              onClick={handleNicknameContinue}
              disabled={nickname.trim().length === 0 || isPendingNickname}
              className="flex-1"
            >
              {isPendingNickname ? <><Loader2 className="w-4 h-4 animate-spin" />Salvataggio…</> : 'Continua'}
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

          <div className="flex gap-3 mt-auto">
            <Button variant="secondary" onClick={() => setStep('privacy')} className="flex-1">
              {avatarPreviewUrl ? 'Continua' : 'Salta'}
            </Button>
            {!avatarPreviewUrl && (
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar} className="flex-1">
                Scegli foto
              </Button>
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
              <Button onClick={requestGps}>
                <MapPin className="w-4 h-4" /> Attiva posizione
              </Button>
            )}
            {gpsStatus === 'requesting' && (
              <Button disabled>
                <Loader2 className="w-4 h-4 animate-spin" /> In attesa…
              </Button>
            )}
            {(gpsStatus === 'granted' || gpsStatus === 'denied') && (
              <Button onClick={() => router.push('/mappa')}>
                {gpsStatus === 'granted' ? 'Inizia ad avvistare!' : 'Vai alla mappa'}
              </Button>
            )}
            {gpsStatus === 'idle' && (
              <Button variant="ghost" onClick={() => router.push('/mappa')}>
                Decidi dopo
              </Button>
            )}
          </div>
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
