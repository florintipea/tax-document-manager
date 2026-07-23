import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TaxDoc – Steuerdokumente',
    short_name: 'TaxDoc',
    description: 'KI-gestützte Verwaltung Ihrer Steuerdokumente',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0B1F5C',
    theme_color: '#1A3FA8',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
