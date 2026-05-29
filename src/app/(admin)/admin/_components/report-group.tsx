"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissReports, removeReportedPost, banUser } from "../actions";

const REASON_LABELS: Record<string, string> = {
  not_a_cat: "Non è un gatto",
  inappropriate: "Contenuto inappropriato",
  spam: "Spam",
  offensive_text: "Testo offensivo",
  other: "Altro",
};

interface ReportGroupProps {
  sightingId: string;
  userId: string;
  thumbnailUrl: string;
  catNickname: string;
  note: string | null;
  authorNickname: string;
  authorUsername: string;
  reportCount: number;
  reasons: string[];
  reporters: string[];
}

export default function ReportGroup(props: ReportGroupProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handle(action: () => Promise<void>, label: string) {
    setLoading(label);
    try {
      await action();
      setDismissed(true);
    } catch {
      toast.error('Errore durante l\'azione');
      setLoading(null);
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-muted">
          <img
            src={props.thumbnailUrl}
            alt={props.catNickname}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{props.catNickname}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">@{props.authorUsername}</span>
          </div>

          {/* Conteggio segnalazioni */}
          <div className="flex items-center gap-1 mt-1">
            <Flag className="w-3 h-3 text-destructive" strokeWidth={2} />
            <span className="text-xs font-medium text-destructive">{props.reportCount} segnalazioni</span>
          </div>

          {/* Motivi */}
          {props.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {props.reasons.map((r) => (
                <span key={r} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {REASON_LABELS[r] ?? r}
                </span>
              ))}
            </div>
          )}

          {/* Reporter */}
          {props.reporters.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              da: {props.reporters.slice(0, 3).map((u) => `@${u}`).join(', ')}
              {props.reporters.length > 3 && ` +${props.reporters.length - 3}`}
            </p>
          )}

          {/* Nota del post */}
          {props.note && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">&ldquo;{props.note}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Azioni */}
      <div className="flex gap-2">
        <button
          onClick={() => handle(() => dismissReports(props.sightingId), 'dismiss')}
          disabled={loading !== null}
          className={cn(
            "flex-1 h-9 rounded-full text-xs font-medium transition-colors",
            loading !== null
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {loading === 'dismiss' ? 'Attendere…' : 'Respingi'}
        </button>
        <button
          onClick={() => handle(() => removeReportedPost(props.sightingId), 'remove')}
          disabled={loading !== null}
          className={cn(
            "flex-1 h-9 rounded-full text-xs font-medium transition-colors",
            loading !== null
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-warning/10 text-warning hover:bg-warning/20"
          )}
        >
          {loading === 'remove' ? 'Rimozione…' : 'Rimuovi post'}
        </button>
        <button
          onClick={() => handle(() => banUser(props.userId), 'ban')}
          disabled={loading !== null}
          className={cn(
            "flex-1 h-9 rounded-full text-xs font-medium transition-colors",
            loading !== null
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          )}
        >
          {loading === 'ban' ? 'Ban…' : 'Banna'}
        </button>
      </div>
    </div>
  );
}
