"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createReport } from "@/app/(app)/segnala/actions";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'post' | 'user';
  targetId: string;
}

const POST_REASONS = [
  { value: 'not_a_cat', label: 'Non è un gatto' },
  { value: 'inappropriate', label: 'Contenuto inappropriato' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive_text', label: 'Testo offensivo' },
  { value: 'other', label: 'Altro' },
] as const;

const USER_REASONS = [
  { value: 'inappropriate', label: 'Contenuto inappropriato' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive_text', label: 'Testo offensivo' },
  { value: 'other', label: 'Altro' },
] as const;

export default function ReportModal({ open, onClose, type, targetId }: ReportModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reasons = type === 'post' ? POST_REASONS : USER_REASONS;
  const title = type === 'post' ? 'Segnala avvistamento' : 'Segnala utente';

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await createReport(type, targetId, [selected]);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Segnalazione inviata');
        onClose();
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelected(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-card rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-5 pb-2 pt-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>

        <div className="px-4 py-2 space-y-1">
          {reasons.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => setSelected(reason.value)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-colors",
                selected === reason.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors",
                  selected === reason.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                )}
              />
              {reason.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 px-5 pt-4 pb-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 rounded-full border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || loading}
            className={cn(
              "flex-1 h-11 rounded-full text-sm font-semibold transition-colors",
              selected && !loading
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading ? 'Invio…' : 'Segnala'}
          </button>
        </div>
      </div>
    </div>
  );
}
