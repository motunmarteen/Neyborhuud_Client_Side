'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocalHuudSubpageShell } from '@/components/local-huud/LocalHuudSubpageShell';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useAuth } from '@/hooks/useAuth';
import {
  useHelpRequestDetail,
  useHelpOffers,
  useSubmitHelpOffer,
  useConfirmHelpOffer,
  useRejectHelpOffer,
  useUpdateHelpStatus,
} from '@/hooks/useHelpRequest';

// ─── types ────────────────────────────────────────────────────────────────────

type HelpStatus = 'open' | 'in_progress' | 'fulfilled' | 'closed';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  financial: { label: 'Financial', color: 'text-primary bg-primary/10', icon: 'account_balance_wallet' },
  medical:   { label: 'Medical',   color: 'text-brand-red bg-brand-red/10',     icon: 'local_hospital' },
  food:      { label: 'Food',      color: 'text-brand-red bg-brand-red/10',icon: 'restaurant' },
  shelter:   { label: 'Shelter',   color: 'text-brand-blue bg-brand-blue/10',   icon: 'home' },
  emergency: { label: 'Emergency', color: 'text-pink-400 bg-pink-400/10',   icon: 'emergency' },
};

const STATUS_CONFIG: Record<HelpStatus, { label: string; color: string; icon: string }> = {
  open:        { label: 'Open',        color: 'text-primary bg-primary/10', icon: 'radio_button_unchecked' },
  in_progress: { label: 'In Progress', color: 'text-brand-blue bg-brand-blue/10',       icon: 'pending' },
  fulfilled:   { label: 'Fulfilled',   color: 'text-brand-blue bg-brand-blue/10',   icon: 'check_circle' },
  closed:      { label: 'Closed',      color: 'text-[var(--neu-text-muted)] bg-brand-surface/10',       icon: 'cancel' },
};

function formatNaira(amount: number | string | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '';
  return `₦${num.toLocaleString('en-NG')}`;
}

// ─── Offer Form ───────────────────────────────────────────────────────────────

function OfferForm({ postId, onDone }: { postId: string; onDone: () => void }) {
  const [message, setMessage] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const submit = useSubmitHelpOffer(postId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) return;
    submit.mutate(
      { message: message.trim(), offeredAmount: offeredAmount ? Number(offeredAmount.replace(/,/g, '')) : undefined },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="neu-card-sm rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Offer to Help</h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe how you can help… (min 5 characters)"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        style={{ borderColor: 'var(--neu-shadow-light)', background: 'var(--neu-bg)', color: 'var(--neu-text)' }}
      />
      <input
        type="number"
        value={offeredAmount}
        onChange={(e) => setOfferedAmount(e.target.value)}
        placeholder="Amount you can contribute (₦) — optional"
        min={0}
        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        style={{ borderColor: 'var(--neu-shadow-light)', background: 'var(--neu-bg)', color: 'var(--neu-text)' }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submit.isPending || message.trim().length < 5}
          className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--primary)' }}
        >
          {submit.isPending ? 'Sending…' : 'Send Offer'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2.5 rounded-2xl text-sm font-medium mod-chip transition-all"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          Cancel
        </button>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
        If the requestor confirms your help, you earn <span className="font-bold text-primary">+5 HuudCoins</span> (max 3 per week).
      </p>
    </form>
  );
}

// ─── Single Offer Row ──────────────────────────────────────────────────────────

