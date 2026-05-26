import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CatSee',
    short_name: 'CatSee',
    description: 'Scopri e condividi i gatti del tuo quartiere',
    start_url: '/mappa',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fff0e9',
    theme_color: '#fff0e9',
    icons: [
      {
        src: '/icon-192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
