"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { unbanUser } from "../actions";

interface UserAdminRowProps {
  userId: string;
  nickname: string;
  username: string;
  avatarUrl: string | null;
  bannedAt: Date | null;
  bannedReason: string | null;
}

export default function UserAdminRow(props: UserAdminRowProps) {
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);

  if (revoked) return null;

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

  const bannedDate = props.bannedAt
    ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(props.bannedAt)
    : null;

  const initials = props.nickname
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || props.username.slice(0, 2).toUpperCase();

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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{props.nickname}</p>
        <p className="text-xs text-muted-foreground">@{props.username}</p>
        {bannedDate && (
          <p className="text-xs text-muted-foreground mt-0.5">Bannato il {bannedDate}</p>
        )}
        {props.bannedReason && (
          <p className="text-xs text-muted-foreground italic truncate">&ldquo;{props.bannedReason}&rdquo;</p>
        )}
      </div>

      {/* Azione */}
      <button
        onClick={handleUnban}
        disabled={loading}
        className={cn(
          "shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-colors",
          loading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-success/10 text-success hover:bg-success/20"
        )}
      >
        {loading ? 'Attendere…' : 'Revoca ban'}
      </button>
    </div>
  );
}
