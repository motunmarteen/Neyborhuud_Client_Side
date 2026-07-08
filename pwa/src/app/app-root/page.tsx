"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { resolvePostAuthRoute, validateStoredSession } from "@/lib/authSession";
import { SocialProofBadge } from "@/components/landing/SocialProofBadge";
import { BRAND_NAME } from "@/lib/brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { NeyborHuudLogo } from "@/components/brand/NeyborHuudLogo";

const LANDING_VIDEO = "/video/background-video.mp4";
const LANDING_POSTER = "/video/landing-poster.jpg";

interface SlideData {
  lines: { text: string; isGreen: boolean }[];
  subcopy: string;
}

const slides: SlideData[] = [
  {
    lines: [
      { text: "Safety.", isGreen: false },
      { text: "Neybor.", isGreen: false },
      { text: "Huud.", isGreen: true }
    ],
    subcopy: "Know what's happening on your street. Before everyone else does."
  },
  {
    lines: [
      { text: "Secure.", isGreen: false },
      { text: "Verified.", isGreen: false },
      { text: "Trade.", isGreen: true }
    ],
    subcopy: "Buy, sell, and hire locally with verified neighbors."
  },
  {
    lines: [
      { text: "Zero-Lag.", isGreen: false },
      { text: "SOS.", isGreen: false },
      { text: "Patrol.", isGreen: true }
    ],
    subcopy: "Instant emergency alerts co-signed by active neighborhood guardians."
  }
];

export default function AppRootPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [posterOk, setPosterOk] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-landing", "true");
    return () => document.documentElement.removeAttribute("data-landing");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function checkNavigation() {
      // 1. Check if authenticated (logged-in user session)
      if (apiClient.isAuthenticated()) {
        const validation = await validateStoredSession();
        if (cancelled) return;

        if (validation === "valid") {
          router.replace(resolvePostAuthRoute());
          return;
        }
      }

      // Check if running inside the desktop simulator iframe to prevent race conditions
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      if (inIframe) {
        setCheckingAuth(false);
        return;
      }

      // 2. Check if they have visited the PWA before
      const hasVisited = localStorage.getItem("neyborhuud_has_visited");
      if (hasVisited === "true") {
        // Returning visitor, but unauthenticated -> go to login
        router.replace("/login");
      } else {
        // First-time visitor -> show the welcome screen
        // Mark as visited so next launch skips this welcome page
        localStorage.setItem("neyborhuud_has_visited", "true");
        setCheckingAuth(false);
      }
    }

    void checkNavigation();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => setVideoReady(true);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      if (motion.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        /* Autoplay blocked */
      });
    };

    video.addEventListener("canplay", onReady);
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      onReady();
    }

    syncPlayback();
    motion.addEventListener("change", syncPlayback);
    return () => {
      video.removeEventListener("canplay", onReady);
      motion.removeEventListener("change", syncPlayback);
    };
  }, [checkingAuth]);

  // Slideshow auto-rotation (6s delay, resets on manual change)
  useEffect(() => {
    if (checkingAuth) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [checkingAuth, activeSlide]);

  // Display a premium, native-feeling splash screen during auth verification & redirects
  if (checkingAuth) {
    return (
      <div 
        style={{ 
          minHeight: "100vh", 
          backgroundColor: "#060908",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "var(--font-jakarta), sans-serif"
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes splashScale {
            0% { transform: scale(0.92); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.65; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
          }
          .splash-container {
            animation: splashScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
          }
          .splash-logo {
            animation: pulseGlow 1.8s ease-in-out infinite;
          }
        `}} />
        <div className="splash-container">
          <img
            src="/brand/neyborhuud-mark-light.png"
            alt="NeyborHuud Logo"
            className="splash-logo"
            style={{
              width: "110px",
              height: "110px",
              objectFit: "contain"
            }}
          />
          <span 
            style={{ 
              color: "#ffffff", 
              fontSize: "1.75rem", 
              fontWeight: 800,
              letterSpacing: "-0.03em"
            }}
          >
            Neybor<span style={{ color: "#00d431" }}>Huud</span>
          </span>
        </div>
      </div>
    );
  }

  const slide = slides[activeSlide];

  return (
    <div className="landing-page">
      <div className="landing-page-media" aria-hidden>
        <div className="absolute inset-0 bg-[#060908]" />

        {posterOk ? (
          <img
            src={LANDING_POSTER}
            alt=""
            className="landing-video absolute inset-0 h-full w-full"
            onError={() => setPosterOk(false)}
          />
        ) : null}

        <video
          ref={videoRef}
          className={`landing-video absolute inset-0 h-full w-full transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={LANDING_VIDEO} type="video/mp4" />
        </video>

        <div className="landing-glow-top absolute inset-0" />
        <div className="landing-glow-bottom absolute inset-0" />
        <div className="landing-glow-blue absolute inset-0" />

        <div className="landing-scrim absolute inset-0" />
        <div className="landing-scrim-bottom absolute inset-x-0 bottom-0 h-1/2" />
      </div>

      <div className="landing-page-shell relative z-10 mx-auto flex h-full min-h-0 w-full max-w-md flex-col px-6">
        <header 
          className="w-full flex flex-col items-center justify-center shrink-0" 
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)", paddingBottom: "24px" }}
        >
          <div className="landing-page-header-brand flex flex-col items-center justify-center relative">
            <div className="landing-logo-halo pointer-events-none" aria-hidden />
            <div className="landing-page-header-mark-wrap">
              <img
                src="/brand/neyborhuud-mark-light.png"
                alt="NeyborHuud Pin"
                className="landing-page-header-mark brand-mark-hero object-contain"
                style={{ width: "auto", height: "var(--landing-mark-height, 100px)", maxHeight: "15vh" }}
              />
            </div>
            <div className="landing-page-header-wordmark">
              <NeyborHuudLogo tone="hero" presentation="lockup" size="hero" />
            </div>
          </div>
        </header>

        <div className="landing-page-body flex min-h-0 flex-1 flex-col">
          <div key={activeSlide} className="landing-page-copy mt-12 mb-auto flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="landing-headline-stack">
              {slide.lines.map((line) => (
                <h1
                  key={line.text}
                  className={`landing-headline ${
                    line.isGreen ? "brand-name-hero" : "landing-headline--white"
                  }`}
                >
                  {line.text}
                </h1>
              ))}
            </div>
            <p className="landing-subcopy">
              {slide.subcopy}
            </p>
            <div className="landing-carousel-dots">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`landing-carousel-dot ${
                    activeSlide === idx ? "active" : ""
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <SocialProofBadge />
          </div>

          <div className="landing-page-actions mt-auto pb-12">
            <Link
              href="/signup"
              className="landing-btn-primary landing-btn landing-btn--brand font-bold transition-transform active:scale-[0.98]"
            >
              Join {BRAND_NAME}
            </Link>
            <Link
              href="/login"
              className="landing-btn-secondary landing-btn font-bold transition-transform active:scale-[0.98]"
            >
              Enter your Huud
            </Link>
            <GoogleSignInButton variant="landing" />
            <p className="landing-legal-text">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="landing-legal-link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="landing-legal-link">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
