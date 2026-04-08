'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { authService } from '@/services/auth.service';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('neyborhuud_user');
    if (!raw) {
      toast.error('Sign in to change your password');
      router.replace('/login');
      return;
    }
    try {
      const u = JSON.parse(raw) as { email?: string; username?: string };
      if (typeof u.email === 'string') setEmail(u.email);
      if (typeof u.username === 'string') setUsername(u.username);
    } catch {
      /* ignore */
    }
  }, [router]);

  const policy = evaluatePasswordPolicy(newPassword, { email, username });
  const match = newPassword.length > 0 && confirm.length > 0 && newPassword === confirm;
  const canSubmit = policy.ok && match && currentPassword.length > 0 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      router.push('/settings');
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        ax.response?.data?.message ||
        ax.message ||
        'Could not update password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[100dvh] neu-base overflow-hidden">
      <div className="h-full flex flex-col p-6 max-w-md mx-auto w-full overflow-y-auto">
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
            Change password
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: 'var(--neu-text-secondary)' }}
          >
            Use the same rules as sign-up (12+ characters, strength meter). Your
            email and username are checked so the password cannot contain those
            fragments.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <PremiumInput
            label="Current password"
            type="password"
            icon="bi-key"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <PremiumInput
              label="New password"
              type="password"
              icon="bi-lock"
              placeholder="12+ chars, mixed case, number, symbol"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordStrengthMeter
              password={newPassword}
              email={email}
              username={username}
            />
          </div>
          <PremiumInput
            label="Confirm new password"
            type="password"
            icon="bi-lock-fill"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirm.length > 0 && !match ? 'Passwords do not match' : undefined}
            success={match && confirm.length > 0}
            successText={match && confirm.length > 0 ? 'Matches' : undefined}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`neu-btn py-5 rounded-2xl mt-2 ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className="font-black uppercase tracking-widest text-sm"
              style={{ color: 'var(--neu-text)' }}
            >
              {loading ? 'Saving…' : 'Update password'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
