"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MapPin, Store, Bell, Lock, Zap, CheckCircle2, Star, Plus, ShieldAlert, Award, ArrowRight } from "lucide-react";

export function InteractiveCards() {
  // Card 1: HuudCoin state
  const [coins, setCoins] = useState(25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);

  // Card 2: Vouching state
  const [vouched, setVouched] = useState(false);
  const [trustScore, setTrustScore] = useState(92);
  const [vouches, setVouches] = useState(12);

  // Card 3: Radius Dial state
  const [cardRadius, setCardRadius] = useState(500);

  // Card 4: Escrow state
  const [escrowStep, setEscrowStep] = useState(1);

  // Card 5: Tab state
  const [activeBoardTab, setActiveBoardTab] = useState("municipal");

  // Coin spin trigger
  const spinCoin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setCoins((c) => c + 1);
    
    // Add floating text
    const textId = Date.now();
    setFloatingTexts((prev) => [...prev, { id: textId, x: Math.random() * 60 - 30, y: Math.random() * 20 - 40 }]);
    
    setTimeout(() => {
      setIsSpinning(false);
    }, 800);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== textId));
    }, 1500);
  };

  const getRadiusDetails = (rad) => {
    switch (rad) {
      case 100: return { count: 18, desc: "Immediate street neighbors" };
      case 500: return { count: 310, desc: "Local block & marketplace radius" };
      case 1000: return { count: 1240, desc: "Full neighborhood perimeter" };
      default: return { count: 310, desc: "Local block & marketplace radius" };
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "30px", marginTop: "40px" }}>
      
      {/* 1. HuudCoin Spin Card */}
      <div className="glass-premium glow-card" style={{ padding: "32px", borderRadius: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "320px", position: "relative" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 212, 49, 0.1)", border: "1px solid rgba(0, 212, 49, 0.2)", padding: "4px 12px", borderRadius: "99px", marginBottom: "16px" }}>
            <Award size={14} color="var(--primary)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", uppercase: "true" }}>REWARDS</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>HuudCoins Hub</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Earn coins for submitting verified road updates, safety alerts, or helping neighbors. Redeem for local marketplace boosts.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "24px" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={spinCoin}>
            {/* Spinning Coin */}
            <motion.div
              animate={isSpinning ? { rotateY: 360 } : { rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                border: "4px solid #FFF",
                boxShadow: "0 8px 24px rgba(255, 165, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: 900,
                color: "white"
              }}
            >
              ₦
            </motion.div>
            
            {/* Floating text triggers */}
            <AnimatePresence>
              {floatingTexts.map((text) => (
                <motion.div
                  key={text.id}
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: text.y, scale: 1.1 }}
                  exit={{ opacity: 0, y: text.y - 20 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${text.x}px)`,
                    top: "0px",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    color: "var(--primary)",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    pointerEvents: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  +1 HuudCoin
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Your Balance</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-main)", display: "flex", alignItems: "baseline", gap: "4px" }}>
              {coins}
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>HC</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(0, 212, 49, 0.8)", fontWeight: 700 }}>Tap coin to collect daily reward!</div>
          </div>
        </div>
      </div>

      {/* 2. Trust Vouching Simulator Card */}
      <div className="glass-premium glow-card" style={{ padding: "32px", borderRadius: "2rem", display: "flex", flexDirection: "column", justifyContext: "space-between", minHeight: "320px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 0, 255, 0.1)", border: "1px solid rgba(0, 0, 255, 0.2)", padding: "4px 12px", borderRadius: "99px", marginBottom: "16px" }}>
            <Lock size={14} color="var(--brand-blue)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand-blue)", letterSpacing: "0.05em", uppercase: "true" }}>TRUSTOS</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>Hyperlocal Vouching</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Real identities, verified by NIN/BVN and co-signed by neighbors. Vouching helps build a bulletproof local web of trust.
          </p>
        </div>

        <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "16px", marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundGradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: "bold" }}>FY</div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  Fatima Y.
                  <ShieldCheck size={14} color="var(--primary)" />
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Lekki Resident</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>Trust Score</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-main)" }}>{trustScore}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Vouched by {vouches} neighbors</span>
            <button 
              onClick={() => {
                if (!vouched) {
                  setVouched(true);
                  setTrustScore((s) => s + 1);
                  setVouches((v) => v + 1);
                }
              }}
              style={{
                background: vouched ? "rgba(0, 212, 49, 0.15)" : "var(--brand-blue)",
                color: vouched ? "var(--primary)" : "white",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.7rem",
                fontWeight: 800,
                cursor: vouched ? "default" : "pointer"
              }}
            >
              {vouched ? "Vouched ✓" : "Vouch"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Radius Dial Card */}
      <div className="glass-premium glow-card" style={{ padding: "32px", borderRadius: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "320px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 212, 49, 0.1)", border: "1px solid rgba(0, 212, 49, 0.2)", padding: "4px 12px", borderRadius: "99px", marginBottom: "16px" }}>
            <MapPin size={14} color="var(--primary)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", uppercase: "true" }}>CASCADING RADIUS</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>Perimeter Control</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Expand or shrink your feed to see what is happening. Keep it ultra-local within 100m, or check the whole neighborhood up to 1km.
          </p>
        </div>

        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", gap: "8px", background: "var(--bg-main)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
            {[100, 500, 1000].map((r) => (
              <button 
                key={r}
                onClick={() => setCardRadius(r)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: pointer => "pointer",
                  background: cardRadius === r ? "var(--primary)" : "transparent",
                  color: cardRadius === r ? "white" : "var(--text-muted)",
                  transition: "background 0.2s, color 0.2s"
                }}
              >
                {r >= 1000 ? "1.0km" : `${r}m`}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", padding: "12px 16px", borderRadius: "12px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main)" }}>
                {getRadiusDetails(cardRadius).count} Neighbors
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                {getRadiusDetails(cardRadius).desc}
              </div>
            </div>
            <Zap size={20} color="var(--primary)" />
          </div>
        </div>
      </div>

      {/* 4. Social Escrow Step-Tracker Card */}
      <div className="glass-premium glow-card grid-span-2-md" style={{ padding: "32px", borderRadius: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "320px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 0, 255, 0.1)", border: "1px solid rgba(0, 0, 255, 0.2)", padding: "4px 12px", borderRadius: "99px", marginBottom: "16px" }}>
            <Store size={14} color="var(--brand-blue)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand-blue)", letterSpacing: "0.05em", uppercase: "true" }}>ESCROW PROTECTION</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>Zero-Scam Social Escrow</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Buying a generator or hiring a local plumber? Funds remain safely locked in the TrustOS Vault until you verify receipt. No scams. Period.
          </p>
        </div>

        <div style={{ marginTop: "24px" }}>
          {/* Stepper progress bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: "16px", padding: "0 10px" }}>
            <div style={{ position: "absolute", left: "10%", right: "10%", height: "2px", background: "rgba(0,0,0,0.1)", zIndex: 1 }}>
              <div style={{ width: `${(escrowStep - 1) * 50}%`, height: "100%", background: "var(--brand-blue)", transition: "width 0.3s ease" }}></div>
            </div>

            {[
              { s: 1, label: "Deposit" },
              { s: 2, label: "Dispatch" },
              { s: 3, label: "Release" }
            ].map((step) => (
              <div 
                key={step.s} 
                onClick={() => setEscrowStep(step.s)}
                style={{ 
                  zIndex: 2, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                <div style={{ 
                  width: "28px", 
                  height: "28px", 
                  borderRadius: "50%", 
                  background: escrowStep >= step.s ? "var(--brand-blue)" : "var(--bg-card)", 
                  border: `2px solid ${escrowStep >= step.s ? "var(--brand-blue)" : "rgba(0,0,0,0.1)"}`,
                  color: escrowStep >= step.s ? "white" : "var(--text-muted)",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.3s, border-color 0.3s, color 0.3s"
                }}>
                  {step.s}
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: escrowStep >= step.s ? "var(--text-main)" : "var(--text-muted)" }}>{step.label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "12px 16px", minHeight: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              {escrowStep === 1 && "Buyer places ₦180,000 in Social Escrow Hold. Funds are locked."}
              {escrowStep === 2 && "Seller dispatches dispatch rider. Sentinel AI tracks trip status."}
              {escrowStep === 3 && "Buyer inspects the generator, enters verification PIN, and funds release to seller."}
            </div>
            <ArrowRight size={18} color="var(--brand-blue)" style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* 5. Hyperlocal Community Board Card */}
      <div className="glass-premium glow-card" style={{ padding: "32px", borderRadius: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "320px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 212, 49, 0.1)", border: "1px solid rgba(0, 212, 49, 0.2)", padding: "4px 12px", borderRadius: "99px", marginBottom: "16px" }}>
            <Bell size={14} color="var(--primary)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", uppercase: "true" }}>LIVE UPDATES</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>Community Intel</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Stay updated with real-time neighborhood intelligence. No clutter, no noise, just pure localized facts.
          </p>
        </div>

        <div style={{ marginTop: "24px" }}>
          {/* Internal Tabs */}
          <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px", marginBottom: "12px" }}>
            <button 
              onClick={() => setActiveBoardTab("municipal")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 800,
                color: activeBoardTab === "municipal" ? "var(--text-main)" : "var(--text-muted)",
                cursor: "pointer",
                paddingBottom: "6px",
                borderBottom: activeBoardTab === "municipal" ? "2px solid var(--primary)" : "none"
              }}
            >
              Alerts
            </button>
            <button 
              onClick={() => setActiveBoardTab("community")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 800,
                color: activeBoardTab === "community" ? "var(--text-main)" : "var(--text-muted)",
                cursor: "pointer",
                paddingBottom: "6px",
                borderBottom: activeBoardTab === "community" ? "2px solid var(--primary)" : "none"
              }}
            >
              Notice Board
            </button>
          </div>

          <div style={{ minHeight: "80px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeBoardTab === "municipal" ? (
              <>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.75rem" }}>
                  <Zap size={14} color="var(--brand-red)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, display: "block", color: "var(--text-main)" }}>Grid Transformer Outage</span>
                    <span style={{ color: "var(--text-muted)" }}>Adeola Odeku St • Reported 10m ago</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.75rem" }}>
                  <ShieldAlert size={14} color="var(--brand-red)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, display: "block", color: "var(--text-main)" }}>Road Blockage: Fallen Utility Tree</span>
                    <span style={{ color: "var(--text-muted)" }}>Lekki Block A • Reported 45m ago</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.75rem" }}>
                  <Star size={14} color="var(--brand-blue)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, display: "block", color: "var(--text-main)" }}>Saturday Block Clean-up</span>
                    <span style={{ color: "var(--text-muted)" }}>Meet at Gatehouse • Sat 7:00 AM</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.75rem" }}>
                  <Award size={14} color="var(--brand-blue)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, display: "block", color: "var(--text-main)" }}>Trust Vouching Pool open</span>
                    <span style={{ color: "var(--text-muted)" }}>Earn 5 HC for verifying new arrivals</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
