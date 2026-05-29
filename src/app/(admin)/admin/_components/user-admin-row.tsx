"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { unbanUser, adjustBanDuration } from "../actions";

interface UserAdminRowProps {
  userId: string;
  nickname: string;
  username: string;
  avatarUrl: string | null;
  bannedAt: Date | null;
  bannedReason: string | null;
  bannedUntil: Date | null;
}

function daysRemaining(bannedUntil: Date | null): number | null {
  if (!bannedUntil) return null;
  return Math.max(0, Math.ceil((bannedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

const MAX_BAN_DAYS = 30;

export default function UserAdminRow(props: UserAdminRowProps) {
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [bannedUntil, setBannedUntil] = useState<Date | null>(props.bannedUntil);

  if (revoked) return null;

  const days = daysRemaining(bannedUntil);

  async function handleUnban() {
    setLoading(true);
    try {
      await unbanUser(props.userId);
      toast.success(`Ban revocato per @${props.username}`);
      setRevoked(true);
    } catch {
      toast.error('Errore durante la revoca del ban');
      setLoading(false);
    }
  }

  async function handleAdjust(delta: number) {
    if (adjusting || !bannedUntil) return;
    setAdjusting(true);

    // Ottimistico
    const newDate = new Date(bannedUntil.getTime() + delta * 24 * 60 * 60 * 1000);
    setBannedUntil(newDate);

    try {
      await adjustBanDuration(props.userId, delta);
    } catch {
      setBannedUntil(bannedUntil);
      toast.error('Errore durante la modifica del ban');
    } finally {
      setAdjusting(false);
    }
  }

  const bannedDate = props.bannedAt
    ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(props.bannedAt)
    : null;

  const initials = props.nickname
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || props.username.slice(0, 2).toUpperCase();

  const canDecrement = days !== null && days > 1;
  const canIncrement = days !== null && days < MAX_BAN_DAYS;

  return (
    <div className="flex items-center gap-3 p-4">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-primary/20 flex items-center justify-center">
        {props.avatarUrl ? (
          <img src={props.avatarUrl} alt={props.nickname} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-primary">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div>
          <p className="text-sm font-semibold text-foreground truncate">{props.nickname}</p>
          <p className="text-xs text-muted-foreground">@{props.username}</p>
        </div>

        {bannedDate && (
          <p className="text-xs text-muted-foreground mt-0.5">Bannato il {bannedDate}</p>
        )}
        {props.bannedReason && (
          <p className="text-xs text-muted-foreground italic truncate">&ldquo;{props.bannedReason}&rdquo;</p>
        )}
      </div>

      {/* Azioni */}
      <div className="shrink-0 flex flex-col items-end gap-2">
        <button
          onClick={handleUnban}
          disabled={loading}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-medium transition-colors",
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-success/10 text-success hover:bg-success/20"
          )}
        >
          {loading ? 'Attendere…' : 'Revoca ban'}
        </button>

        {days !== null && (
          <div className="flex items-center rounded-full border border-border overflow-hidden">
            <button
              onClick={() => handleAdjust(-1)}
              disabled={adjusting || !canDecrement}
              className={cn(
                "w-7 h-7 flex items-center justify-center text-sm transition-colors",
                canDecrement && !adjusting
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Riduci ban di 1 giorno"
            >
              −
            </button>
            <span className="px-2 text-xs font-medium text-foreground tabular-nums whitespace-nowrap">
              {days === 1 ? '1 giorno' : `${days} giorni`}
            </span>
            <button
              onClick={() => handleAdjust(+1)}
              disabled={adjusting || !canIncrement}
              className={cn(
                "w-7 h-7 flex items-center justify-center text-sm transition-colors",
                canIncrement && !adjusting
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Estendi ban di 1 giorno"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
