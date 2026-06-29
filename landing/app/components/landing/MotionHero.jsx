"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "../../styles/landing.module.css";

const easeOut = [0.22, 1, 0.36, 1];

/** Full-viewport hero: doodle background + copy (no mockups). */
export function MotionHero({
  eyebrow,
  title,
  lead,
  note,
  signupHref,
  exploreHref,
}) {
  const reduce = useReducedMotion();

  const instant = reduce ? { duration: 0 } : undefined;

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroPhoto} aria-hidden />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <motion.p
            className={styles.eyebrowOnPhoto}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut, ...instant }}
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            id="hero-heading"
            className={styles.heroTitleOnPhoto}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: reduce ? 0 : 0.04, ease: easeOut }}
          >
            {title}
          </motion.h1>
          <motion.p
            className={styles.heroLeadOnPhoto}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: reduce ? 0 : 0.1, ease: easeOut }}
          >
            {lead}
          </motion.p>
          <motion.div
            className={styles.heroActions}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.16, ease: easeOut }}
          >
            <motion.a
              href={signupHref}
              className={styles.btnPrimary}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={reduce ? undefined : { scale: 0.97 }}
              whileHover={reduce ? undefined : { y: -2 }}
            >
              Create free account
            </motion.a>
            <motion.a
              href={exploreHref}
              className={styles.btnSecondaryOnPhoto}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              whileHover={reduce ? undefined : { y: -1 }}
            >
              See how it works
            </motion.a>
          </motion.div>
          <motion.p
            className={styles.heroNoteOnPhoto}
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : 0.28 }}
          >
            {note}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
