"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  "/admin/moderazione",
  "/admin/segnalazioni",
  "/admin/utenti",
];

export default function AdminSwipeMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;

    const idx = TABS.indexOf(pathname);
    if (idx === -1) return;

    if (dx < 0 && idx < TABS.length - 1) router.push(TABS[idx + 1]);
    if (dx > 0 && idx > 0) router.push(TABS[idx - 1]);
  }

  return (
    <main
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </main>
  );
}
