"use client";

import { useState, useRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { approveSighting, rejectSighting } from "../actions";
import ImageLightbox from "@/components/image-lightbox";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

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
  gray: "bg-gray-400",
  white: "bg-gray-100 border border-gray-300",
  cream: "bg-amber-100",
  orange: "bg-orange-400",
  cinnamon: "bg-amber-600",
  brown: "bg-amber-800",
  siamese: "bg-yellow-200 border border-yellow-400",
  tabby: "bg-amber-500",
  other: "bg-muted border border-dashed border-muted-foreground/40",
};

export interface PendingCardProps {
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
  expanded: boolean;
  onToggleExpand: () => void;
}

export default function PendingCard(props: PendingCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button, a')) return;
    cardRef.current?.classList.add('bg-muted');
  }
  function handlePointerUp() { cardRef.current?.classList.remove('bg-muted'); }

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
    // Tap sulla card (fuori da elementi interattivi) espande/collassa la nota
    <div
      ref={cardRef}
      className="p-4 space-y-3 transition-colors cursor-pointer select-none"
      onClick={() => props.note && props.onToggleExpand()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex gap-3">
        {/* Thumbnail - tappabile per ingrandire */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
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
              <Link
                href={`/profilo/${props.authorUsername}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground shrink-0 hover:underline"
              >
                @{props.authorUsername}
              </Link>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          </div>

          {/* Nota - espandibile */}
          {props.note && (
            <div
              className={cn(
                "overflow-hidden transition-[max-height] duration-300 ease-in-out mt-1",
                props.expanded ? "max-h-40" : "max-h-8"
              )}
            >
              <p className="text-xs text-muted-foreground leading-4">{props.note}</p>
            </div>
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
      <ButtonGroup className="w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 bg-success/10 text-success hover:text-success hover:bg-success/20 border-success/30"
          onClick={handleApprove}
          disabled={loading !== null}
        >
          <CheckCircle className="w-4 h-4" strokeWidth={2} />
          {loading === 'approve' ? 'Approvazione…' : 'Approva'}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="flex-1"
          onClick={handleReject}
          disabled={loading !== null}
        >
          <XCircle className="w-4 h-4" strokeWidth={2} />
          {loading === 'reject' ? 'Rifiuto…' : 'Rifiuta'}
        </Button>
      </ButtonGroup>

      <ImageLightbox
        src={props.thumbnailUrl}
        alt={props.catNickname}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
