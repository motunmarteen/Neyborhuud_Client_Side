import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { Providers } from "@/components/providers";
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
  themeColor: "#006F35",
  width: "device-width",
  initialScale: 1,
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
      </head>
      <body
        className={`${jakarta.variable} font-display text-brand-black transition-colors duration-200`}
        suppressHydrationWarning
      >
        <Providers>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <TextSizeApplier />
          <DailyCheckInModal />
          <div id="main-content" className="mx-auto w-full max-w-[1400px] relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
