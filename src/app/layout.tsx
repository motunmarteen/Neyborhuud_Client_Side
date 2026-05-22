import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppViewport } from "@/components/AppViewport";
import DailyCheckInModal from "@/components/gamification/DailyCheckInModalLoader";
import TextSizeApplier from "@/components/TextSizeApplier";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "neyborhuud — Your Huud Operating System",
    template: "%s | neyborhuud",
  },
  description: "Digital infrastructure for the modern African Huud. Safety, trust, and local prosperity — hyperlocal feed, SOS alerts, marketplace, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "neyborhuud",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "neyborhuud",
    title: "neyborhuud — Your Huud Operating System",
    description: "Digital infrastructure for the modern African Huud. Safety, trust, and local prosperity.",
  },
  twitter: {
    card: "summary",
    title: "neyborhuud",
    description: "Digital infrastructure for the modern African Huud.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#060908' },
    { media: '(prefers-color-scheme: dark)', color: '#060908' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var EXT='nkbihfbeogaeaoehlefnkodbefgpgknn';var isNoise=function(v){var s=String(v||'');return s.indexOf('MetaMask')!==-1||s.indexOf('Failed to connect to MetaMask')!==-1||s.indexOf(EXT)!==-1||s.indexOf('chrome-extension://'+EXT)!==-1;};window.addEventListener('error',function(event){var parts=[event&&event.message,event&&event.filename,event&&event.error&&event.error.message,event&&event.error&&event.error.stack].filter(Boolean).join(' ');if(isNoise(parts)){event.preventDefault();if(event.stopImmediatePropagation){event.stopImmediatePropagation();}}},true);window.addEventListener('unhandledrejection',function(event){var reason=event&&event.reason;var parts=[reason&&reason.message,reason&&reason.stack,reason].filter(Boolean).join(' ');if(isNoise(parts)){event.preventDefault();if(event.stopImmediatePropagation){event.stopImmediatePropagation();}}},true);}());`,
          }}
        />
      </head>
      <body
        className={`${jakarta.variable} app-body font-display text-brand-black transition-colors duration-200`}
        suppressHydrationWarning
      >
        <AppViewport />
        <Providers>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <TextSizeApplier />
          <DailyCheckInModal />
          <div id="main-content" className="app-shell">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
