"use client";

import { useRouter, usePathname } from "next/navigation";
import { Cat } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_NAMES: Record<string, string> = {
  "/admin/moderazione": "Moderazione",
  "/admin/segnalazioni": "Segnalazioni",
  "/admin/utenti": "Utenti",
};

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const section = SECTION_NAMES[pathname] ?? "Admin";

  return (
    <header className="shrink-0 h-14 bg-card border-b border-border flex items-center px-4">
      <div className="flex w-full items-center">
        <span className="text-xl font-bold text-primary flex-1">CatSee</span>
        <span className="text-sm font-semibold text-foreground">{section}</span>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => router.push('/mappa')}
            aria-label="Torna all'app"
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full",
              "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Cat className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
