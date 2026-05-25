import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, Serwist } from 'serwist';
import { ExpirationPlugin } from 'serwist';

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Tile mappa Stadia — stale-while-revalidate, max 500 tile, scadono dopo 30gg
    {
      matcher: /^https:\/\/tiles\.stadiamaps\.com\//,
      handler: new StaleWhileRevalidate({
        cacheName: 'map-tiles',
        plugins: [
          new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Thumbnail gatti su R2 — stale-while-revalidate, max 300 immagini, 7gg
    {
      matcher: ({ url }) => url.hostname.endsWith('.r2.dev') || url.pathname.startsWith('/sightings/'),
      handler: new StaleWhileRevalidate({
        cacheName: 'cat-thumbnails',
        plugins: [
          new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
    // Pagine Next.js — network first (dati sempre freschi, fallback cache se offline)
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 }),
        ],
      }),
    },
    // Font Google — cache first a lungo termine
    {
      matcher: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
      handler: new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
