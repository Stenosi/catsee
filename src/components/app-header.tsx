"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Settings, ChevronLeft, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = ["/scatta"];

const BACK_HEADERS: Record<string, string> = {
  "/profilo/modifica": "Modifica profilo",
  "/profilo/badge": "Badge",
  "/impostazioni": "Impostazioni",
};

const BACK_HEADER_PREFIXES: Array<{ prefix: string; title: string }> = [
  { prefix: "/post/", title: "Avvistamento" },
  { prefix: "/profilo/", title: "Profilo" },
];

export default function AppHeader({ username }: { username: string | null }) {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="shrink-0 relative z-40 h-14 bg-card border-b border-border flex items-center px-4">
      <HeaderContent pathname={pathname} username={username} />
    </header>
  );
}

function HeaderContent({ pathname, username }: { pathname: string; username: string | null }) {
  if (BACK_HEADERS[pathname]) {
    return <BackHeader title={BACK_HEADERS[pathname]} />;
  }

  if (pathname === "/profilo/follow") {
    return <FollowSearchHeader />;
  }

  const dynamicBack = BACK_HEADER_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (dynamicBack) {
    return <BackHeader title={dynamicBack.title} />;
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

function FollowSearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const tab = searchParams.get('tab');
      const base = tab ? `/profilo/follow?tab=${tab}` : '/profilo/follow';
      router.replace(value ? `${base}&q=${encodeURIComponent(value)}` : base, { scroll: false });
    }, 200);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    const tab = searchParams.get('tab');
    router.replace(tab ? `/profilo/follow?tab=${tab}` : '/profilo/follow', { scroll: false });
    inputRef.current?.focus();
  }

  const hasText = !!(searchParams.get('q') ?? '');

  return (
    <div className="flex w-full items-center gap-2">
      <button
        onClick={() => router.back()}
        aria-label="Torna indietro"
        className={cn(
          "flex items-center justify-center w-9 h-9 -ml-2 shrink-0 rounded-full",
          "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
      </button>
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Cerca…"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={handleChange}
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
    </div>
  );
}

function CercaHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      setIsSearching((e as CustomEvent<{ loading: boolean }>).detail.loading);
    }
    window.addEventListener('search-loading', handler);
    return () => window.removeEventListener('search-loading', handler);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(value ? `/cerca?q=${encodeURIComponent(value)}` : '/cerca', { scroll: false });
    }, 300);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    window.dispatchEvent(new CustomEvent('search-clear'));
    router.replace('/cerca', { scroll: false });
    inputRef.current?.focus();
  }

  const hasText = !!(searchParams.get('q') ?? '');

  return (
    <div className="relative flex-1">
      {isSearching ? (
        <Loader2
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin pointer-events-none"
        />
      ) : (
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          strokeWidth={2}
        />
      )}
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        placeholder="Cerca utenti…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleChange}
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
    <Link href="/feed" className="text-xl font-bold text-primary active:opacity-70">
      CatSee
    </Link>
  );
}

function ProfiloHeader({ username }: { username: string | null }) {
  const router = useRouter();
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-base font-semibold text-foreground">{username ? `@${username}` : ""}</span>
      <button
        aria-label="Impostazioni"
        onClick={() => router.push('/impostazioni')}
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
