"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, SunDim, Moon, ArrowRight, Store, ShieldCheck, MapPin, Sparkles, AlertTriangle } from "lucide-react";

const PHASES = [
  {
    id: "morning",
    time: "08:00 AM",
    title: "Morning Hustle & Social Escrow",
    subtitle: "Secure Local Commerce",
    desc: "Tunde needs to sell his Honda generator. Instead of risking scams on open marketplaces or paying expensive dispatch riders, he lists it on NeyborHuud. An immediate neighbor, Fatima, deposits the Naira in the TrustOS Escrow hold. Tunde dispatches it, Fatima inspects and releases the funds. Trust established, transaction cleared—all within 300 meters.",
    color: "#FFAC1C", // warm morning gold
    icon: <Sun size={24} color="#FFAC1C" />,
    mockup: {
      header: "NeyborHuud Escrow #912",
      body: "₦180,000 locked in TrustOS Hold for Generator. Verified dispatch rider dispatched.",
      type: "commerce",
      bg: "linear-gradient(135deg, rgba(255, 172, 28, 0.15) 0%, rgba(15, 19, 26, 0.8) 100%)"
    }
  },
  {
    id: "afternoon",
    time: "02:00 PM",
    title: "Afternoon Grid & Traffic Updates",
    subtitle: "Noise-Free Local Awareness",
    desc: "A fallen utility tree blocks a critical junction on Adeola Odeku St, taking down power lines. Within seconds, a verified neighbor flags it on the map. Sentinel AI validates the report and automatically broadcasts a high-priority alert to neighbors within a 500m radius. No noisy WhatsApp spams, just real-time, actionable local intelligence.",
    color: "#FF5E13", // bright afternoon orange
    icon: <SunDim size={24} color="#FF5E13" />,
    mockup: {
      header: "Sentinel AI Broadcast",
      body: "⚠️ [Radius: 500m] Grid Outage & Blockage on Adeola Odeku St. Power crew dispatched.",
      type: "alert",
      bg: "linear-gradient(135deg, rgba(255, 94, 19, 0.15) 0%, rgba(15, 19, 26, 0.8) 100%)"
    }
  },
  {
    id: "night",
    time: "10:00 PM",
    title: "Night Patrol & Safe Trip Check-in",
    subtitle: "Zero-Lag Community Safety",
    desc: "Ngozi is heading home from Lekki. She activates her Safe Trip Check-in. As she moves, Sentinel AI monitors her route telemetry. If she detours or takes abnormally long, her co-signed 'Verified Guardians' are instantly alerted with her coordinates. Neighbors become true first responders, keeping the community safe when seconds count.",
    color: "#6C5DD3", // cool night purple
    icon: <Moon size={24} color="#6C5DD3" />,
    mockup: {
      header: "Safe Trip Patrol",
      body: "🔒 Traveler Ngozi is in transit. 15 local Guardians active. Location sharing enabled.",
      type: "safety",
      bg: "linear-gradient(135deg, rgba(108, 93, 211, 0.15) 0%, rgba(15, 19, 26, 0.8) 100%)"
    }
  }
];

export function DayInTheHuud() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const phase = PHASES[activePhaseIndex];

  return (
    <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "3rem", padding: "clamp(32px, 8vw, 60px)", marginTop: "60px", position: "relative", overflow: "hidden" }}>
      
      {/* Background radial highlight */}
      <div 
        style={{ 
          position: "absolute", 
          top: "-50%", 
          right: "-50%", 
          width: "600px", 
          height: "600px", 
          background: `radial-gradient(circle, ${phase.color}15 0%, rgba(0,0,0,0) 70%)`, 
          pointerEvents: "none",
          transition: "background 0.5s ease"
        }}
      ></div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "48px", flexWrap: "wrap" }}>
        {PHASES.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setActivePhaseIndex(idx)}
            className={`day-tab-btn ${activePhaseIndex === idx ? "active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: activePhaseIndex === idx ? "rgba(255,255,255,0.05)" : "transparent",
              border: `1px solid ${activePhaseIndex === idx ? "var(--border-subtle)" : "transparent"}`,
              padding: "12px 24px",
              borderRadius: "99px",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {p.icon}
            <span>{p.time}</span>
          </button>
        ))}
      </div>

      {/* Content layout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "60px", alignItems: "center" }}
        >
          {/* Story Text (Left) */}
          <div>
            <div style={{ color: phase.color, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              <span>{phase.subtitle}</span>
            </div>
            
            <h3 className="text-display-large" style={{ marginBottom: "24px", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
              {phase.title}
            </h3>
            
            <p className="text-editorial" style={{ fontSize: "1.15rem", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "32px" }}>
              {phase.desc}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-main)", fontWeight: 800, fontSize: "0.95rem" }}>
              <span>Experience full security</span>
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Styled Notification Mockup (Right) */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div 
              style={{ 
                width: "100%", 
                maxWidth: "400px", 
                borderRadius: "2rem", 
                padding: "24px", 
                background: phase.mockup.bg,
                border: `1px solid ${phase.color}30`, 
                boxShadow: `0 20px 45px rgba(0, 0, 0, 0.25), 0 0 20px ${phase.color}08`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: phase.color }}></div>
                  <span style={{ fontWeight: 850, fontSize: "0.85rem", color: "white" }}>{phase.mockup.header}</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Active</span>
              </div>

              {/* Card Body */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
                {phase.mockup.type === "commerce" && <Store size={36} color="white" style={{ marginBottom: "16px", opacity: 0.8 }} />}
                {phase.mockup.type === "alert" && <AlertTriangle size={36} color="white" style={{ marginBottom: "16px", opacity: 0.8 }} />}
                {phase.mockup.type === "safety" && <ShieldCheck size={36} color="white" style={{ marginBottom: "16px", opacity: 0.8 }} />}
                
                <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.5, marginBottom: "12px" }}>
                  {phase.mockup.body}
                </p>

                <div style={{ display: "flex", justifyItems: "center", gap: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <span>Victoria Island Core GPS Feed</span>
                </div>
              </div>

              {/* Card Micro interaction */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", fontSize: "0.75rem" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Sentinel AI verification</span>
                <span style={{ color: "var(--primary)", fontWeight: 800 }}>100% SECURE</span>
              </div>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
