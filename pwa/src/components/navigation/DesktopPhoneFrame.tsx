"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function DesktopPhoneFrame({ children }: { children: ReactNode }) {
  const [isAppDomain, setIsAppDomain] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isApp =
        hostname.startsWith("app.") ||
        hostname.startsWith("app.localhost") ||
        hostname.startsWith("app.neyborhuud.local");
      setIsAppDomain(isApp);

      const inIframe = window.self !== window.top;
      setIsInIframe(inIframe);

      // Set the initial iframe src ONLY once on mount to prevent reloading the iframe on clicks
      setIframeSrc(window.location.pathname + window.location.search);

      // If on PWA desktop mode and NOT inside the iframe, apply overflow lock to parent shell
      if (isApp && !inIframe) {
        const adjustScroll = () => {
          if (window.innerWidth >= 1024) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
          } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
          }
        };
        adjustScroll();
        window.addEventListener("resize", adjustScroll);
        return () => {
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
          window.removeEventListener("resize", adjustScroll);
        };
      }
    }
  }, []); // Run only on mount

  // Sync browser Back/Forward navigation back to the iframe
  useEffect(() => {
    if (typeof window === "undefined" || isInIframe) return;

    const handlePopState = () => {
      setIframeSrc(window.location.pathname + window.location.search);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isInIframe]);

  if (!mounted) {
    return <>{children}</>;
  }

  // If inside the iframe (PWA app child), or NOT on the app subdomain, render normally
  if (isInIframe || !isAppDomain) {
    return <>{children}</>;
  }

  return (
    <div className="app-simulator-layout">
      {/* 1. Dummy left column spacer */}
      <div />

      {/* 2. Phone Mockup Bezel with same-origin iframe */}
      <div className="phone-mockup-wrapper">
        <div className="phone-mockup-device">
          <div className="phone-mockup-notch" />
          <div className="phone-mockup-speaker" />
          <div className="phone-mockup-screen" style={{ overflow: "hidden" }}>
            {iframeSrc && (
              <iframe
                src={iframeSrc}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "34px",
                  overflow: "hidden"
                }}
                title="NeyborHuud App Simulator"
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. Onboarding Panel (Desktop Only) */}
      <div className="desktop-onboarding-panel">
        <div className="desktop-onboarding-card">
          <div className="flex items-center gap-2 mb-4">
            <img 
              src="/brand/neyborhuud-mark-light.png" 
              alt="NeyborHuud Logo" 
              style={{ width: "32px", height: "32px", objectFit: "contain" }} 
            />
            <span 
              style={{ 
                color: "#ffffff", 
                fontSize: "1.25rem", 
                fontWeight: 800,
                letterSpacing: "-0.03em"
              }}
            >
              Neybor<span style={{ color: "#00d431" }}>Huud</span>
            </span>
          </div>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }}>
            Designed for Mobile
          </h2>
          
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
            NeyborHuud is built for your street. Scan to install the app on your phone for full safety features (GPS & instant SOS).
          </p>

          <div className="qr-code-wrapper" style={{ display: "inline-flex", alignSelf: "flex-start", marginBottom: "1rem" }}>
            <svg viewBox="0 0 100 100" style={{ width: "128px", height: "128px" }} fill="#1a1a1a">
              <rect x="0" y="0" width="30" height="30" rx="4" fill="none" stroke="#1a1a1a" strokeWidth="6" />
              <rect x="8" y="8" width="14" height="14" rx="2" />
              <rect x="70" y="0" width="30" height="30" rx="4" fill="none" stroke="#1a1a1a" strokeWidth="6" />
              <rect x="78" y="8" width="14" height="14" rx="2" />
              <rect x="0" y="70" width="30" height="30" rx="4" fill="none" stroke="#1a1a1a" strokeWidth="6" />
              <rect x="8" y="78" width="14" height="14" rx="2" />
              
              <rect x="40" y="0" width="6" height="6" rx="1" />
              <rect x="50" y="6" width="12" height="6" rx="1" />
              <rect x="40" y="18" width="18" height="6" rx="1" />
              <rect x="50" y="28" width="6" height="12" rx="1" />
              
              <rect x="0" y="40" width="6" height="12" rx="1" />
              <rect x="12" y="40" width="12" height="6" rx="1" />
              <rect x="8" y="52" width="6" height="12" rx="1" />
              
              <rect x="70" y="40" width="12" height="6" rx="1" />
              <rect x="88" y="40" width="12" height="12" rx="1" />
              <rect x="70" y="52" width="6" height="6" rx="1" />
              <rect x="82" y="58" width="6" height="12" rx="1" />

              <rect x="40" y="40" width="18" height="18" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="4" />
              <rect x="46" y="46" width="6" height="6" rx="1" />

              <rect x="40" y="70" width="6" height="12" rx="1" />
              <rect x="50" y="78" width="12" height="6" rx="1" />
              <rect x="40" y="88" width="18" height="6" rx="1" />

              <rect x="70" y="70" width="12" height="6" rx="1" />
              <rect x="88" y="70" width="6" height="12" rx="1" />
              <rect x="76" y="82" width="18" height="6" rx="1" />
            </svg>
          </div>

          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Scan to install
          </p>
        </div>
      </div>

      {/* 4. Dummy right column spacer */}
      <div />
    </div>
  );
}
