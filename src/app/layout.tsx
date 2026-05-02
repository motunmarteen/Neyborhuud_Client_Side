import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NeyborHuud - Your NeyborHuud Operating System",
  description: "Digital infrastructure for the modern African NeyborHuud. Safety, trust, and local prosperity.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NeyborHuud",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#11d473",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${jakarta.variable} font-display text-[#1A1A2E] transition-colors duration-200`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="mx-auto w-full max-w-[1400px] relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
