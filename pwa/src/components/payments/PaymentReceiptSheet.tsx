'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

interface ReceiptData {
  reference: string;
  typeLabel: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  description?: string | null;
  senderId: string;
  recipientId?: string | null;
}

interface Props {
  paymentId: string | null;
  onClose: () => void;
}

function AnimatedCheck() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
      <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping [animation-duration:1.2s] [animation-iteration-count:1]" />
      <div className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
        <span className="material-symbols-outlined text-white text-[28px]" aria-hidden="true">check</span>
      </div>
    </div>
  );
}

export function PaymentReceiptSheet({ paymentId, onClose }: Props) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!paymentId) return;
    setLoading(true);
    setError(false);
    setReceipt(null);
    apiClient
      .get<{ data?: ReceiptData }>(`/payments/${paymentId}/receipt`)
      .then((res) => { if (res.data?.data) setReceipt(res.data.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (!paymentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md neu-base rounded-t-3xl px-6 pb-8 pt-5 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-primary/20" />

        {loading && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm neu-text-muted">Loading receipt…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="material-symbols-outlined text-brand-red text-[40px]">error</span>
            <p className="text-sm neu-text-muted text-center">Receipt unavailable. Please try again.</p>
          </div>
        )}

        {receipt && !loading && (
          <div className="flex flex-col gap-5">
            {/* Status */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {receipt.status === 'completed' ? (
                <AnimatedCheck />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-brand-red text-[28px]">close</span>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-extrabold neu-text">{receipt.typeLabel}</p>
                <p className={`text-3xl font-black tabular-nums mt-1 ${
                  receipt.status === 'completed' ? 'text-primary' : 'text-brand-red'
                }`}>
                  {receipt.amount.toLocaleString()} <span className="text-xl opacity-60">HC</span>
                </p>
              </div>
            </div>

            {/* Receipt details */}
            <div className="neu-input rounded-2xl px-4 py-1 divide-y divide-[var(--neu-shadow-dark)]">
              {[
                { label: 'Status', value: receipt.status, valueClass: receipt.status === 'completed' ? 'text-primary font-bold capitalize' : 'text-brand-red font-bold capitalize' },
                { label: 'Reference', value: receipt.reference, valueClass: 'font-mono text-xs neu-text-muted' },
                { label: 'Date', value: new Date(receipt.timestamp).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), valueClass: 'neu-text-muted' },
                ...(receipt.description ? [{ label: 'Note', value: receipt.description, valueClass: 'neu-text-muted' }] : []),
              ].map(({ label, value, valueClass }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs font-bold uppercase tracking-widest neu-text-muted">{label}</span>
                  <span className={`text-sm text-right max-w-[60%] ${valueClass}`}>{value}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white active:scale-[0.98] transition-transform"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
