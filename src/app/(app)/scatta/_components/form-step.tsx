'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import ImageLightbox from '@/components/image-lightbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, MapPin, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { CapturedCoords } from './scatta-wizard';

const PositionMap = dynamic(() => import('./position-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-muted animate-pulse" />,
});

const CAT_COLORS = [
  { id: 'black', label: 'Nero', dot: '#1c1c1e' },
  { id: 'white', label: 'Bianco', dot: '#e5e5ea' },
  { id: 'gray', label: 'Grigio', dot: '#8e8e93' },
  { id: 'orange', label: 'Rosso / Arancione', dot: '#ff9500' },
  { id: 'tabby', label: 'Tigrato', dot: '#a16207' },
  { id: 'calico', label: 'Calico', dot: '#e879f9' },
  { id: 'tuxedo', label: 'Smoking', dot: '#374151' },
  { id: 'siamese', label: 'Siamese', dot: '#d4b483' },
  { id: 'other', label: 'Altro', dot: '#6b7280' },
] as const;

const schema = z.object({
  catName: z.string().min(1, 'Il nome è obbligatorio').max(30, 'Massimo 30 caratteri'),
  colors: z.array(z.string()).min(1, 'Seleziona almeno un colore').max(3, 'Massimo 3 colori'),
  furLength: z.enum(['short', 'long'], { error: 'Seleziona la lunghezza del pelo' }),
  notes: z.string().max(200, 'Massimo 200 caratteri').optional(),
});

export type PostFormData = z.infer<typeof schema> & {
  pinLat: number;
  pinLng: number;
};

interface Props {
  imageUrl: string;
  coords: CapturedCoords | null;
  geoError: string | null;
  onBack: () => void;
  onPublish: (data: PostFormData) => void;
  publishing?: boolean;
}

