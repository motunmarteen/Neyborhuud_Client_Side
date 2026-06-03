'use client';

/**
 * ShareModal
 * ──────────
 * Lets users share a post to external platforms.
 * On share:
 *  1. Calls POST /content/:postId/share/external  → awards 5 HuudCoins + returns tracking link
 *  2. Opens the platform share URL (or copies link to clipboard)
 *  3. Shows a toast with points earned
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import apiClient from '@/lib/api-client';

// ─── Platform definitions ──────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  color: string;       // bg colour
  textColor: string;
  icon: React.ReactNode;
  buildUrl: (link: string, text: string) => string | null; // null = copy only
}

const SVG_FACEBOOK = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const SVG_X = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SVG_WHATSAPP = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SVG_TELEGRAM = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SVG_TIKTOK = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.21 8.21 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
  </svg>
);

const SVG_SNAPCHAT = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M12.166.009C8.91-.162 5.9 1.47 4.223 4.22c-.668 1.096-.95 2.363-.968 3.636-.038 1.279.015 2.559-.039 3.837-.015.407-.143.798-.376 1.122-.407.569-.994.916-1.618 1.122-.624.207-1.23.379-1.19.916.025.347.337.619.648.793.31.174.659.266.994.39.756.28 1.479.677 1.792 1.449.165.405.129.863.296 1.273.168.41.537.72.955.797.337.063.674-.013.997-.12.324-.107.644-.242.985-.252.34-.01.693.101 1.017.237.97.404 1.895 1.063 3.08 1.063 1.185 0 2.11-.659 3.08-1.063.324-.136.677-.247 1.017-.237.34.01.661.145.985.252.323.107.66.183.997.12.418-.077.787-.387.955-.797.167-.41.131-.868.296-1.273.313-.772 1.036-1.169 1.792-1.449.335-.124.684-.216.994-.39.311-.174.623-.446.648-.793.04-.537-.566-.709-1.19-.916-.624-.206-1.211-.553-1.618-1.122a2.343 2.343 0 01-.376-1.122c-.054-1.278-.001-2.558-.039-3.837-.018-1.273-.3-2.54-.968-3.636C18.259 1.411 15.296-.143 12.166.009z"/>
  </svg>
);

const PLATFORMS: Platform[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'bg-[#25D366]',
    textColor: 'text-white',
    icon: SVG_WHATSAPP,
    buildUrl: (link, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${link}`)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'bg-[#1877F2]',
    textColor: 'text-white',
    icon: SVG_FACEBOOK,
    buildUrl: (link) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  },
  {
    id: 'x',
    label: 'X / Twitter',
    color: 'bg-black',
    textColor: 'text-white',
    icon: SVG_X,
    buildUrl: (link, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: 'bg-[#229ED9]',
    textColor: 'text-white',
    icon: SVG_TELEGRAM,
    buildUrl: (link, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: 'bg-black',
    textColor: 'text-white',
    icon: SVG_TIKTOK,
    // TikTok has no public web share intent — copy the link instead
    buildUrl: () => null,
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    color: 'bg-[#FFFC00]',
    textColor: 'text-black',
    icon: SVG_SNAPCHAT,
    buildUrl: (link) =>
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(link)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    textColor: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    // Instagram has no web share intent — copy the link
    buildUrl: () => null,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface ShareModalProps {
  postId: string;
  postContent: string;
  onClose: () => void;
}

export default function ShareModal({ postId, postContent, onClose }: ShareModalProps) {
  const [loading, setLoading] = useState<string | null>(null); // platform id being processed
  const [copied, setCopied] = useState(false);
  const [earnedLink, setEarnedLink] = useState<string | null>(null);

  const shareText = postContent.length > 100
    ? `${postContent.substring(0, 97)}…`
    : postContent;

  const getTrackingLink = async (platformId: string): Promise<{ link: string; points_earned: number }> => {
    const res = await apiClient.post<{ link: string; points_earned: number }>(
      `/content/${postId}/share/external`,
      { platform: platformId },
    );
    const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
    return {
      link: payload?.link ?? `${window.location.origin}/post/${postId}`,
      points_earned: payload?.points_earned ?? 5,
    };
  };

  const handlePlatform = async (platform: Platform) => {
    if (loading) return;
    setLoading(platform.id);
    try {
      const { link, points_earned } = await getTrackingLink(platform.id);
      setEarnedLink(link);

      const shareUrl = platform.buildUrl(link, shareText);

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Platforms without a web share intent (TikTok, Instagram) — copy the link
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }

      toast.success(`+${points_earned} HuudCoins earned for sharing! 🎉`, { duration: 3000 });
    } catch {
      toast.error('Could not share right now. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCopyLink = async () => {
    if (loading) return;
    setLoading('copy');
    try {
      const { link, points_earned } = earnedLink
        ? { link: earnedLink, points_earned: 5 }
        : await getTrackingLink('copy');
      setEarnedLink(link);
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success(`+${points_earned} HuudCoins earned for sharing! 🎉`, { duration: 3000 });
    } catch {
      toast.error('Could not copy link.');
    } finally {
      setLoading(null);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share || loading) return;
    setLoading('native');
    try {
      const { link, points_earned } = earnedLink
        ? { link: earnedLink, points_earned: 5 }
        : await getTrackingLink('native');
      setEarnedLink(link);
      await navigator.share({
        title: 'NeyborHuud Post',
        text: shareText,
        url: link,
      });
      toast.success(`+${points_earned} HuudCoins earned for sharing! 🎉`, { duration: 3000 });
    } catch {
      // user cancelled — no error toast
    } finally {
      setLoading(null);
    }
  };

  return (
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel="Share post"
      zIndexClass="z-[300]"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="bg-black/60 backdrop-blur-sm"
      panelClassName="w-full max-w-sm rounded-t-3xl bg-white pb-safe shadow-2xl dark:bg-brand-black sm:rounded-3xl"
      handleClassName="pt-2 pb-0"
    >
        <div className="px-5 pb-6 pt-2">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-black text-[var(--neu-text-muted)] dark:text-white">Share Post</p>
              <p className="text-xs text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)]">Earn <span className="font-black text-amber-600">+5 HuudCoins</span> per share</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface dark:bg-brand-black text-[var(--neu-text-muted)] hover:bg-brand-surface dark:hover:bg-brand-black/80 transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePlatform(p)}
                disabled={!!loading}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${p.color} ${p.textColor} shadow-md transition-transform group-hover:scale-105 active:scale-95 disabled:opacity-50 ${loading === p.id ? 'animate-pulse' : ''}`}>
                  {loading === p.id
                    ? <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    : p.icon
                  }
                </div>
                <span className="text-[10px] font-bold text-[var(--neu-text-secondary)] dark:text-[var(--neu-text-muted)] text-center leading-tight">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/[0.08] dark:border-black/[0.08]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-brand-black px-3 text-xs text-[var(--neu-text-muted)]">or</span>
            </div>
          </div>

          {/* Copy link row */}
          <div className="flex items-center gap-2 rounded-2xl bg-brand-surface dark:bg-brand-black border border-black/[0.08] dark:border-black/[0.08] p-3">
            <span className="material-symbols-outlined text-[18px] text-[var(--neu-text-muted)] shrink-0">link</span>
            <p className="flex-1 truncate text-xs text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)]">
              {earnedLink ?? `neyborhuud.com/post/${postId}`}
            </p>
            <button
              onClick={handleCopyLink}
              disabled={!!loading}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-brand-black dark:bg-white text-white dark:text-[var(--neu-text-muted)] hover:bg-brand-black'
              }`}
            >
              {loading === 'copy' ? '…' : copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              disabled={!!loading}
              className="mt-3 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading === 'native' ? 'Opening…' : '↗ More options'}
            </button>
          )}

          {/* Points note */}
          <p className="mt-3 text-center text-[10px] text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)]">
            Your personal referral link is attached to every share.
            New sign-ups via your link count toward your growth streak.
          </p>
        </div>
    </BottomSheetOverlay>
  );
}
