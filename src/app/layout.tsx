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
    default: "NeyborHuud - Your Neighbourhood Operating System",
    template: "%s | NeyborHuud",
  },
  description: "Digital infrastructure for the modern African neighbourhood. Safety, trust, and local prosperity — hyperlocal feed, SOS alerts, marketplace, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NeyborHuud",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "NeyborHuud",
    title: "NeyborHuud - Your Neighbourhood Operating System",
    description: "Digital infrastructure for the modern African neighbourhood. Safety, trust, and local prosperity.",
  },
  twitter: {
    card: "summary",
    title: "NeyborHuud",
    description: "Digital infrastructure for the modern African neighbourhood.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#11d473",
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
        className={`${jakarta.variable} font-display text-[#1A1A2E] transition-colors duration-200`}
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
