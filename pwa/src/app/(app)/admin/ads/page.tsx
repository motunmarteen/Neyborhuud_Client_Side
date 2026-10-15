'use client';

/**
 * Admin: map ads waiting for review (owner, 2026-10-12). Paid ads only go live once a
 * moderator approves them. Rejecting needs a reason; HuudCredit is refunded at once,
 * naira refunds are marked for manual payout.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AD_KINDS, approveAd, fetchReviewQueue, priceText, rejectAd, type Ad } from '@/lib/adsApi';
import { AdBoard, boardInk, sponsoredPinHtml } from '@/components/map/AdBoard';
import { SponsoredCard } from '@/components/feed/SponsoredCard';
import { getErrorMessage } from '@/lib/error-handler';
import { nhToast } from '@/lib/toast';

export default function AdminAdsPage() {
  const queue = useQuery({ queryKey: ['ads', 'review'], queryFn: fetchReviewQueue });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-5">
      <div>
        <h1 className="text-xl font-black text-white">Map ads to review</h1>
        <p className="text-sm text-white/50">Paid ads go live only after approval. Check the words, the link and the place.</p>
      </div>
      {queue.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : queue.isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-white/60">
          <p>Could not load the review queue.</p>
          <button type="button" onClick={() => void queue.refetch()} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20">
            Try again
          </button>
        </div>
      ) : (queue.data ?? []).length === 0 ? (
        <p className="py-12 text-center text-white/40">Nothing waiting. All caught up.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.data!.map((ad) => (
            <ReviewCard key={ad._id} ad={ad} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ ad }: { ad: Ad }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const kind = AD_KINDS.find((k) => k.kind === ad.kind);

  const act = async (what: 'approve' | 'reject') => {
    setBusy(what);
    try {
      if (what === 'approve') await approveAd(ad._id);
      else await rejectAd(ad._id, reason.trim());
      nhToast.success(what === 'approve' ? 'Approved. The ad is live' : 'Rejected. The owner has been refunded');
      await qc.invalidateQueries({ queryKey: ['ads', 'review'] });
    } catch (e) {
      nhToast.error('That did not work', getErrorMessage(e));
      setBusy(null);
    }
  };

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#13132a] p-4 sm:flex-row">
      {ad.kind === 'feed_post' ? (
        <div className="shrink-0 rounded-xl bg-background p-2 sm:w-72">
          <SponsoredCard preview ad={ad} />
        </div>
      ) : (
      <div className="flex min-h-[110px] shrink-0 items-end justify-center rounded-xl bg-[linear-gradient(180deg,#9ED3F5,#E9F3E1)] p-3 sm:w-44">
        {ad.kind === 'billboard' ? (
          <AdBoard title={ad.title} line={ad.line} colour={ad.colour} />
        ) : ad.kind === 'sponsored_pin' ? (
          <div className="pb-6" dangerouslySetInnerHTML={{ __html: sponsoredPinHtml(ad) }} />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-lg p-1 text-center text-[11px] font-extrabold" style={{ background: ad.colour, color: boardInk(ad.colour) }}>
            {ad.title}
          </div>
        )}
      </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        <p className="font-bold text-white">
          {kind?.icon} {kind?.name} · {ad.title}
        </p>
        {ad.line ? <p className="text-white/70">{ad.line}</p> : null}
        <p className="text-white/50">
          {ad.area.lga}, {ad.area.state} · {ad.weeks} week{ad.weeks > 1 ? 's' : ''} · {priceText(ad.price.amount, ad.price.currency)}
          {ad.plot ? ` · plot ${ad.plot.row + 1}-${ad.plot.col + 1}` : ''}
          {ad.reach ? ` · reach: ${ad.reach === 'area' ? 'their area' : ad.reach === 'state' ? 'their state' : 'all Nigeria'}` : ''}
        </p>
        {ad.location ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${ad.location.lat}&mlon=${ad.location.lng}#map=18/${ad.location.lat}/${ad.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-xs font-bold text-primary underline"
          >
            See the place on a map
          </a>
        ) : null}
        {ad.target ? (
          <p className="break-all text-xs text-white/60">
            Link: <span className="font-mono text-white/80">{ad.target}</span>
          </p>
        ) : (
          <p className="text-xs text-white/40">No link</p>
        )}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="Reason, if rejecting (the owner sees this)"
          aria-label="Reason for rejecting"
          className="w-full resize-none rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => act('approve')}
            className="rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            type="button"
            disabled={!!busy || !reason.trim()}
            onClick={() => act('reject')}
            className="rounded-xl bg-red-600 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </li>
  );
}
