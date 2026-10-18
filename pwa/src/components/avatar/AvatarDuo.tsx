'use client';

/**
 * "You and <name>" on someone's profile (owner 2026-10-18): your avatar and theirs.
 * You follow them: you wave from afar. They follow you: they wave at you. You follow each other:
 * two men or two women hug; otherwise you come close and wave. When you tap Follow, the scene
 * changes right away (they walk over).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { createDuoStage, type DuoMode, type DuoStage } from '@/lib/avatar3d/stage';
import { useAvatarCatalogue, type AvatarConfig } from '@/hooks/useAvatar';
import { useTranslation } from '@/lib/i18n';

type Duo = {
  me: { config: AvatarConfig } | null;
  them: { config: AvatarConfig } | null;
  sameGender: boolean | null;
};

function modeFor(iFollow: boolean, theyFollow: boolean, sameGender: boolean | null): DuoMode {
  if (iFollow && theyFollow) return sameGender === true ? 'hug' : 'close_wave';
  if (iFollow) return 'i_wave';
  if (theyFollow) return 'they_wave';
  return 'none';
}

export function AvatarDuo({ userId, name, isFollowing, followsYou }: { userId: string; name: string; isFollowing: boolean; followsYou: boolean }) {
  const { t } = useTranslation();
  const { data: cat } = useAvatarCatalogue();
  const mutual = isFollowing && followsYou;
  // Refetch when the connection changes (same-gender is only known for mutual follows).
  const { data } = useQuery({
    queryKey: ['avatar', 'duo', userId, mutual],
    queryFn: async () => {
      const res = (await apiClient.get(`/avatar/duo/${userId}`)) as { data?: Duo } | Duo;
      return ((res as { data?: Duo }).data ?? res) as Duo;
    },
    staleTime: 60_000,
    retry: 1,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<DuoStage | null>(null);
  const [stageKey, setStageKey] = useState(0);

  const color = useMemo(() => {
    const by = new Map((cat?.items ?? []).map((i) => [i.id, i]));
    return (id: string | undefined, fb: string) => (id && by.get(id)?.color) || fb;
  }, [cat]);
  const mode = modeFor(isFollowing, followsYou, data?.sameGender ?? null);
  const meCfg = useMemo(() => (cat ? { ...cat.defaults, ...(data?.me?.config ?? {}) } : null), [cat, data]);
  const themCfg = useMemo(() => (cat ? { ...cat.defaults, ...(data?.them?.config ?? {}) } : null), [cat, data]);
  const latest = useRef({ meCfg, themCfg, mode });
  useEffect(() => {
    latest.current = { meCfg, themCfg, mode };
  }, [meCfg, themCfg, mode]);

  useEffect(() => {
    if (!canvasRef.current || !cat) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-calm');
    const stage = createDuoStage(canvasRef.current, color, { still, onLost: () => window.setTimeout(() => setStageKey((k) => k + 1), 300) });
    stageRef.current = stage;
    const l = latest.current;
    if (l.meCfg && l.themCfg) stage.set(l.meCfg, l.themCfg, l.mode);
    return () => {
      stage.dispose();
      if (stageRef.current === stage) stageRef.current = null;
    };
  }, [cat, color, stageKey]);

  useEffect(() => {
    if (meCfg && themCfg) stageRef.current?.set(meCfg, themCfg, mode);
  }, [meCfg, themCfg, mode]);

  const caption = {
    none: t('duo.none', { name }),
    i_wave: t('duo.iWave', { name }),
    they_wave: t('duo.theyWave', { name }),
    hug: t('duo.hug', { name }),
    close_wave: t('duo.closeWave', { name }),
  }[mode];

  return (
    <section aria-label={t('duo.title', { name })} className="overflow-hidden rounded-2xl bg-gradient-to-b from-[#BFE6FF] to-[#E8F7EC] shadow-[0_2px_10px_rgba(29,36,51,0.08)]">
      <canvas key={stageKey} ref={canvasRef} className="block h-40 w-full" role="img" aria-label={caption} />
      <div className="flex items-center justify-between gap-2 bg-white/80 px-3 py-2">
        <p className="min-w-0 text-[13px] font-bold text-navy">{caption}</p>
        {data && !data.me ? (
          <Link href="/avatar" className="shrink-0 text-xs font-extrabold text-brand-green-dark">
            {t('duo.makeMine')}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
