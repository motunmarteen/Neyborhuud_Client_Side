"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "../../styles/landing.module.css";

export function StickySignupBar({ appHref }) {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="neyborhuud-sticky-cta"
          className={styles.stickyBar}
          initial={reduce ? false : { y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0 } }
              : { y: 120, opacity: 0 }
          }
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          role="region"
          aria-label="Open app"
        >
          <p className={styles.stickyBarText}>
            <strong>NeyborHuud</strong> is live — claim your Huud in minutes.
          </p>
          <div className={styles.stickyBarActions}>
            <a
              href={appHref}
              className={styles.stickyBarPrimary}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open app
            </a>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
