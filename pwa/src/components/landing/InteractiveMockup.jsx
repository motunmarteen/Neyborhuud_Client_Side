"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MapPin, Store, Bell, Lock, Map, Zap, CheckCircle2, Star, Search, Wifi, Battery, Signal, UserCheck, ShieldAlert } from "lucide-react";

export function InteractiveMockup() {
  const [activeTab, setActiveTab] = useState("feed"); // feed, safety, marketplace
  const [radius, setRadius] = useState(500); // 100, 500, 1000 meters
  const [vouched, setVouched] = useState(false);
  const [vouchCount, setVouchCount] = useState(24);
  const [dealStep, setDealStep] = useState(0); // 0: Idle, 1: Paid, 2: Confirmed, 3: Completed
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);

  // SOS Countdown logic
  useEffect(() => {
    let interval;
    if (sosActive && sosCountdown > 0) {
      interval = setInterval(() => {
        setSosCountdown((prev) => prev - 1);
      }, 1000);
    } else if (sosCountdown === 0) {
      // Keep it active but stopped at 0
    }
    return () => clearInterval(interval);
  }, [sosActive, sosCountdown]);

  const triggerSos = () => {
    setSosActive(true);
    setSosCountdown(5);
  };

  const cancelSos = () => {
    setSosActive(false);
    setSosCountdown(5);
  };

  // Mock post listings based on radius
  const feedPosts = [
    { id: 1, author: "Adebayo O.", dist: 150, title: "⚠️ Fallen Utility Pole", body: "Adeola Odeku St is partially blocked due to a fallen pole. Power is out. Electricians have been notified.", tag: "safety" },
    { id: 2, author: "Fatima Y.", dist: 350, title: "🛒 Fresh Homebakes Available", body: "Sourdough bread and cinnamon rolls fresh out of the oven! Free delivery within 500m.", tag: "marketplace" },
    { id: 3, author: "Chinedu A.", dist: 800, title: "💡 Power Restored in Lekki Phase 1", body: "EKEDC just turned on the lights. Enjoy it while it lasts!", tag: "update" }
  ];

  const filteredPosts = feedPosts.filter(post => post.dist <= radius);

  return (
    <div className={`device-container ${sosActive ? "sos-active" : ""}`} style={{ margin: "0 auto" }}>
      <div className="device-screen">
        {/* SOS Alarm Screen Overlay */}
        <AnimatePresence>
          {sosActive && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="sos-overlay"
            >
              <ShieldAlert size={64} color="white" style={{ marginBottom: "20px", animation: "pulse 1s infinite" }} />
              <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "10px" }}>SOS TRIGGERED</h2>
              <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "24px", lineHeight: "1.5" }}>
                Broadcasting your live location and verified identity to 15 nearest emergency guardians.
              </p>
              
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "50%", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "30px", border: "2px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "3rem", fontWeight: 950 }}>{sosCountdown}</span>
              </div>
              
              <div style={{ width: "100%", textAlign: "left", padding: "16px", background: "rgba(0,0,0,0.15)", borderRadius: "12px", fontSize: "0.8rem", fontFamily: "monospace", marginBottom: "30px" }}>
                <div>&gt; GPS Coords locked: 6.4281° N, 3.4219° E</div>
                <div>&gt; Dispatching Guardian broadcast...</div>
                {sosCountdown === 0 ? (
                  <div style={{ color: "#00FF66", fontWeight: "bold" }}>&gt; Alerts Sent. First responders notified.</div>
                ) : (
                  <div>&gt; Sending in {sosCountdown}s...</div>
                )}
              </div>

              <button 
                onClick={cancelSos} 
                className="btn-glass-primary" 
                style={{ background: "white", color: "var(--brand-red)", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.2)", fontSize: "0.85rem", width: "100%" }}
              >
                CANCEL SOS
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Phone Status Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px 6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", zIndex: 10 }}>
          <div style={{ fontWeight: 800 }}>13:20</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={14} />
          </div>
        </div>

        {/* 2. Device Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0, 212, 49, 0.15)", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid rgba(0, 212, 49, 0.3)" }}>
              <MapPin size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "white" }}>Victoria Island, Lagos</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 500 }}>1,240 verified neighbors</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Search size={18} color="rgba(255,255,255,0.4)" />
            <div style={{ position: "relative" }}>
              <Bell size={18} color="rgba(255,255,255,0.4)" />
              <div style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, background: "var(--brand-red)", borderRadius: "50%" }}></div>
            </div>
          </div>
        </div>

        {/* 3. Screen Body (Scrollable Panel) */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", zIndex: 10, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {activeTab === "feed" && (
            <>
              {/* Radius Filter dial widget */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Feed Radius</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: 800 }}>{radius >= 1000 ? "1.0 km" : `${radius}m`}</span>
                </div>
                <div className="range-slider-wrapper">
                  <input 
                    type="range" 
                    min="200" 
                    max="1000" 
                    step="400" 
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="radius-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: "6px", padding: "0 2px" }}>
                    <span>200m</span>
                    <span>500m</span>
                    <span>1.0km</span>
                  </div>
                </div>
              </div>

              {/* Feed posts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredPosts.map((post) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post.id} 
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                       <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "white" }}>{post.author}</span>
                      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "99px" }}>{post.dist}m away</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: post.tag === "safety" ? "var(--brand-red)" : "white", marginBottom: "4px" }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: "1.4" }}>
                      {post.body}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {activeTab === "safety" && (
            <>
              {/* Safe Trip Check-in Mock */}
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-blue)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <UserCheck size={16} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "white" }}>Ngozi A. • Safe Trip Check-in</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Lekki Toll Gate → Victoria Island</div>
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
                    <span>Trip Progress</span>
                    <span>85% complete</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: "85%", height: "100%", background: "var(--brand-blue)" }}></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>
                    <span style={{ fontWeight: 800, color: "white", display: "block" }}>{vouchCount} Verified Vouch circles</span>
                    Patrolling guardians ready to alert on detour
                  </div>
                  <button 
                    onClick={() => {
                      if (!vouched) {
                        setVouched(true);
                        setVouchCount(prev => prev + 1);
                      }
                    }}
                    style={{ 
                      background: vouched ? "rgba(0, 212, 49, 0.15)" : "var(--primary)", 
                      color: vouched ? "var(--primary)" : "white",
                      border: "none", 
                      padding: "6px 12px", 
                      borderRadius: "8px", 
                      fontSize: "0.65rem", 
                      fontWeight: 800,
                      cursor: vouched ? "default" : "pointer",
                      boxShadow: vouched ? "none" : "0 4px 10px rgba(0, 212, 49, 0.3)"
                    }}
                  >
                    {vouched ? "VOUCHED" : "VOUCH"}
                  </button>
                </div>
              </div>

              {/* Map Preview Widget */}
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px", position: "relative", height: "140px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Map size={80} color="rgba(255,255,255,0.08)" style={{ position: "absolute" }} />
                <div style={{ zIndex: 1, textAlign: "center" }}>
                  <div style={{ width: "12px", height: "12px", background: "var(--brand-blue)", borderRadius: "50%", margin: "0 auto 8px", boxShadow: "0 0 10px var(--brand-blue)", animation: "pulse 2s infinite" }}></div>
                  <div style={{ fontSize: "0.75rem", color: "white", fontWeight: 700 }}>Tracking Live Path...</div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Sentinel AI analyzing telemetry</div>
                </div>
              </div>
            </>
          )}

          {activeTab === "marketplace" && (
            <>
              {/* Product listings */}
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "white" }}>Honda generator 2.5KVA</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>₦180,000</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
                  Seller: Tunde F. (Trust Score: 95) • 350m away
                </div>

                {/* Interactive Deal Pipeline */}
                <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>Deal Progress</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { step: 1, label: "Buyer and seller agree on price" },
                      { step: 2, label: "Buyer pays and marks \"I've Paid\"" },
                      { step: 3, label: "Seller confirms receipt" }
                    ].map((s) => (
                      <div 
                        key={s.step} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          fontSize: "0.65rem", 
                          color: dealStep >= s.step ? "var(--primary)" : "rgba(255,255,255,0.3)" 
                        }}
                      >
                        <div style={{ 
                          width: "16px", 
                          height: "16px", 
                          borderRadius: "50%", 
                          background: dealStep >= s.step ? "rgba(0, 212, 49, 0.15)" : "rgba(255,255,255,0.05)", 
                          border: `1px solid ${dealStep >= s.step ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontSize: "0.55rem",
                          fontWeight: "bold"
                        }}>
                          {dealStep >= s.step ? "✓" : s.step}
                        </div>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDealStep((prev) => (prev < 3 ? prev + 1 : 0));
                  }}
                  className="btn-glass-primary"
                  style={{ width: "100%", fontSize: "0.75rem", padding: "10px" }}
                >
                  {dealStep === 0 && "MARK AS AGREED"}
                  {dealStep === 1 && "SIMULATE PAYMENT SENT"}
                  {dealStep === 2 && "CONFIRM RECEIPT"}
                  {dealStep === 3 && "DEAL COMPLETE (RESET)"}
                </button>
              </div>
            </>
          )}

        </div>

        {/* 4. Floating SOS Button Trigger */}
        <div style={{ position: "absolute", bottom: "75px", right: "20px", zIndex: 30 }}>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={triggerSos}
            style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "50%", 
              background: "var(--brand-red)", 
              color: "white", 
              border: "none", 
              boxShadow: "0 8px 24px rgba(255,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer" 
            }}
          >
            <ShieldAlert size={28} />
          </motion.button>
        </div>

        {/* 5. Device Bottom Navigation Tabs */}
        <div style={{ display: "flex", background: "rgba(10, 15, 25, 0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 0 16px", zIndex: 20 }}>
          {[
            { id: "feed", label: "Local Feed", icon: <MapPin size={18} /> },
            { id: "safety", label: "Safety SOS", icon: <ShieldCheck size={18} /> },
            { id: "marketplace", label: "Huud Trade", icon: <Store size={18} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                flex: 1, 
                background: "transparent", 
                border: "none", 
                color: activeTab === tab.id ? "var(--primary)" : "rgba(255,255,255,0.4)",
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                gap: "4px", 
                fontSize: "0.65rem", 
                fontWeight: 700,
                cursor: "pointer",
                transition: "color 0.2s ease"
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
