'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Gift, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { EmailVerificationCard } from '@/components/auth/EmailVerificationCard';
import { toast } from 'sonner';

export function FeedEmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const isVerified = Boolean(
    (user as any)?.isEmailVerified ||
    (user as any)?.emailVerified ||
    (user as any)?.email_verified
  );

  useEffect(() => {
    if (!user || isVerified) {
      setDismissed(true);
      return;
    }
    const wasDismissed = sessionStorage.getItem('neyborhuud_dismiss_email_banner');
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, [user, isVerified]);

  if (dismissed || !user || isVerified) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('neyborhuud_dismiss_email_banner', '1');
    } catch {
      // ignore
    }
  };

  const handleVerifiedSuccess = () => {
    setShowModal(false);
    setDismissed(true);
    toast.success('Email verified! 50 HuudCredit unlocked. 🎉');
  };

  return (
    <>
      <div className="mx-3.5 sm:mx-4 p-3.5 rounded-2xl bg-white border border-[#00B82E]/25 shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#00B82E]/15 text-[#0E8A3E] flex items-center justify-center border border-[#00B82E]/25">
            <Gift size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0E8A3E]">
                Claim 50 HuudCredit
              </span>
              <Sparkles size={11} className="text-[#0E8A3E]" />
            </div>
            <p className="text-xs font-bold text-[#1D2433] truncate">
              Confirm your email to unlock posting & perks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00B82E] hover:bg-[#00FF3E] text-black font-extrabold text-xs transition-transform active:scale-95 shadow-sm"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-black/40 hover:text-black transition-colors rounded-lg"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-black/10 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#00B82E]/15 text-[#0E8A3E]">
                  <CheckCircle2 size={16} strokeWidth={2.2} />
                </span>
                <span className="text-sm font-bold text-[#1D2433]">Verify Your Email</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-black/40 hover:text-black rounded-full"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <EmailVerificationCard
              email={user?.email || ''}
              onVerified={handleVerifiedSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}