function OfferRow({
  offer,
  isOwner,
  postId,
}: {
  offer: any;
  isOwner: boolean;
  postId: string;
}) {
  const confirm = useConfirmHelpOffer(postId);
  const reject = useRejectHelpOffer(postId);

  const statusColors: Record<string, string> = {
    pending:   'text-primary bg-primary/10',
    confirmed: 'text-primary bg-primary/10',
    rejected:  'text-brand-red bg-brand-red/10',
    expired:   'text-[var(--neu-text-muted)] bg-brand-surface/10',
  };

  return (
    <div className="neu-card-sm rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Link href={`/profile/${offer.helper?.username}`} className="flex-shrink-0">
          <MapPinAvatar src={offer.helper?.avatarUrl} alt={offer.helper?.name} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${offer.helper?.username}`} className="text-[13px] font-semibold hover:underline block truncate" style={{ color: 'var(--neu-text)' }}>
            {offer.helper?.name}
          </Link>
          {offer.helper?.username && (
            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>@{offer.helper.username}</span>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize ${statusColors[offer.status] ?? statusColors.pending}`}>
          {offer.status}
        </span>
      </div>

      <p className="text-[13px] leading-5" style={{ color: 'var(--neu-text)' }}>{offer.message}</p>

      {offer.offeredAmount && (
        <p className="text-[12px] font-semibold text-primary">
          Offering: {formatNaira(offer.offeredAmount)}
        </p>
      )}

      {offer.coinsAwarded && (
        <p className="text-[11px] text-primary">+5 HuudCoins awarded ✓</p>
      )}

      <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{formatTimeAgo(offer.createdAt)}</p>

      {isOwner && offer.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => confirm.mutate(offer.id)}
            disabled={confirm.isPending}
            className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {confirm.isPending ? '…' : '✓ Confirm Help Received'}
          </button>
          <button
            onClick={() => reject.mutate(offer.id)}
            disabled={reject.isPending}
            className="px-3 py-2 rounded-xl text-[12px] font-medium text-brand-red mod-chip transition-all disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HelpRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { user } = useAuth();
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, isError } = useHelpRequestDetail(id);
  const { data: offersData, isLoading: offersLoading } = useHelpOffers(id, !!post);
  const updateStatus = useUpdateHelpStatus(id);

  if (isLoading) {
    return (
      <LocalHuudSubpageShell hubId="help-request">
        <div className="mod-card rounded-2xl p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LocalHuudSubpageShell>
    );
  }

  if (isError || !post) {
    return (
      <LocalHuudSubpageShell hubId="help-request">
        <div className="mod-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-4xl text-brand-red">error</span>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Help request not found</p>
          <button onClick={() => router.back()} className="px-5 py-2 rounded-2xl mod-chip text-sm">Go Back</button>
        </div>
      </LocalHuudSubpageShell>
    );
  }

  const meta = (post.metadata || {}) as Record<string, any>;
  const targetAmount: number | undefined = post.targetAmount ?? meta.targetAmount;
  const amountReceived: number = post.amountReceived ?? meta.amountReceived ?? 0;
  const accountDetails = post.helpRequestPayment ?? meta.helpRequestPayment ?? meta.accountDetails;
  const helpCategory: string = post.helpCategory ?? meta.helpCategory ?? '';
  const helpStatus: HelpStatus = (meta.helpStatus as HelpStatus) ?? 'open';
  const categoryConfig = CATEGORY_CONFIG[helpCategory];
  const statusConfig = STATUS_CONFIG[helpStatus];
  const progressPct = targetAmount && targetAmount > 0
    ? Math.min(100, Math.round((amountReceived / targetAmount) * 100))
    : null;
  const isOwner = !!(user && (user.id === post.author?.id || (user as any)._id === post.author?.id));
  const mediaUrls = (Array.isArray(post.media) ? post.media : []) as string[];
  const location = post.location as any;
  const isActive = helpStatus === 'open' || helpStatus === 'in_progress';

  const handleCopyAccount = () => {
    const acct = accountDetails?.accountNumber;
    if (!acct) return;
    navigator.clipboard.writeText(String(acct)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <LocalHuudSubpageShell hubId="help-request">
          <div className="flex flex-col gap-4">
            <article className="mod-card rounded-2xl overflow-hidden">
              <div className="p-4 flex flex-col gap-3">
                {/* Status + Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(categoryConfig ?? true) && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${categoryConfig?.color ?? 'text-white/60 bg-white/10'}`}>
                      <span className="material-symbols-outlined text-[13px]">{categoryConfig?.icon ?? 'volunteer_activism'}</span>
                      {categoryConfig?.label ?? 'Help Request'}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${statusConfig.color}`}>
                    <span className="material-symbols-outlined text-[13px]">{statusConfig.icon}</span>
                    {statusConfig.label}
                  </span>
                  <span className="ml-auto text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{formatTimeAgo(post.createdAt)}</span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <Link href={`/profile/${post.author?.username}`} className="flex-shrink-0">
                    <MapPinAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="sm" />
                  </Link>
                  <div>
                    <Link href={`/profile/${post.author?.username}`} className="text-[13px] font-semibold hover:underline" style={{ color: 'var(--neu-text)' }}>
                      {post.author?.name}
                    </Link>
                    {post.author?.username && (
                      <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>@{post.author.username}</p>
                    )}
                  </div>
                  {location && (location.lga || location.state) && (
                    <span className="ml-auto text-[11px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      {location.lga || location.state}
                    </span>
                  )}
                </div>

                {/* Body */}
                <p className="text-[14px] leading-6 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                  <span className="font-semibold mr-1" style={{ color: 'var(--primary)' }}>
                    #helprequest{helpCategory ? ` #${helpCategory}` : ''}
                  </span>
                  {post.content || post.body}
                </p>

                {/* Media */}
                {mediaUrls.length > 0 && (
                  <div className={`grid gap-1.5 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {mediaUrls.slice(0, 4).map((url, i) => (
                      <div key={i} className={`relative bg-black/10 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`media ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Target Amount + Progress — always shown for help_request */}
                <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--neu-socket)' }}>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-semibold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Funding Goal</span>
                    {targetAmount && targetAmount > 0 ? (
                      <span className="font-bold text-[14px]" style={{ color: 'var(--neu-text)' }}>{formatNaira(targetAmount)}</span>
                    ) : (
                      <span className="italic" style={{ color: 'var(--neu-text-muted)' }}>No target set — any amount welcome</span>
                    )}
                  </div>
                  {targetAmount && targetAmount > 0 && (
                    <>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--neu-shadow-light)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progressPct ?? 0}%`, background: (progressPct ?? 0) >= 100 ? '#006F35' : 'var(--primary)' }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: 'var(--neu-text-muted)' }}>Received: <span className="font-semibold text-primary">{formatNaira(amountReceived)}</span></span>
                        <span className="font-semibold" style={{ color: (progressPct ?? 0) >= 100 ? '#006F35' : 'var(--primary)' }}>{progressPct ?? 0}%</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Account Details — always shown */}
                <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: 'var(--neu-socket)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>How to Send Money</p>
                  {accountDetails ? (
                    <>
                      {accountDetails.bankName && (
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--neu-text)' }}>{accountDetails.bankName}</p>
                      )}
                      {accountDetails.accountNumber && (
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-mono font-bold tracking-wider" style={{ color: 'var(--neu-text)' }}>
                            {accountDetails.accountNumber}
                          </p>
                          <button onClick={handleCopyAccount} className="mod-chip rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all">
                            {copied ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                      {accountDetails.accountName && (
                        <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>{accountDetails.accountName}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-[12px] italic" style={{ color: 'var(--neu-text-muted)' }}>
                      No bank details provided — contact the requestor directly.
                    </p>
                  )}
                  {/* HC Payment — Coming Soon */}
                  <div className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-primary/40 bg-primary/5">
                    <span className="text-primary text-lg">🪙</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-primary">Pay with HuudCoins</p>
                      <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Coming soon — HuudCoins will be exchangeable for Naira</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary">SOON</span>
                  </div>
                </div>

                {/* Owner Status Controls */}
                {isOwner && (
                  <div className="flex flex-col gap-2 pt-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {(['open', 'in_progress', 'fulfilled', 'closed'] as HelpStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus.mutate(s)}
                          disabled={helpStatus === s || updateStatus.isPending}
                          className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all disabled:opacity-50 ${
                            helpStatus === s ? 'font-bold border-2' : 'mod-chip'
                          }`}
                          style={helpStatus === s ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { color: 'var(--neu-text-muted)' }}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Offers Section */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>
                  Help Offers
                  {offersData?.count ? (
                    <span className="ml-2 text-[12px] font-normal" style={{ color: 'var(--neu-text-muted)' }}>({offersData.count})</span>
                  ) : null}
                </h2>

                {/* Offer button — only for non-owners on open requests */}
                {!isOwner && isActive && !offersData?.myOffer && !showOfferForm && (
                  <button
                    onClick={() => setShowOfferForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: 'var(--primary)' }}
                  >
                    <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                    Offer Help
                  </button>
                )}
              </div>

              {/* Already offered badge */}
              {!isOwner && offersData?.myOffer && (
                <div className="neu-card-sm rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--neu-text)' }}>You offered to help</p>
                    <p className="text-[11px] capitalize" style={{ color: 'var(--neu-text-muted)' }}>
                      Status: {offersData.myOffer.status}
                    </p>
                  </div>
                </div>
              )}

              {showOfferForm && (
                <OfferForm postId={id} onDone={() => setShowOfferForm(false)} />
              )}

              {offersLoading && (
                <div className="py-4 flex justify-center">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!offersLoading && isOwner && offersData?.offers && (
                offersData.offers.length === 0 ? (
                  <div className="neu-card-sm rounded-2xl py-8 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl opacity-30" style={{ color: 'var(--neu-text-muted)' }}>volunteer_activism</span>
                    <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>No offers yet</p>
                  </div>
                ) : (
                  offersData.offers.map((offer: any) => (
                    <OfferRow key={offer.id} offer={offer} isOwner={isOwner} postId={id} />
                  ))
                )
              )}

              {!offersLoading && !isOwner && !offersData?.myOffer && !showOfferForm && !isActive && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--neu-text-muted)' }}>
                  This request is {helpStatus}.
                </p>
              )}
            </section>
          </div>
    </LocalHuudSubpageShell>
  );
}
