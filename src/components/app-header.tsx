"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Settings, ChevronLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = ["/scatta"];

const BACK_HEADERS: Record<string, string> = {
  "/profilo/modifica": "Modifica profilo",
  "/profilo/badge": "Badge",
};

export default function AppHeader({ username }: { username: string | null }) {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="shrink-0 z-40 h-14 bg-card border-b border-border flex items-center px-4">
      <HeaderContent pathname={pathname} username={username} />
    </header>
  );
}

function HeaderContent({ pathname, username }: { pathname: string; username: string | null }) {
  if (BACK_HEADERS[pathname]) {
    return <BackHeader title={BACK_HEADERS[pathname]} />;
  }

  if (pathname === "/profilo") {
    return <ProfiloHeader username={username} />;
  }

  if (pathname === "/cerca") {
    return <CercaHeader />;
  }

  return <LogoHeader />;
}

function BackHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <div className="flex w-full items-center gap-2">
      <button
        onClick={() => router.back()}
        aria-label="Torna indietro"
        className={cn(
          "flex items-center justify-center w-9 h-9 -ml-2 rounded-full",
          "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
      </button>
      <span className="text-base font-semibold text-foreground">{title}</span>
    </div>
  );
}

function CercaHeader() {
  const [hasText, setHasText] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    setHasText(false);
    el.focus();
  };

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        strokeWidth={2}
      />
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        placeholder="Cerca utenti…"
        onInput={(e) => setHasText((e.target as HTMLInputElement).value.length > 0)}
        className={cn(
          "w-full h-9 rounded-full pl-9 text-sm font-medium",
          "bg-muted/50 text-foreground placeholder:text-muted-foreground/50",
          "border border-border outline-none caret-primary",
          "[&::-webkit-search-cancel-button]:hidden",
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
  );
}

function LogoHeader() {
  return (
    <span className="text-xl font-bold text-primary">CatSee</span>
  );
}

function ProfiloHeader({ username }: { username: string | null }) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-base font-semibold text-foreground">{username ? `@${username}` : ""}</span>
      <button
        aria-label="Impostazioni"
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full",
          "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Settings className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}