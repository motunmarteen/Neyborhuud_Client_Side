"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "../../styles/landing.module.css";

const LINKS = [
  { href: "#why", label: "Why NeyborHuud" },
  { href: "#feeds", label: "Feeds" },
  { href: "#safety", label: "Safety" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#teachings", label: "Learn" },
  { href: "#faq", label: "FAQ" },
  { href: "#support", label: "Support" },
];

export function SectionNavMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();
  const triggerId = `${panelId}-trigger`;

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.navMenu} ref={rootRef}>
      <button
        id={triggerId}
        type="button"
        className={styles.navMenuTrigger}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Your <span className={styles.navMenuHuud}>Huud</span>
        <span
          className={`material-symbols-outlined ${styles.navMenuTriggerIcon}`}
          aria-hidden
        >
          expand_more
        </span>
      </button>
      {open ? (
        <div id={panelId} className={styles.navMenuPanel}>
          <nav aria-label="NeyborHuud on this page">
            {LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.navMenuLink}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
