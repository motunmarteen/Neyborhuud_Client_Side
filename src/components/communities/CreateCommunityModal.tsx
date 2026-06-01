'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateHubCommunity } from '@/hooks/useHubCommunities';
import { getErrorMessage } from '@/lib/error-handler';
import type { HubCategory } from '@/types/hubCommunity';

const CATEGORIES: { id: HubCategory; label: string; icon: string }[] = [
  { id: 'security', label: 'Security & Safety', icon: 'shield' },
  { id: 'residents', label: 'Residents', icon: 'home' },
  { id: 'trade', label: 'Local Trade', icon: 'storefront' },
  { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
  { id: 'volunteer', label: 'Volunteer', icon: 'volunteer_activism' },
  { id: 'general', label: 'General', icon: 'groups' },
];

type CreateCommunityModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
  const router = useRouter();
  const createHub = useCreateHubCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HubCategory>('general');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(false);
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      const res = await createHub.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        icon: CATEGORIES.find((c) => c.id === category)?.icon ?? 'groups',
        visibility,
        settings: {
          joinApprovalRequired,
          onlyAdminsCanPost,
        },
      });
      const hub = res.data?.hub;
      onClose();
      setName('');
      setDescription('');
      if (hub?.conversationId) {
        router.push(`/chat/${hub.conversationId}`);
      } else if (hub?.id) {
        router.push(`/communities/${hub.id}`);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Could not create community.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-black/50 p-3 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="mod-card box-border max-h-[min(92vh,720px)] w-full max-w-lg min-w-0 overflow-y-auto rounded-2xl p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
            Create community
          </h2>
          <button type="button" onClick={onClose} className="mod-chip shrink-0 rounded-full px-2 py-1 text-sm">
            Close
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--neu-text-muted)]">
          Start a group for your Huud — chat, share updates, and grow your neighbourhood community.
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Community name"
          className="mod-inset mb-3 w-full rounded-xl px-3 py-2.5 text-sm"
          maxLength={80}
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this community about?"
          className="mod-inset mb-3 min-h-[88px] w-full rounded-xl px-3 py-2.5 text-sm"
          maxLength={500}
        />

        <span className="mb-2 block text-xs font-semibold text-[var(--neu-text-muted)]">Category</span>
        <div className="browse-chip-row browse-chip-row--scroll no-scrollbar mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`mod-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                category === c.id ? 'mod-chip-active text-primary' : ''
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span style={{ color: 'var(--neu-text)' }}>Private community</span>
          <input
            type="checkbox"
            checked={visibility === 'private'}
            onChange={(e) => setVisibility(e.target.checked ? 'private' : 'public')}
          />
        </label>
        <label className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span style={{ color: 'var(--neu-text)' }}>Require admin approval to join</span>
          <input
            type="checkbox"
            checked={joinApprovalRequired}
            onChange={(e) => setJoinApprovalRequired(e.target.checked)}
          />
        </label>
        <label className="mb-4 flex items-center justify-between gap-3 text-sm">
          <span style={{ color: 'var(--neu-text)' }}>Only admins can post</span>
          <input
            type="checkbox"
            checked={onlyAdminsCanPost}
            onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
          />
        </label>

        {error ? <p className="mb-3 text-sm text-brand-red">{error}</p> : null}

        <button
          type="submit"
          disabled={createHub.isPending || !name.trim()}
          className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
        >
          {createHub.isPending ? 'Creating…' : 'Create & open chat'}
        </button>
      </form>
    </div>
  );
}
