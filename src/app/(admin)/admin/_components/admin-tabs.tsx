"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  pendingCount: number;
  reportCount: number;
  bannedCount: number;
}

const TABS = [
  { href: "/admin/moderazione", label: "Moderazione", countKey: "pendingCount" as const },
  { href: "/admin/segnalazioni", label: "Segnalazioni", countKey: "reportCount" as const },
  { href: "/admin/utenti", label: "Utenti", countKey: "bannedCount" as const },
];

export default function AdminTabs({ pendingCount, reportCount, bannedCount }: AdminTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const counts = { pendingCount, reportCount, bannedCount };

  return (
    <div className="shrink-0 flex border-b border-border bg-card">
      {TABS.map((tab) => {
        const count = counts[tab.countKey];
        const isActive = pathname === tab.href;
        return (
          <button
            key={tab.href}
            onClick={() => router.replace(tab.href)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
              "relative",
              isActive
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {count > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
