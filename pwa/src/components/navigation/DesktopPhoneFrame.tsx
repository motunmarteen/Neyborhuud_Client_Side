"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";

/** iOS-style status-bar clock, e.g. "9:41". Ticks on the minute, not every render. */
function useStatusBarTime(): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export default function DesktopPhoneFrame({ children }: { children: ReactNode }) {
  const [isAppDomain, setIsAppDomain] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const statusBarTime = useStatusBarTime();
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
      // The phone-mockup notch is drawn by the OUTER page, on top of this
      // iframe's own content — env(safe-area-inset-top) is 0 in a desktop
      // iframe (there's no real notch here), so chrome that relies on it
      // renders underneath the notch instead of below it. Flag it so the
      // iframe's own CSS can reserve extra clearance. See globals.css
      // [data-in-phone-mockup="true"] .auth-signup-chrome.
      if (inIframe) {
        document.documentElement.setAttribute("data-in-phone-mockup", "true");
      }

      // Set the initial iframe src ONLY once on mount to prevent reloading the iframe on clicks
      setIframeSrc(window.location.pathname + window.location.search);

      // Generate a fully functioning, scannable QR Code that redirects to app.neyborhuud.com
      QRCode.toDataURL("https://app.neyborhuud.com", {
        margin: 1,
        width: 256,
        color: {
          dark: "#1a1a1a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("Failed to generate QR Code", err));

      // Manage desktop viewport checks and scroll locks
      const adjustLayout = () => {
        const desktop = window.innerWidth >= 1024;
        setIsDesktop(desktop);
        
        if (isApp && !inIframe) {
          if (desktop) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
          } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
          }
        }
      };
      
      adjustLayout();
      window.addEventListener("resize", adjustLayout);
      return () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        window.removeEventListener("resize", adjustLayout);
      };
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

  // If inside the iframe (PWA app child), or NOT on the app subdomain, or on a mobile screen, render natively
  if (isInIframe || !isAppDomain || !isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="app-simulator-layout">
      {/* 1. Dummy left column spacer */}
      <div />

      {/* 2. Phone Mockup Bezel with same-origin iframe */}
      <div className="phone-mockup-wrapper">
        <div className="phone-mockup-device">
          <div className="phone-mockup-statusbar" aria-hidden="true">
            <span className="phone-mockup-statusbar__time">{statusBarTime}</span>
            <span className="phone-mockup-statusbar__icons">
              {/* Cellular signal */}
              <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="6" width="3" height="5" rx="0.8" fill="currentColor" />
                <rect x="4.5" y="4" width="3" height="7" rx="0.8" fill="currentColor" />
                <rect x="9" y="2" width="3" height="9" rx="0.8" fill="currentColor" />
                <rect x="13.5" y="0" width="3" height="11" rx="0.8" fill="currentColor" />
              </svg>
              {/* Wi-Fi */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 9.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" fill="currentColor" />
                <path d="M4.2 6.7a4.8 4.8 0 0 1 6.6 0 .6.6 0 0 1-.02.86l-.72.68a.6.6 0 0 1-.82-.02 2.9 2.9 0 0 0-3.5 0 .6.6 0 0 1-.82.02l-.72-.68a.6.6 0 0 1 0-.86Z" fill="currentColor" />
                <path d="M1.6 4.1a8.6 8.6 0 0 1 11.8 0 .6.6 0 0 1 0 .87l-.72.7a.6.6 0 0 1-.82 0 6.7 6.7 0 0 0-8.72 0 .6.6 0 0 1-.82 0l-.72-.7a.6.6 0 0 1 0-.87Z" fill="currentColor" />
              </svg>
              {/* Battery */}
              <svg width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.6" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
                <rect x="2.25" y="2.25" width="17.5" height="7.5" rx="1.4" fill="currentColor" />
                <path d="M22.5 4v4a1.6 1.6 0 0 0 0-4Z" fill="currentColor" fillOpacity="0.4" />
              </svg>
            </span>
          </div>
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
            <Image
              src="/brand/neyborhuud-mark-light.png"
              alt="NeyborHuud Logo"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
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
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt="Scan to Install App"
                width={128}
                height={128}
                unoptimized
                style={{ display: "block", borderRadius: "10px" }}
              />
            ) : (
              <div style={{ width: "128px", height: "128px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "10px" }} />
            )}
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
