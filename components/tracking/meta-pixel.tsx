'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/** Pixel ID from env — empty = tracking off (no script, no cookies). */
export function getMetaPixelId(): string {
  return (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();
}

export function trackMetaLead(): void {
  const id = getMetaPixelId();
  if (!id || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', 'Lead');
}

/**
 * Optional Meta Pixel. Loads only when NEXT_PUBLIC_META_PIXEL_ID is set.
 * PageView on load; call trackMetaLead() after successful /beta-anfrage submit.
 */
export function MetaPixel() {
  const pixelId = getMetaPixelId();

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return;
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ${JSON.stringify(pixelId)});
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
