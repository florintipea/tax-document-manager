import type { Metadata } from "next";
import { Syne, Figtree } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaxDoc-Vermieter — Pilot für Privatvermieter",
  description:
    "Separater Pilot-Track von TaxDoc für Privatvermieter und Haus-und-Grund. Hilfsmittel — keine Steuerberatung, keine automatische ELSTER-Abgabe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${syne.variable} ${figtree.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
