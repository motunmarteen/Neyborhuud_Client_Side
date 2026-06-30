"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ShieldCheck, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { InteractiveMockup } from "./InteractiveMockup";
import { IntelTerminal } from "./IntelTerminal";
import { InteractiveCards } from "./InteractiveCards";
import { DayInTheHuud } from "./DayInTheHuud";

// Helper function to resolve the app subdomain URL dynamically
const getAppUrl = (path = "") => {
  if (typeof window === "undefined") return path;
  const host = window.location.host;
  const protocol = window.location.protocol;
  
  if (
    host.includes("localhost") ||
    host.includes("local") ||
    host.includes(":")
  ) {
    let targetHost = host;
    if (host.includes("neyborhuud.local")) {
      targetHost = host.replace("neyborhuud.local", "app.neyborhuud.local");
    } else if (host.includes("localhost")) {
      targetHost = host.replace("localhost", "app.localhost");
    } else if (host.includes("neyborhuud.com")) {
      targetHost = host.replace("neyborhuud.com", "app.neyborhuud.com");
    }
    return `${protocol}//${targetHost}${path}`;
  }
  return `https://app.neyborhuud.com${path}`;
};

export function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const [hasMounted, setHasMounted] = useState(false);
  
  // Smooth scroll springs
  const smoothY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  // Parallax effects
  const heroMockupY = useTransform(smoothY, [0, 0.2], [0, -60]);
  const heroTextY = useTransform(smoothY, [0, 0.2], [0, 30]);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
  } as const;

  if (!hasMounted) {
    return <div ref={containerRef} style={{ minHeight: "100vh", background: "#E9F6E6" }} />;
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      
      {/* 1. Hero Section (Asymmetrical & Editorial) */}
      <section className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: "clamp(100px, 15vw, 160px)", paddingBottom: "clamp(60px, 10vw, 120px)" }}>
        <div className="blob" style={{ position: "absolute", top: "-10%", left: "-10%", width: "clamp(300px, 50vw, 600px)", height: "clamp(300px, 50vw, 600px)", background: "var(--brand-surface)", filter: "blur(100px)", zIndex: -1 }}></div>
        <div className="blob" style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "clamp(250px, 40vw, 500px)", height: "clamp(250px, 40vw, 500px)", background: "rgba(0, 212, 49, 0.15)", filter: "blur(100px)", zIndex: -1 }}></div>

        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "60px", alignItems: "center" }}>
          
          {/* Hero Typography (Left) */}
          <motion.div style={{ y: heroTextY, zIndex: 10 }} initial="hidden" animate="visible" variants={containerVariants}>
            <motion.div 
              variants={itemVariants} 
              animate={{ boxShadow: ["0 0 0px var(--primary)", "0 0 20px var(--primary)", "0 0 0px var(--primary)"] }} 
              transition={{ repeat: Infinity, duration: 3 }} 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid var(--border-subtle)", padding: "8px 20px", borderRadius: "99px", marginBottom: "clamp(24px, 5vw, 40px)", fontSize: "0.875rem", fontWeight: 700, backdropFilter: "blur(10px)", background: "var(--glass-bg)" }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 10px var(--primary)" }}></div>
              <span>TrustOS Sentinel AI patrolling...</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-display-huge" style={{ marginBottom: "32px", fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 0.95 }}>
              The OS for <br />
              <span className="text-display-outline-primary">Your Huud.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-editorial" style={{ fontSize: "1.25rem", color: "var(--text-muted)", marginBottom: "48px", lineHeight: "1.7", maxWidth: "480px" }}>
              NeyborHuud is a verified neighborhood ecosystem. Connect with verified residents, buy locally via Social Escrow, and experience zero-lag safety alerts. Built for reality.
            </motion.p>
            
            <motion.div variants={itemVariants} style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <motion.button 
                onClick={() => window.location.href = getAppUrl("/signup")} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="btn-glass-primary shadow-premium" 
                style={{ padding: "20px 40px", fontSize: "1rem" }}
              >
                Claim Your Address
              </motion.button>
              
              <motion.button 
                onClick={() => window.location.href = getAppUrl("/login")} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="btn-glass-primary shadow-premium" 
                style={{ padding: "20px 40px", fontSize: "1rem", background: "transparent", color: "var(--text-main)", border: "1px solid var(--border-subtle)" }}
              >
                Enter your Huud
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Hero Interactive Device Mockup (Right) */}
          <motion.div style={{ y: heroMockupY, perspective: "1200px", width: "100%", maxWidth: "100%" }} initial={{ opacity: 0, x: 50, rotateY: -10, rotateX: 5 }} animate={{ opacity: 1, x: 0, rotateY: -10, rotateX: 5 }} transition={{ delay: 0.5, type: "spring", stiffness: 50 }}>
            <InteractiveMockup />
          </motion.div>
        </div>
      </section>

      {/* 2. Sentinel AI Intelligence Terminal Section */}
      <section id="safety" className="section" style={{ position: "relative", background: "rgba(255,255,255,0.01)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: "80px", alignItems: "center" }}>
            
            {/* Terminal Specs (Left) */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 0, 255, 0.08)", border: "1px solid rgba(0, 0, 255, 0.2)", padding: "6px 14px", borderRadius: "99px", marginBottom: "24px" }}>
                <Sparkles size={14} color="var(--brand-blue)" />
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--brand-blue)", letterSpacing: "0.05em" }}>SENTINEL AI</span>
              </div>
              
              <motion.h2 variants={itemVariants} className="text-display-large" style={{ marginBottom: "32px", fontSize: "clamp(2rem, 5vw, 3.8rem)", lineHeight: 1.1 }}>
                Patrolling <br/> <span className="text-display-outline">your block.</span>
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-editorial" style={{ fontSize: "1.2rem", color: "var(--text-muted)", lineHeight: "1.8", marginBottom: "32px" }}>
                Sentinel AI scans community feeds, pins incidents, verifies reports, and secures Safe Trip routes. It converts raw neighborhood telemetry into active, lifesaving safety loops.
              </motion.p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--brand-blue)", marginBottom: "4px" }}>&lt; 1s</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Emergency escalation latency</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--primary)", marginBottom: "4px" }}>100%</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Verified human nodes</div>
                </div>
              </div>
            </motion.div>

            {/* Terminal Output Shell (Right) */}
            <div>
              <IntelTerminal />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Storytelling Section: Day in the Huud */}
      <section className="section" style={{ position: "relative" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 60px" }}>
            <h2 className="text-display-large" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "20px" }}>
              A Day in the <span style={{ color: "var(--primary)" }}>Huud.</span>
            </h2>
            <p className="text-editorial" style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
              NeyborHuud is the operational glue of your physical block. Here is how it keeps your neighborhood synchronized, secure, and scam-free from morning to midnight.
            </p>
          </div>

          <DayInTheHuud />
        </div>
      </section>

      {/* 4. Interactive mosaic cards */}
      <section id="marketplace" className="section" style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 60px" }}>
            <h2 className="text-display-large" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "20px" }}>
              Packed with <span className="text-display-outline">Power.</span>
            </h2>
            <p className="text-editorial" style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
              No generic blocks. Interact with our feature sandbox below to see exactly how TrustOS, social escrow, and reward mechanics work.
            </p>
          </div>

          <InteractiveCards />
        </div>
      </section>

      {/* 5. The Fortress & Gamification (Dark Mode Breakout) */}
      <section id="trust" className="section" style={{ background: "#0c0d12", color: "#fff", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "160px 0" }}>
        
        {/* Intense radial glow in background */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "1000px", height: "1000px", background: "radial-gradient(circle, rgba(0,212,49,0.1) 0%, rgba(0,0,0,0) 70%)", pointerEvents: "none" }}></div>
        
        <div className="container relative z-10">
          <div className="grid-responsive-fortress" style={{ gap: "100px" }}>
            
            {/* Fortress Panel */}
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: "99px", marginBottom: "32px", fontSize: "0.8rem", fontWeight: 700, background: "rgba(255,255,255,0.05)" }}>
                <ShieldCheck size={14} color="var(--primary)" />
                <span style={{ letterSpacing: "0.05em" }}>TRUSTOS CRYPTO-PATROL</span>
              </div>
              <h2 className="text-display-large" style={{ marginBottom: "32px", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1 }}>The Fortress.</h2>
              <p className="text-editorial" style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.7)", marginBottom: "48px", lineHeight: "1.8" }}>
                Zero anonymity, zero room for trolls. By combining biometric NIN/BVN checks with strict local data residency, NeyborHuud guarantees that only verified residents enter your block.
              </p>
              
              <ul style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[
                  { title: "NIN / BVN Verification", desc: "Co-signed validation ensures absolute accountability." },
                  { title: "Local Data Residency", desc: "Hyperlocal traffic stays local, protecting community sovereignty." },
                  { title: "End-to-End Encryption", desc: "Private emergency broadcasts are invisible to outside trackers." },
                  { title: "Zero Scammer Sovereignty", desc: "Trust scores dynamically decay on flagged activities." }
                ].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 8 }} style={{ display: "flex", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
                    <div style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }}>✓</div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", display: "block", color: "white", marginBottom: "2px" }}>{item.title}</span>
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>{item.desc}</span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* Gamification Panel */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: "99px", marginBottom: "32px", fontSize: "0.8rem", fontWeight: 700, background: "rgba(255,255,255,0.05)" }}>
                <span style={{ color: "var(--primary)" }}>★</span>
                <span style={{ letterSpacing: "0.05em" }}>NEIGHBOR COINS</span>
              </div>
              <h2 className="text-display-large" style={{ marginBottom: "32px", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1 }}>Gamification.</h2>
              <p className="text-editorial" style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.7)", marginBottom: "48px", lineHeight: "1.8" }}>
                Good behavior is the currency of the neighborhood. Help check routes, report municipal blockages, vouch for verified users, and earn HuudCoins to trade locally.
              </p>
              
              <motion.div whileHover={{ scale: 1.01 }} style={{ background: "rgba(255,255,255,0.02)", padding: "40px", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>Elite Neighbor Trust Score</div>
                    <div className="text-display-large" style={{ lineHeight: 0.8, fontSize: "3.5rem", color: "white" }}>98<span style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>/100</span></div>
                  </div>
                  <div style={{ background: "rgba(0, 212, 49, 0.15)", color: "var(--primary)", border: "1px solid rgba(0, 212, 49, 0.3)", padding: "8px 20px", borderRadius: "99px", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.05em" }}>ELITE GUARDIAN STATUS</div>
                </div>
                
                <div style={{ height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden", marginBottom: "16px" }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "98%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }} style={{ height: "100%", background: "linear-gradient(90deg, var(--brand-blue), var(--primary))" }}></motion.div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                  You are in the top 2% of Victoria Island. You qualify for advanced SOS routing and local node validation pools.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="cta-section text-center" style={{ background: "var(--bg-secondary)", position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border-subtle)", padding: "clamp(80px, 15vw, 160px) 0" }}>
        <div className="blob" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "rgba(0, 212, 49, 0.08)", filter: "blur(120px)", zIndex: 1, pointerEvents: "none" }}></div>
        
        <div className="container relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-display-huge" style={{ marginBottom: "40px", fontSize: "clamp(3.5rem, 8vw, 6.5rem)", lineHeight: 0.9 }}>
            Enter the <br/> <span className="text-display-outline-primary">Huud.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-editorial" style={{ fontSize: "1.25rem", color: "var(--text-muted)", marginBottom: "48px", maxWidth: "540px", marginInline: "auto", lineHeight: 1.6 }}>
            Claim your street address today. Connect with verified neighbors, transact safely, and build local resilience.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <motion.button onClick={() => window.location.href = getAppUrl("/signup")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glass-primary shadow-premium" style={{ fontSize: "1.1rem", padding: "24px 48px" }}>
              Join NeyborHuud Now <ChevronRight style={{ marginLeft: "8px" }} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{ background: "var(--bg-main)", padding: "100px 0 40px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "60px", marginBottom: "80px" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: "2rem", color: "var(--primary)", letterSpacing: "-0.04em", marginBottom: "24px" }}>
                NeyborHuud.
              </div>
              <p className="text-editorial" style={{ color: "var(--text-muted)", lineHeight: "1.6", fontSize: "1.1rem" }}>The Operating System for Your Neighborhood.</p>
            </div>
            
            <div>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "24px" }}>Platform</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", padding: 0 }}>
                <li><a href="#safety" style={{ color: "var(--text-muted)", fontWeight: 650 }} className="text-editorial">TrustOS</a></li>
                <li><a href="#safety" style={{ color: "var(--text-muted)", fontWeight: 650 }} className="text-editorial">Sentinel AI</a></li>
                <li><a href="#marketplace" style={{ color: "var(--text-muted)", fontWeight: 650 }} className="text-editorial">Marketplace</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "24px" }}>Legal</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", padding: 0 }}>
                <li><a href={getAppUrl("/info/privacy-policy")} style={{ color: "var(--text-muted)", fontWeight: 650 }} className="text-editorial">Privacy Policy</a></li>
                <li><a href={getAppUrl("/info/community-rules")} style={{ color: "var(--text-muted)", fontWeight: 650 }} className="text-editorial">Community Rules</a></li>
              </ul>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", flexWrap: "wrap", gap: "20px" }}>
            <p className="text-editorial">© {new Date().getFullYear()} NeyborHuud Inc.</p>
            <p className="text-editorial" style={{ fontSize: "0.9rem" }}>Designed with intention.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
