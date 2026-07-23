'use client';

/**
 * Seller Payout Details — where buyers send direct payment during a deal.
 * NeyborHuud never holds the money; this is just the account the buyer transfers
 * to. Set once, reused across every deal, shown to the buyer in the deal chat.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { marketplaceService } from '@/services/marketplace.service';
import { useAuth } from '@/hooks/useAuth';

export default function PayoutDetailsPage() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill from the API, fetched fresh on mount — payout details are never
  // cached in localStorage/sessionStorage (see lib/auth.ts sanitizeUserForStorage),
  // so this can't come from the persisted user object.
  useEffect(() => {
    let cancelled = false;
    marketplaceService
      .getMyPayoutDetails()
      .then((res) => {
        if (cancelled) return;
        const data = (res as any)?.data ?? res;
        const pd = data?.hasPayoutDetails ? data.payoutDetails : null;
        if (pd) {
          setBankName(pd.bankName ?? '');
          setAccountNumber(pd.accountNumber ?? '');
          setAccountName(pd.accountName ?? '');
        }
      })
      .catch(() => {
        // No saved details yet, or fetch failed — leave the form blank.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The registered name the backend will check the account name against.
  const registeredName = (() => {
    const u = user as any;
    const first = (u?.firstName ?? '').trim();
    const last = (u?.lastName ?? '').trim();
    if (first || last) return `${first} ${last}`.trim();
    return (u?.name ?? '').trim();
  })();

  const acctValid = /^\d{10}$/.test(accountNumber.trim());
  const canSubmit =
    bankName.trim().length > 1 &&
    acctValid &&
    accountName.trim().length > 1 &&
    password.trim().length > 0 &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await marketplaceService.savePayoutDetails({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        password,
      });
      setPassword('');
      toast.success('Payout details saved. Buyers will see this during a deal.');
    } catch (err) {
      const ax = err as { message?: string };
      toast.error(ax.message || 'Could not save payout details');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppBrowseLayout>
      <div className="max-w-md mx-auto w-full py-6">
        <div className="mt-8 mb-6">
          <Link
            href="/settings"
            className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-4 inline-block"
          >
            ← Settings
          </Link>
          <h1
            className="text-2xl font-semibold tracking-tight mt-2"
            style={{ color: 'var(--neu-text)' }}
          >
            Payment details
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: 'var(--neu-text-secondary)' }}
          >
            The account buyers pay into when they buy from you. NeyborHuud never
            holds your money — buyers transfer to you directly. You only set this
            once.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <PremiumInput
            label="Bank name"
            icon="account_balance"
            placeholder="e.g. GTBank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <PremiumInput
            label="Account number"
            icon="pin"
            inputMode="numeric"
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
          />
          {accountNumber.length > 0 && !acctValid && (
            <p className="-mt-2 text-xs font-medium text-status-danger">
              Account number must be exactly 10 digits.
            </p>
          )}
          <PremiumInput
            label="Account name"
            icon="person"
            placeholder="Name on the account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          {registeredName && (
            <p className="-mt-2 text-xs leading-relaxed text-gray-500">
              For your safety, this must match your registered name on
              NeyborHuud: <span className="font-semibold text-gray-700">{registeredName}</span>.
              Accounts in another name are rejected.
            </p>
          )}

          <PremiumInput
            label="Confirm your password"
            icon="lock"
            type="password"
            autoComplete="current-password"
            placeholder="Required to save changes"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="-mt-2 text-xs leading-relaxed text-gray-500">
            We ask for your password again here since this is where deal
            payments get sent — a precaution against someone else using your
            session to redirect your payouts.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save payment details'}
          </button>
        </form>
      </div>
    </AppBrowseLayout>
  );
}
