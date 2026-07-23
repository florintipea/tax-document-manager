import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeScript } from "@/components/providers/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaxDoc – Legaler Steuer- & Finanzoptimierer für Deutschland",
  description: "TaxDoc: Steuerrechner, Dokumente und KI-Steuer-Assistent für Deutschland — Schätzungen und Hilfsmittel, keine Steuerberatung.",
  applicationName: "TaxDoc",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaxDoc",
  },
  keywords: ["tax", "document management", "AI assistant", "tax software", "tax preparation"],
  authors: [{ name: "TaxDoc Team" }],
  creator: "TaxDoc",
  publisher: "TaxDoc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: process.env.APP_URL || "http://localhost:3000",
    title: "TaxDoc – Steuer- & Finanzoptimierer für Deutschland",
    description: "Steuerunterlagen ohne Chaos. Deine Steuererklärung — einfach.",
    siteName: "TaxDoc",
    images: [
      {
        url: "/brand/splash-de.png",
        width: 1080,
        height: 1080,
        alt: "TaxDoc – Steuerunterlagen ohne Chaos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxDoc – Steuer- & Finanzoptimierer für Deutschland",
    description: "Steuerunterlagen ohne Chaos. Deine Steuererklärung — einfach.",
    images: ["/brand/splash-de.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased safe-area-padding`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
