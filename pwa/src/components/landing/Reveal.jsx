"use client";

import { motion, useReducedMotion } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={
        reduce
          ? undefined
          : { once, amount: 0.08, margin: "0px 0px 160px 0px" }
      }
      transition={{
        duration: reduce ? 0 : 0.55,
        delay: reduce ? 0 : delay,
        ease: easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}
