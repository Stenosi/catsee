"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { approveSighting, rejectSighting } from "../actions";
import ImageLightbox from "@/components/image-lightbox";

const rtf = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

function relativeTime(date: Date): string {
  const diff = (date.getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

const COLOR_DOTS: Record<string, string> = {
  black: "bg-gray-900",
  white: "bg-gray-100 border border-gray-300",
  gray: "bg-gray-400",
  orange: "bg-orange-400",
  brown: "bg-amber-800",
  tabby: "bg-amber-500",
  other: "bg-muted border border-dashed border-muted-foreground/40",
};

interface PendingCardProps {
  id: string;
  thumbnailUrl: string;
  catNickname: string;
  note: string | null;
  tagColors: string[];
  tagFur: string | null;
  aiVerified: boolean;
  createdAt: Date | null;
  authorNickname: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
}

export default function PendingCard(props: PendingCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (dismissed) return null;

  async function handleApprove() {
    setLoading('approve');
    try {
      await approveSighting(props.id);
      toast.success('Post approvato');
      setDismissed(true);
    } catch {
      toast.error("Errore durante l'approvazione");
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading('reject');
    try {
      await rejectSighting(props.id);
      toast.success('Post rifiutato');
      setDismissed(true);
    } catch {
      toast.error('Errore durante il rifiuto');
      setLoading(null);
    }
  }

  const timeAgo = props.createdAt ? relativeTime(props.createdAt) : '';

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        {/* Thumbnail — tappabile per ingrandire */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-muted active:opacity-80 transition-opacity"
          aria-label="Ingrandisci immagine"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.thumbnailUrl}
            alt={props.catNickname}
            className="w-full h-full object-cover"
          />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Titolo + data sulla stessa riga */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{props.catNickname}</span>
              <span className="text-xs text-muted-foreground shrink-0">·</span>
              <span className="text-xs text-muted-foreground shrink-0">@{props.authorUsername}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          </div>

          {/* Nota */}
          {props.note && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{props.note}</p>
          )}

          {/* Colori */}
          {props.tagColors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {props.tagColors.map((c) => (
                <span key={c} className={cn("w-3 h-3 rounded-full", COLOR_DOTS[c] ?? "bg-muted")} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Azioni */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full text-sm font-medium transition-colors",
            loading !== null
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-success/10 text-success hover:bg-success/20"
          )}
        >
          <CheckCircle className="w-4 h-4" strokeWidth={2} />
          {loading === 'approve' ? 'Approvazione…' : 'Approva'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full text-sm font-medium transition-colors",
            loading !== null
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          )}
        >
          <XCircle className="w-4 h-4" strokeWidth={2} />
          {loading === 'reject' ? 'Rifiuto…' : 'Rifiuta'}
        </button>
      </div>

      <ImageLightbox
        src={props.thumbnailUrl}
        alt={props.catNickname}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
