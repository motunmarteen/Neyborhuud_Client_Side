'use client';

/**
 * "Share today" from the map home (mockup: "your sky and your street go with it"). Shows the
 * picture first, then the phone's own share (WhatsApp status or chat, Instagram, X, TikTok...),
 * Save picture and Copy link. The link carries the person's invite code.
 */

import { useEffect, useState } from 'react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { drawTodayCard, type TodayCard } from '@/lib/shareCard';
import { nhToast } from '@/lib/toast';

type Props = {
  open: boolean;
  onClose: () => void;
  card: Omit<TodayCard, 'linkLabel'> | null;
  /** The real link (with invite code); the card shows a short label. */
  link: string;
  /** For other cards (Area Champion): the share title and message. */
  title?: string;
  text?: string;
};

export function ShareTodaySheet({ open, onClose, card, link, title: titleProp, text: textProp }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !card) return;
    let alive = true;
    let made: string | null = null;
    setFailed(false);
    drawTodayCard({ ...card, linkLabel: new URL(link).host })
      .then((b) => {
        if (!alive) return;
        made = URL.createObjectURL(b);
        setBlob(b);
        setUrl(made);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
      setBlob(null);
      setUrl(null);
    };
  }, [open, card, link]);

  const title = titleProp ?? (card ? `Today in ${card.area}` : 'Today');
  const text = textProp ?? (card ? `See what is happening in ${card.area} today on NeyborHuud.` : '');
  const fileName = `neyborhuud-today-${(card?.area ?? 'area').toLowerCase().replace(/\s+/g, '-')}.png`;

  const sharePicture = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `${text} ${link}` });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: link });
      } else {
        await copyLink();
      }
    } catch {
      /* closed the share sheet */
    }
  };
  const savePicture = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      nhToast.success('Link copied', 'Paste it in WhatsApp or anywhere.');
    } catch {
      nhToast.error('Could not copy', 'Press and hold the link to copy it.');
    }
  };

  const BTN = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold';
  return (
    <AppBottomSheet open={open} onClose={onClose} title="Share am">
      <div className="flex flex-col gap-4 pb-2">
        <div className="mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-[22px] bg-background shadow-[0_10px_30px_rgba(29,36,51,0.2)]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`${title}: your sky and what is happening`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center p-4 text-center text-sm font-semibold text-muted">
              {failed ? 'Could not make the picture. You can still share the link.' : 'Making your picture…'}
            </div>
          )}
        </div>
        <p className="text-center text-sm font-semibold text-muted">
          Your sky and your street go with it, so people see where and when it happened.
        </p>
        <button type="button" onClick={() => void sharePicture()} disabled={!blob} className={`${BTN} bg-primary text-white disabled:opacity-50`}>
          <span aria-hidden>📲</span> Share picture (WhatsApp, Instagram…)
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={savePicture} disabled={!url} className={`${BTN} flex-1 border border-line bg-white text-navy disabled:opacity-50`}>
            <span aria-hidden>⬇️</span> Save picture
          </button>
          <button type="button" onClick={() => void copyLink()} className={`${BTN} flex-1 border border-line bg-white text-navy`}>
            <span aria-hidden>🔗</span> Copy link
          </button>
        </div>
        <p className="text-center text-xs font-semibold text-muted">
          When a neighbour joins with your link and becomes active, you both get HuudCredit.
        </p>
      </div>
    </AppBottomSheet>
  );
}
