'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchFollowingFeed, type FeedPost } from '../actions';
import FeedPostCard from './feed-post-card';

const PULL_THRESHOLD = 80;

interface Props {
  initialPosts: FeedPost[];
}

export default function FeedClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pullProgressRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const hasVibratedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY: number | null = null;

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop > 0 || isRefreshingRef.current) return;
      startY = e.touches[0].clientY;
      hasVibratedRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY === null) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY <= 0) { startY = null; pullProgressRef.current = 0; setPullProgress(0); return; }
      const progress = Math.min(deltaY / PULL_THRESHOLD, 1.4);
      pullProgressRef.current = progress;
      setPullProgress(progress);
      if (progress >= 1 && !hasVibratedRef.current) {
        hasVibratedRef.current = true;
        navigator.vibrate?.(40);
      }
      if (deltaY > 8) e.preventDefault();
    }

    function onTouchEnd() {
      if (startY === null) return;
      startY = null;
      if (pullProgressRef.current >= 1 && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullProgress(0);
        pullProgressRef.current = 0;
        // Fetch only posts newer than the most recent in the current list
        const newestAt = posts[0]?.createdAt;
        fetchFollowingFeed(newestAt ? new Date(newestAt) : undefined).then((newPosts) => {
          if (newPosts.length > 0) {
            setPosts((prev) => [...newPosts, ...prev]);
          }
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        });
      } else {
        setPullProgress(0);
        pullProgressRef.current = 0;
        hasVibratedRef.current = false;
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const indicatorY = isRefreshing ? 12 : Math.min(pullProgress, 1) * 56 - 44;
  const indicatorOpacity = isRefreshing ? 1 : Math.min(pullProgress * 1.5, 1);
  const showIndicator = pullProgress > 0 || isRefreshing;

  return (
    <div className="flex-1 relative overflow-hidden h-full">
      {showIndicator && (
        <div
          className="absolute left-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-md pointer-events-none"
          style={{
            top: 0,
            transform: `translateX(-50%) translateY(${indicatorY}px)`,
            opacity: indicatorOpacity,
            transition: pullProgress === 0 ? 'transform 300ms ease-out, opacity 300ms ease-out' : 'none',
          }}
        >
          <RefreshCw
            className={cn('w-5 h-5 text-primary', isRefreshing && 'animate-spin')}
            style={isRefreshing ? undefined : { transform: `rotate(${pullProgress * 360}deg)` }}
          />
        </div>
      )}
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="flex flex-col">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
