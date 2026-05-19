'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginWithEmail } from '../actions';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export default function VerifyPage() {
  const [emailHint, setEmailHint] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/auth_email_hint=([^;]+)/);
    if (match) setEmailHint(decodeURIComponent(match[1]));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleResend() {
    if (!emailHint || cooldown > 0) return;
    setResending(true);
    const formData = new FormData();
    formData.set('email', emailHint);
    await loginWithEmail(formData).catch(() => null);
    setCooldown(30);
    setResending(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12 gap-8 max-w-sm mx-auto w-full text-center">

      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
        <Mail className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Controlla la tua email</h1>
        <div className="flex flex-col gap-1.5">
          {emailHint ? (
            <p className="text-sm text-muted-foreground">
              Abbiamo inviato un link a{' '}
              <span className="font-medium text-foreground">{maskEmail(emailHint)}</span>.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Abbiamo inviato un link di accesso alla tua email.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Apri il link dallo stesso dispositivo per accedere.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Button
          variant="secondary"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !emailHint}
          className="w-full"
        >
          {cooldown > 0 ? `Reinvia tra ${cooldown}s` : 'Reinvia link'}
        </Button>

        <Link
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Cambia email
        </Link>
      </div>

    </div>
  );
}