"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createReport } from "@/app/(app)/segnala/actions";

const CLOSE_THRESHOLD = 80;
const DRAG_INTENT_THRESHOLD = 6;

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
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setSelected(null), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  function onPointerDown(e: React.PointerEvent) {
    startYRef.current = e.clientY;
    draggingRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startYRef.current === null) return;
    const deltaY = e.clientY - startYRef.current;
    if (!draggingRef.current) {
      if (deltaY < DRAG_INTENT_THRESHOLD) return;
      draggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDragY(Math.max(0, deltaY));
  }

  function onPointerUp() {
    if (draggingRef.current && dragY >= CLOSE_THRESHOLD) onClose();
    draggingRef.current = false;
    setDragY(0);
    startYRef.current = null;
  }

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
      }
    } finally {
      setLoading(false);
    }
  }

  const panelTransform = open ? `translateY(${dragY}px)` : 'translateY(100%)';
  const panelTransition = draggingRef.current ? 'none' : 'transform 300ms ease-out';

  const reasons = type === 'post' ? POST_REASONS : USER_REASONS;
  const title = type === 'post' ? 'Segnala avvistamento' : 'Segnala utente';

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-1100 bg-black/50 transition-opacity duration-300"
        style={{
          opacity: open ? 1 - dragY / 200 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-1101 bg-card rounded-t-2xl shadow-2xl select-none"
        style={{ transform: panelTransform, transition: panelTransition }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-5 pt-2 pb-2">
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

        <div className="flex gap-3 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            type="button"
            onClick={onClose}
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
    </>,
    document.body,
  );
}
