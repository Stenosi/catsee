"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dismissReports, removeReportedPost, banUser } from "../actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import ImageLightbox from "@/components/image-lightbox";

const REASON_LABELS: Record<string, string> = {
  not_a_cat: "Non è un gatto",
  inappropriate: "Contenuto inappropriato",
  spam: "Spam",
  offensive_text: "Testo offensivo",
  other: "Altro",
};

export interface ReportGroupProps {
  sightingId: string;
  userId: string;
  thumbnailUrl: string;
  catNickname: string;
  note: string | null;
  authorNickname: string;
  authorUsername: string;
  reportCount: number;
  reasons: { value: string; count: number }[];
  reporters: string[];
  expanded: boolean;
  onToggleExpand: () => void;
}

export default function ReportGroup(props: ReportGroupProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button, a')) return;
    cardRef.current?.classList.add('bg-muted');
  }
  function handlePointerUp() { cardRef.current?.classList.remove('bg-muted'); }

  if (dismissed) return null;

  async function handle(action: () => Promise<void>, label: string) {
    setLoading(label);
    try {
      await action();
      setDismissed(true);
    } catch {
      toast.error("Errore durante l'azione");
      setLoading(null);
    }
  }

  return (
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
          {/* Titolo + badge segnalazioni */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/post/${props.sightingId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-foreground truncate hover:underline"
              >
                {props.catNickname}
              </Link>
              <span className="text-xs text-muted-foreground shrink-0">·</span>
              <Link
                href={`/profilo/${props.authorUsername}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground shrink-0 hover:underline"
              >
                @{props.authorUsername}
              </Link>
            </div>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold shrink-0">
              {props.reportCount}
              <Flag className="w-3 h-3" strokeWidth={2} />
            </span>
          </div>

          {/* Nota - espandibile */}
          {props.note && (
            <div
              className={cn(
                "overflow-hidden transition-[max-height] duration-300 ease-in-out mt-1",
                props.expanded ? "max-h-40" : "max-h-4"
              )}
            >
              <p className="text-xs text-muted-foreground leading-4">{props.note}</p>
            </div>
          )}

          {/* Tipi di segnalazione con counter */}
          {props.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {props.reasons.map((r) => (
                <Badge key={r.value} variant="outline" className="gap-1">
                  <span className="font-bold text-destructive">{r.count}</span>
                  {REASON_LABELS[r.value] ?? r.value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Azioni */}
      <ButtonGroup className="w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Button
          variant="outline"
          className="flex-1 bg-success/10 text-success hover:text-success hover:bg-success/20 border-success/30"
          disabled={loading !== null}
          onClick={() => handle(() => dismissReports(props.sightingId), 'dismiss')}
        >
          {loading === 'dismiss' ? 'Attendere…' : 'Respingi'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-primary/10 text-primary hover:text-primary hover:bg-primary/20 border-primary/30"
          disabled={loading !== null}
          onClick={() => handle(() => removeReportedPost(props.sightingId), 'remove')}
        >
          {loading === 'remove' ? 'Rimozione…' : 'Rimuovi post'}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={loading !== null}
          onClick={() => handle(() => banUser(props.userId), 'ban')}
        >
          {loading === 'ban' ? 'Ban…' : 'Banna'}
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
