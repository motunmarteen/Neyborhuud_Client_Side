'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Radar,
  ShoppingBag,
  Siren,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';

const FEATURE_CARDS = [
  {
    id: 'radar',
    icon: Radar,
    badge: 'Spatial Intelligence',
    title: 'Street Radar (500m)',
    description: 'Instant live updates on power, road blockages, and community safety within walking distance.',
    eli5: 'A magical sensor showing what is happening on your street right now up to 500 meters away.',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accentColor: '#00D431',
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    badge: 'Zero-Escrow P2P',
    title: 'Neighborhood Commerce',
    description: 'Trade solar inverters, electronics, and hire verified artisans face-to-face with zero platform fees.',
    eli5: 'We do not touch your money! You pay your neighbor directly face-to-face only after you see what you are buying.',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    accentColor: '#1A56FF',
  },
  {
    id: 'sentinel',
    icon: Siren,
    badge: 'Guardian System',
    title: 'Emergency SOS Sentinel',
    description: 'Silent panic button with 5-second cancel, direct estate guard dispatch, and 500m resident fanout.',
    eli5: 'Your emergency red button! Press it if you are in danger to quietly call estate security for help.',
    gradient: 'from-rose-500/20 via-orange-500/10 to-transparent',
    accentColor: '#FF3B30',
  },
  {
    id: 'trustos',
    icon: ShieldCheck,
    badge: 'Sovereign Trust',
    title: 'Digital Huud Passport',
    description: 'Verifiable physical building address via NIPOST NDAPS without exposing your private street number.',
    eli5: 'A secret 11-letter code for your building. It proves you live here without telling strangers your house number.',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    accentColor: '#F59E0B',
  },
];

export default function WelcomePage() {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const activeFeature = FEATURE_CARDS[activeFeatureIndex];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F4F7F5] dark:bg-[#0B0E11] text-[#111814] dark:text-white transition-colors duration-300 selection:bg-[#00D431]/20 overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00D431]/15 dark:bg-[#00D431]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-lg mx-auto px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00D431] flex items-center justify-center shadow-lg shadow-[#00D431]/30">
            <span className="font-extrabold text-black text-xl tracking-tighter">N</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight dark:text-white text-[#111814]">
              Neybor<span className="text-[#00D431]">Huud</span>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5E52] dark:text-white/50">
              Community Operating System
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md hover:bg-black/[0.04] dark:hover:bg-white/[0.12] transition-all active:scale-95"
        >
          Sign In
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
        {/* 3D Visual Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full aspect-square max-h-[340px] rounded-3xl overflow-hidden p-1 border border-black/[0.06] dark:border-white/[0.1] bg-white/60 dark:bg-[#14181D]/80 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/70 mb-5 group"
        >
          <div className="relative w-full h-full rounded-[22px] overflow-hidden">
            <Image
              src="/images/auth-hero.jpg"
              alt="3D Futuristic Smart Neighborhood at Night"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Live Status Chip on 3D Card */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#00D431] animate-bc-halo" />
              <span className="text-[11px] font-bold tracking-wide text-white">
                Lagos Pilot Zones Live
              </span>
            </div>

            {/* Bottom Caption Inside Image */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-1.5 text-[#00D431] text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles size={12} strokeWidth={2.2} />
                <span>Verified Neighborhood Defense</span>
              </div>
              <p className="text-white text-sm font-semibold leading-snug drop-shadow-md">
                Lekki Phase 1 • VGC • Magodo Phase 2 • Ikeja GRA
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature Interactive Card Tabs */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5E52] dark:text-white/40">
              Platform Pillars
            </span>
            <div className="flex gap-1.5">
              {FEATURE_CARDS.map((feat, idx) => (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeatureIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeFeatureIndex
                      ? 'w-6 bg-[#00D431]'
                      : 'w-2 bg-black/15 dark:bg-white/20'
                  }`}
                  aria-label={`Slide to ${feat.title}`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className={`p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#14181D]/80 backdrop-blur-xl shadow-lg relative overflow-hidden`}
            >
              {/* Subtle ambient gradient splash */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeFeature.gradient} rounded-full blur-2xl pointer-events-none`} />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                    style={{ backgroundColor: `${activeFeature.accentColor}20`, color: activeFeature.accentColor }}
                  >
                    <activeFeature.icon size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5E52] dark:text-white/50">
                        {activeFeature.badge}
                      </span>
                      <Eli5Tooltip
                        title={activeFeature.title}
                        explanation={activeFeature.eli5}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-[#111814] dark:text-white">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[#4B5E52] dark:text-white/70 relative z-10">
                {activeFeature.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <Link
            href="/signup"
            className="group w-full py-3.5 px-6 rounded-2xl bg-[#00D431] hover:bg-[#00FF3E] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D431]/25 transition-all duration-200 active:scale-[0.98]"
          >
            <span>Claim Your Resident ID</span>
            <ArrowRight size={16} strokeWidth={2.4} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/explore"
            className="w-full py-3 px-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.05] backdrop-blur-md text-[#111814] dark:text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.1] transition-all active:scale-[0.98]"
          >
            <span>Explore Public Huud Radar</span>
          </Link>
        </div>
      </main>

      {/* Footer Guarantees */}
      <footer className="relative z-10 w-full max-w-lg mx-auto px-5 py-4 flex items-center justify-center gap-6 text-[11px] font-semibold text-[#4B5E52] dark:text-white/40">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} strokeWidth={2} className="text-[#00D431]" />
          <span>₦0.00 Platform Fee</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={13} strokeWidth={2} className="text-[#00D431]" />
          <span>AES-256 Encrypted GPS</span>
        </div>
      </footer>
    </div>
  );
}
