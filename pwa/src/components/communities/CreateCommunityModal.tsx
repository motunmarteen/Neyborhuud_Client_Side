'use client';

import { useState } from 'react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useCreateHubCommunity } from '@/hooks/useHubCommunities';
import { getErrorMessage } from '@/lib/error-handler';
import { unwrapApiData } from '@/lib/apiPayload';
import type { HubCategory, HubCommunity } from '@/types/hubCommunity';

const CATEGORIES: { id: HubCategory; icon: string }[] = [
  { id: 'security', icon: 'shield' },
  { id: 'residents', icon: 'home' },
  { id: 'trade', icon: 'storefront' },
  { id: 'sports', icon: 'sports_soccer' },
  { id: 'volunteer', icon: 'volunteer_activism' },
  { id: 'general', icon: 'groups' },
];

const FIELD =
  'w-full rounded-2xl bg-background px-4 py-3 text-[15px] text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40';

type CreateCommunityModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createHub = useCreateHubCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HubCategory>('general');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(false);
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const payload = unwrapApiData<{ hub: HubCommunity }>(res);
      const hub = payload?.hub;
      if (!hub?.conversationId && !hub?.id) {
        throw new Error('Community created but chat link was missing.');
      }

      await queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });

      toast.success(t('comm.form.done'));
      onClose();
      setName('');
      setDescription('');
      setCategory('general');
      setVisibility('public');
      setJoinApprovalRequired(false);
      setOnlyAdminsCanPost(false);

      if (hub.conversationId) {
        router.push(`/chat/${hub.conversationId}`);
      } else if (hub.id) {
        router.push(`/communities/${hub.id}`);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('comm.form.failed'));
    }
  };

  const toggles = [
    { label: t('comm.form.private'), on: visibility === 'private', set: (v: boolean) => setVisibility(v ? 'private' : 'public') },
    { label: t('comm.form.approve'), on: joinApprovalRequired, set: setJoinApprovalRequired },
    { label: t('comm.form.adminsPost'), on: onlyAdminsCanPost, set: setOnlyAdminsCanPost },
  ];

  return (
    <AppBottomSheet
      open={isOpen}
      onClose={onClose}
      title={t('comm.createLong')}
      description={t('comm.form.body')}
      footer={
        <>
          {error ? <p role="alert" className="mb-2 text-[13px] font-bold text-brand-red">{error}</p> : null}
          <Button type="submit" form="create-community" fullWidth loading={createHub.isPending} disabled={!name.trim()}>
            {t('comm.form.submit')}
          </Button>
          <p className="mt-2 text-center text-xs text-muted">{t('comm.form.cost')}</p>
        </>
      }
    >
      <form id="create-community" onSubmit={handleSubmit} className="flex flex-col gap-3 pb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('comm.form.name')}
          aria-label={t('comm.form.name')}
          className={FIELD}
          maxLength={80}
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('comm.form.about')}
          aria-label={t('comm.form.about')}
          className={`${FIELD} min-h-[84px]`}
          maxLength={500}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('comm.form.kind')}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`tap-target inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors ${
                category === c.id ? 'bg-navy text-white' : 'bg-background text-navy hover:bg-[#E6EAF0]'
              }`}
            >
              {t(`comm.kind.${c.id}`)}
            </button>
          ))}
        </div>
        <div>
          {toggles.map((x) => (
            <label key={x.label} className="flex min-h-12 items-center justify-between gap-3 text-sm font-semibold text-navy">
              {x.label}
              <input type="checkbox" checked={x.on} onChange={(e) => x.set(e.target.checked)} className="h-5 w-5 accent-[#0E8A3E]" />
            </label>
          ))}
        </div>
      </form>
    </AppBottomSheet>
  );
}
