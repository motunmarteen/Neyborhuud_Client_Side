"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";

const TERMINAL_LOGS = [
  { text: "sys_init: Loading Sentinel AI Threat Analysis Kernel...", type: "system" },
  { text: "net_socket: Connecting to Lagos Hyperlocal Core...", type: "system" },
  { text: "sentinel_ai: Scanning Lekki / Victoria Island coord bounds...", type: "info" },
  { text: "sentinel_ai: 1,240 verified nodes (neighbors) registered.", type: "success" },
  { text: "sentinel_ai: Checking active Safe Trip routes...", type: "info" },
  { text: "sentinel_ai: Route ID #872 active. Traveler 'Ngozi A.' is in transit.", type: "info" },
  { text: "alert: Event detected on Adeola Odeku St - 'Roadblock: fallen utility pole'", type: "warning" },
  { text: "sentinel_ai: Auto-escalated to local feed. Radius priority set to 500m.", type: "success" },
  { text: "sentinel_ai: Broadcast successful. 89 neighbors notified.", type: "success" },
  { text: "sentinel_ai: Monitoring chatter bounds for local fraud signatures...", type: "info" },
  { text: "escrow_patrol: Verified trade #927 (Honda Generator) - Buyer funds locked.", type: "success" },
  { text: "sentinel_ai: All systems green. Patrol active.", type: "success" }
];

export function IntelTerminal() {
  const [lines, setLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const bodyRef = useRef(null);

  useEffect(() => {
    if (currentLineIndex >= TERMINAL_LOGS.length) {
      const timer = setTimeout(() => {
        setLines([]);
        setCurrentLineIndex(0);
        setTypedText("");
      }, 5000);
      return () => clearTimeout(timer);
    }

    const currentLog = TERMINAL_LOGS[currentLineIndex];
    let charIndex = 0;
    setTypedText("");

    const typingInterval = setInterval(() => {
      if (charIndex < currentLog.text.length) {
        setTypedText((prev) => prev + currentLog.text.charAt(charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setLines((prev) => [...prev, currentLog]);
        setCurrentLineIndex((prev) => prev + 1);
      }
    }, 20);

    return () => {
      clearInterval(typingInterval);
    };
  }, [currentLineIndex]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, typedText]);

  const getLogColorClass = (type) => {
    switch (type) {
      case "system":
        return "rgba(255, 255, 255, 0.4)";
      case "info":
        return "var(--brand-blue)";
      case "warning":
        return "var(--brand-red)";
      case "success":
        return "var(--primary)";
      default:
        return "#a3b8cc";
    }
  };

  const getPromptSymbol = (type) => {
    if (type === "warning") return "⚡ ";
    return "> ";
  };

  return (
    <div className="terminal-window" style={{ width: "100%" }}>
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: "#ff5f56" }}></div>
        <div className="terminal-dot" style={{ background: "#ffbd2e" }}></div>
        <div className="terminal-dot" style={{ background: "#27c93f" }}></div>
        <div style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em" }}>
          <Terminal size={14} color="var(--primary)" />
          <span>SENTINEL-AI_SHELL_v1.0.4</span>
        </div>
      </div>
      <div ref={bodyRef} className="terminal-body custom-scrollbar">
        {lines.map((line, idx) => (
          <div key={idx} style={{ marginBottom: "8px", color: getLogColorClass(line.type), fontWeight: line.type === "warning" ? "bold" : "normal" }}>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{getPromptSymbol(line.type)}</span>
            <span>{line.text}</span>
          </div>
        ))}
        {currentLineIndex < TERMINAL_LOGS.length && (
          <div style={{ color: getLogColorClass(TERMINAL_LOGS[currentLineIndex].type), fontWeight: TERMINAL_LOGS[currentLineIndex].type === "warning" ? "bold" : "normal" }}>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{getPromptSymbol(TERMINAL_LOGS[currentLineIndex].type)}</span>
            <span>{typedText}</span>
            <span style={{ display: "inline-block", width: "8px", height: "15px", background: "currentColor", marginLeft: "4px", animation: "blink 1s step-end infinite" }}></span>
          </div>
        )}
      </div>
    </div>
  );
}
