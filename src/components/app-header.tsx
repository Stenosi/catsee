"use client";

import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = ["/scatta", "/cerca"];

export default function AppHeader() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="shrink-0 z-40 h-14 bg-card border-b border-border flex items-center px-4">
      <HeaderContent pathname={pathname} />
    </header>
  );
}

function HeaderContent({ pathname }: { pathname: string }) {
  if (pathname === "/profilo" || pathname.startsWith("/profilo/")) {
    return <ProfiloHeader />;
  }

  return <LogoHeader />;
}

function LogoHeader() {
  return (
    <span className="text-xl font-bold text-primary">CatSee</span>
  );
}

function ProfiloHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      {/* @ Username unico */}
      <span className="text-base font-semibold text-foreground">@stenosi</span>
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
