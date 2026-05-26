'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchFollowers, fetchFollowing, type FollowUser } from '../actions';

const CLOSE_THRESHOLD = 80;

type Mode = 'follower' | 'seguiti';

interface Props {
  mode: Mode | null;
  onClose: () => void;
}

export default function FollowsSheet({ mode, onClose }: Props) {
  const isOpen = mode !== null;
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const prevMode = useRef<Mode | null>(null);

  useEffect(() => {
    if (!mode) return;
    if (mode === prevMode.current) return;
    prevMode.current = mode;
    setUsers([]);
    setLoading(true);
    const fn = mode === 'follower' ? fetchFollowers : fetchFollowing;
    fn().then((r) => { setUsers(r); setLoading(false); });
  }, [mode]);

  function onPointerDown(e: React.PointerEvent) {
    startYRef.current = e.clientY;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || startYRef.current === null) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragY >= CLOSE_THRESHOLD) onClose();
    setDragY(0);
    startYRef.current = null;
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const panelTransform = isOpen ? `translateY(${dragY}px)` : 'translateY(100%)';
  const panelTransition = draggingRef.current ? 'none' : 'transform 300ms ease-out';
  const title = mode === 'follower' ? 'Follower' : 'Seguiti';

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-1001 bg-black/40 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 - dragY / 200 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-1002 bg-card rounded-t-2xl shadow-2xl flex flex-col"
        style={{ transform: panelTransform, transition: panelTransition, maxHeight: '75dvh' }}
      >
        {/* Handle — unica area di drag */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0 select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Titolo */}
        <p className="text-sm font-semibold text-foreground text-center py-3 border-b border-border shrink-0">
          {title}
        </p>

        {/* Lista scrollabile */}
        <div className="overflow-y-auto flex-1 pb-[env(safe-area-inset-bottom)]">
          {loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              {mode === 'follower' ? 'Nessun follower ancora.' : 'Non stai seguendo nessuno.'}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profilo/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-muted shrink-0">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary uppercase">
                          {user.username.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{user.nickname}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
