"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Home, Camera, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", label: "Feed", Icon: Home },
  { href: "/mappa", label: "Mappa", Icon: Map },
  { href: "/cerca", label: "Cerca", Icon: Search },
  { href: "/profilo", label: "Profilo", Icon: User },
] as const;

const HIDDEN_PATHS = ["/scatta"];
const SHOW_LABELS = true;

export default function BottomNavbar() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(navigator.maxTouchPoints === 0 && !window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const PROFILO_OWN_ROUTES = ['/profilo/badge', '/profilo/modifica', '/profilo/follow'];

  const isActive = (href: string) => {
    if (href === '/profilo') {
      return pathname === '/profilo' ||
        PROFILO_OWN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="shrink-0 relative z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end h-12 px-2">
        {isDesktop ? (
          // Desktop: 4 tab uniformi, niente FAB
          tabs.map(({ href, label, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
          ))
        ) : (
          // Mobile: 2 tab + FAB + 2 tab
          <>
            {tabs.slice(0, 2).map(({ href, label, Icon }) => (
              <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
            ))}

            <div className="flex flex-1 justify-center items-start">
              <Link
                href="/scatta"
                aria-label="Scatta foto"
                className={cn(
                  "flex items-center justify-center w-16 h-16 rounded-full -translate-y-2",
                  "bg-primary text-primary-foreground shadow-lg",
                  "transition-transform active:scale-95"
                )}
              >
                <Camera className="w-8 h-8" strokeWidth={1.5} />
              </Link>
            </div>

            {tabs.slice(2).map(({ href, label, Icon }) => (
              <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
            ))}
          </>
        )}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-end gap-0.5 pb-2 pt-1",
        "transition-colors",
        active ? "text-primary font-semibold" : "text-muted-foreground"
      )}
    >
      <Icon
        className={SHOW_LABELS ? "w-5 h-5" : "w-6 h-6"}
        strokeWidth={active ? 2.25 : 1.75}
      />
      {SHOW_LABELS && <span className="text-xs leading-none">{label}</span>}
    </Link>
  );
}