export default function FormStep({ imageUrl, coords, geoError, onBack, onPublish, publishing = false }: Props) {
  const FALLBACK_LAT = 41.9028;
  const FALLBACK_LNG = 12.4964;

  const [pinLat, setPinLat] = useState<number>(() => coords?.lat ?? FALLBACK_LAT);
  const [pinLng, setPinLng] = useState<number>(() => coords?.lng ?? FALLBACK_LNG);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Sync pin with GPS when coords arrive after mount
  if (coords && pinLat === FALLBACK_LAT && pinLng === FALLBACK_LNG) {
    setPinLat(coords.lat);
    setPinLng(coords.lng);
  }

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { catName: '', colors: [], notes: '' },
  });

  const selectedColors = watch('colors');
  const furLength = watch('furLength');
  const catNameValue = watch('catName');
  const notesValue = watch('notes') ?? '';

  const { ref: registerNotesRef, ...notesRegister } = register('notes');
  const notesCallbackRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      registerNotesRef(el);
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.style.overflowY = el.scrollHeight > el.clientHeight ? 'auto' : 'hidden';
    },
    [registerNotesRef],
  );

  function toggleColor(id: string) {
    if (selectedColors.includes(id)) {
      setValue('colors', selectedColors.filter((c) => c !== id), { shouldValidate: true });
    } else if (selectedColors.length < 3) {
      setValue('colors', [...selectedColors, id], { shouldValidate: true });
    }
  }

  function onSubmit(data: z.infer<typeof schema>) {
    onPublish({ ...data, pinLat, pinLng });
  }

  return (
    <>
      <ImageLightbox src={imageUrl} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      <div className="bg-background h-full flex flex-col">

        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b border-border">
          <button onClick={onBack} aria-label="Torna alla preview" className="shrink-0">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            onClick={() => setLightboxOpen(true)}
            className="w-10 h-10 rounded-lg object-cover shrink-0 cursor-pointer active:opacity-80"
          />
          <span className="text-sm font-semibold text-foreground">Nuovo avvistamento</span>
        </div>

        {/* Corpo scorrevole */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto flex flex-col gap-5 px-4 py-5"
        >

          {/* Nome gatto */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="catName" className="text-sm font-medium text-foreground">
              Nome del gatto
            </label>
            <Input
              id="catName"
              placeholder="Es. Re Magio, Pallino…"
              maxLength={30}
              aria-invalid={!!errors.catName}
              {...register('catName')}
            />
            <div className="flex justify-between items-start min-h-4">
              {errors.catName ? (
                <p className="text-xs text-destructive">{errors.catName.message}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground shrink-0">{catNameValue.length}/30</p>
            </div>
          </div>

          {/* Colori */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Colore
              <span className="ml-1 text-xs font-normal text-muted-foreground">max 3</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CAT_COLORS.map(({ id, label, dot }) => {
                const selected = selectedColors.includes(id);
                const disabled = !selected && selectedColors.length >= 3;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleColor(id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                      'border transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground',
                      disabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                      style={{ background: dot }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.colors && (
              <p className="text-xs text-destructive">{errors.colors.message}</p>
            )}
          </div>

          {/* Lunghezza pelo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Lunghezza pelo</label>
            <ToggleGroup
              spacing={0}
              variant="outline"
              value={furLength ? [furLength] : []}
              onValueChange={(val) => {
                const v = val[val.length - 1] as 'short' | 'long' | undefined;
                if (v) setValue('furLength', v, { shouldValidate: true });
              }}
              className="w-full"
            >
              <ToggleGroupItem value="short" className="flex-1">Corto</ToggleGroupItem>
              <ToggleGroupItem value="long" className="flex-1">Lungo</ToggleGroupItem>
            </ToggleGroup>
            {errors.furLength && (
              <p className="text-xs text-destructive">{errors.furLength.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Note
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opzionale)</span>
            </label>
            <textarea
              id="notes"
              rows={1}
              maxLength={200}
              placeholder="Qualcosa di speciale su questo gatto…"
              aria-invalid={!!errors.notes}
              ref={notesCallbackRef}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
                el.style.overflowY = el.scrollHeight > el.clientHeight ? 'auto' : 'hidden';
              }}
              style={{ maxHeight: '7.5rem', overflowY: 'hidden' }}
              className={cn(
                'w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm',
                'outline-none resize-none transition-colors',
                'placeholder:text-muted-foreground/50',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'aria-invalid:border-destructive',
              )}
              {...notesRegister}
            />
            <div className="flex justify-between items-start min-h-4">
              {errors.notes ? (
                <p className="text-xs text-destructive">{errors.notes.message}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground shrink-0">{notesValue.length}/200</p>
            </div>
          </div>

          {/* Posizione */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Posizione
            </label>

            {!coords && !geoError ? (
              <div className="h-48 rounded-xl bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Ricerca posizione GPS…</span>
              </div>
            ) : (
              <>
                {geoError && (
                  <Alert variant="destructive" className="py-2">
                    <TriangleAlert />
                    <AlertDescription className="text-xs">{geoError}</AlertDescription>
                  </Alert>
                )}
                <div className="h-48 rounded-xl overflow-hidden border border-border">
                  <PositionMap
                    originLat={coords?.lat ?? FALLBACK_LAT}
                    originLng={coords?.lng ?? FALLBACK_LNG}
                    pinLat={pinLat}
                    pinLng={pinLng}
                    restrictToOrigin={!!coords}
                    onChange={(lat, lng) => { setPinLat(lat); setPinLng(lng); }}
                  />
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground">
              {coords
                ? 'Trascina il pin per aggiustare la posizione (max 50m).'
                : 'Trascina il pin per impostare la posizione manualmente.'}
            </p>
          </div>

          {/* Spazio extra sotto il bottone fisso */}
          <div className="h-4" />
        </form>

        {/* Bottone pubblica fisso in fondo */}
        <div className="shrink-0 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] border-t border-border">
          <Button
            type="submit"
            form="post-form"
            className="w-full"
            disabled={isSubmitting || publishing || (!coords && !geoError)}
            onClick={handleSubmit(onSubmit)}
          >
            {(isSubmitting || publishing) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pubblicazione…
              </>
            ) : (
              'Pubblica'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
