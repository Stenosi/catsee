'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { saveProfile } from '../actions';

const schema = z.object({
  nickname: z
    .string()
    .min(1, 'Il nickname è obbligatorio')
    .max(30, 'Massimo 30 caratteri'),
  bio: z
    .string()
    .max(150, 'Massimo 150 caratteri')
    .refine((v) => v.split('\n').length <= 4, 'Massimo 4 righe')
    .optional(),
  username: z
    .string()
    .min(3, 'Minimo 3 caratteri')
    .max(30, 'Massimo 30 caratteri')
    .regex(/^[a-zA-Z0-9._]+$/, 'Solo lettere, numeri, punto e underscore')
    .regex(/^[^._].*[^._]$|^[^._]{1}$/, 'Non può iniziare o finire con . o _'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  nickname: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  usernameLockedDays: number;
}

export default function ModificaClient({
  nickname,
  username,
  bio,
  avatarUrl,
  usernameLockedDays,
}: Props) {
  const [avatarStatus, setAvatarStatus] = useState<'loading' | 'loaded' | 'error' | 'idle'>(
    avatarUrl ? 'loading' : 'idle',
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isUsernameLocked = usernameLockedDays > 0;

  const avatarFallback = (
    nickname.trim().split(/\s+/).length >= 2
      ? nickname.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('')
      : nickname.slice(0, 2)
  ).toUpperCase();

  const {
    register,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname,
      username,
      bio: bio ?? '',
    },
  });

  const bioValue = watch('bio') ?? '';
  const bioLines = bioValue.split('\n').length;

  function handleSave() {
    const values = {
      nickname: watch('nickname'),
      bio: watch('bio') ?? '',
      username: watch('username'),
    };

    startTransition(async () => {
      const result = await saveProfile(values);

      if (!result.success) {
        if (result.field) {
          setError(result.field, { message: result.error });
        } else {
          toast.error(result.error);
        }
        return;
      }

      // Aggiorna i defaultValues così isDirty torna false
      toast.success('Profilo aggiornato!');
      router.push('/profilo');
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-6 px-4 py-6">

        {/* Avatar */}
        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Cambia foto profilo"
            className="relative group"
          >
            <div className="relative">
              <Avatar size="2xl" className="overflow-hidden">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt="Foto profilo"
                    onLoadingStatusChange={(s) => setAvatarStatus(s)}
                    className={cn(
                      'transition-opacity duration-300',
                      avatarStatus === 'loaded' ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              {avatarStatus === 'loading' && (
                <Skeleton className="absolute inset-0 rounded-full" />
              )}
            </div>

            {/* Overlay fotocamera */}
            <div className={cn(
              'absolute bottom-0 right-0',
              'flex items-center justify-center w-7 h-7 rounded-full',
              'bg-primary text-primary-foreground border-2 border-background',
              'transition-transform group-active:scale-95',
            )}>
              <Camera className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
          </button>
        </div>

        {/* Campi form */}
        <div className="flex flex-col gap-5">

          {/* Nickname */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nickname" className="text-sm font-medium text-foreground">
              Nickname
            </label>
            <Input
              id="nickname"
              type="text"
              autoComplete="nickname"
              placeholder="Mario Rossi 🐱"
              maxLength={30}
              aria-invalid={!!errors.nickname}
              {...register('nickname')}
            />
            <div className="flex justify-between items-start min-h-4">
              {errors.nickname ? (
                <p className="text-xs text-destructive">{errors.nickname.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground shrink-0">
                {watch('nickname').length}/30
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">
              Bio
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opzionale)</span>
            </label>
            <textarea
              id="bio"
              rows={3}
              maxLength={150}
              placeholder="Racconta qualcosa di te..."
              aria-invalid={!!errors.bio}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bioLines >= 4) e.preventDefault();
              }}
              className={cn(
                'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm',
                'transition-colors outline-none resize-none',
                'placeholder:text-muted-foreground/50',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
              )}
              {...register('bio')}
            />
            <div className="flex justify-between items-start min-h-4">
              {errors.bio ? (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground shrink-0">
                {bioLines}/4 righe · {bioValue.length}/150
              </p>
            </div>
          </div>

          {/* Username */}
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
                disabled={isUsernameLocked}
                aria-invalid={!!errors.username}
                className="pl-7 pr-9"
                {...register('username')}
              />
              {isUsernameLocked && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-xs text-destructive min-h-4">{errors.username.message}</p>
            )}
            {isUsernameLocked && (
              <Alert className="mt-1">
                <Lock />
                <AlertDescription>
                  Potrai cambiare username tra{' '}
                  <span className="font-medium text-foreground">
                    {usernameLockedDays} {usernameLockedDays === 1 ? 'giorno' : 'giorni'}
                  </span>
                  .
                </AlertDescription>
              </Alert>
            )}
          </div>

        </div>
      </div>

      {/* Salva — fixed in fondo */}
      <div className="mt-auto px-4 py-4 border-t border-border">
        <Button
          type="button"
          className="w-full"
          disabled={!isDirty || isPending}
          onClick={handleSave}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Salvataggio…
            </>
          ) : (
            'Salva modifiche'
          )}
        </Button>
      </div>
    </div>
  );
}
