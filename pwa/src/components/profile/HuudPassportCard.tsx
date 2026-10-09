'use client';

import React from 'react';
import Link from 'next/link';

export interface HuudPassportProps {
  passport: {
    userId: string;
    userName: string;
    avatarUrl?: string;
    communityName: string;
    lga: string;
    state: string;
    maskedPostcode: string;
    addressProofLevel: number;
    addressProofLevelName: string;
    residenceTenureMonths: number;
    trustScore: number;
    verificationDate: string;
    qrPayload: string;
    qrHash: string;
  };
  onShare?: () => void;
}

export function HuudPassportCard({ passport, onShare }: HuudPassportProps) {
  const tenureDisplay =
    passport.residenceTenureMonths >= 12
      ? `${Math.floor(passport.residenceTenureMonths / 12)} yr, ${passport.residenceTenureMonths % 12} mos`
      : `${passport.residenceTenureMonths} months`;

  const formattedDate = new Date(passport.verificationDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-[#0B0E11] p-6 text-white shadow-2xl border border-emerald-500/20">

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Huud Passport
            </h3>
            <p className="text-[10px] text-emerald-200/60 font-medium tracking-wide">
              NIPOST NDAPS • Verified Residence
            </p>
          </div>
        </div>
        <div className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
          Official
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mt-5 space-y-4">
        {/* Name & Community */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
            Resident Name
          </p>
          <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
            {passport.userName}
          </h2>
          <p className="text-xs text-emerald-200/80 font-medium">
            {passport.communityName}, {passport.lga}, {passport.state}
          </p>
        </div>

        {/* Masked Digital Postcode Card */}
        <div className="rounded-2xl bg-black/40 p-3.5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/70">
              Physical Building ID (NIPOST NDAPS)
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Masked GIS
            </span>
          </div>
          <p className="font-mono text-base font-black tracking-wider text-emerald-300 mt-1">
            {passport.maskedPostcode}
          </p>
          <p className="text-[9px] text-emerald-200/50 mt-1">
            Building-level GIS reference. Exact number reserved for emergency dispatch & private escrow.
          </p>
        </div>

        {/* Verification Ladder Tier & Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-950/40 p-2.5 border border-emerald-500/10">
            <p className="text-[9px] font-bold uppercase text-emerald-300/60">Proof Level</p>
            <p className="text-xs font-black text-emerald-200 mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
              L{passport.addressProofLevel} Verified
            </p>
            <p className="text-[8px] text-emerald-200/50 mt-0.5 truncate">
              {passport.addressProofLevelName}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-950/40 p-2.5 border border-emerald-500/10">
            <p className="text-[9px] font-bold uppercase text-emerald-300/60">Trust Score</p>
            <p className="text-xs font-black text-emerald-200 mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-400">bolt</span>
              {passport.trustScore} Pts
            </p>
            <p className="text-[8px] text-emerald-200/50 mt-0.5">
              Tenure: {tenureDisplay}
            </p>
          </div>
        </div>

        {/* Cryptographic QR / Verification Hash */}
        <div className="flex items-center justify-between rounded-xl bg-black/30 p-2.5 border border-emerald-500/10 text-[9px]">
          <div className="space-y-0.5">
            <p className="text-emerald-300/60 font-semibold">Verification Seal</p>
            <p className="font-mono text-[8px] text-emerald-200/40">
              HASH: {passport.qrHash.slice(0, 16)}...
            </p>
            <p className="text-[8px] text-emerald-200/40">Issued: {formattedDate}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">
            <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {onShare ? (
        <div className="mt-5 pt-3 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={onShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-[#040e09] py-2.5 text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Share Verification Proof
          </button>
        </div>
      ) : null}
    </div>
  );
}
