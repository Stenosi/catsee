"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CercaPage() {
  const [hasText, setHasText] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onInput = () => setHasText(el.value.length > 0);
    el.addEventListener("input", onInput);
    return () => el.removeEventListener("input", onInput);
  }, []);

  const handleClear = () => {
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    setHasText(false);
    el.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar — sticky top, stessa altezza dell'AppHeader (h-14) */}
      <div className="sticky top-0 z-10 h-14 bg-card border-b border-border flex items-center px-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            placeholder="Cerca utenti…"
            className={cn(
              "w-full h-9 rounded-full pl-9 text-sm font-medium",
              "bg-muted text-foreground placeholder:text-muted-foreground",
              "border border-border outline-none caret-primary",
              hasText ? "pr-9" : "pr-4"
            )}
          />
          {hasText && (
            <button
              type="button"
              aria-label="Cancella ricerca"
              onPointerDown={(e) => { e.preventDefault(); handleClear(); }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "flex items-center justify-center w-6 h-6 rounded-full",
                "text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Contenuto pagina */}
      <div className={cn(
        "flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground",
        hasText && "bg-red-500"
      )}>
        <span className="text-4xl">🔍</span>
        <p className="text-sm">hasText: {String(hasText)}</p>
      </div>
    </div>
  );
}
