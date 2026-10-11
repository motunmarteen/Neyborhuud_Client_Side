'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { nhToast } from '@/lib/toast';
import { apiMessage, createPoll, POLL_DURATIONS } from '@/lib/pollsApi';

/**
 * 🗳️ Create a poll. Rules come from the server (owner decisions 2026-10-10):
 * 2–4 options, open 1 hour to 7 days, only verified neighbours in your area vote,
 * one vote each (changeable until it closes). No HuudCredit for voting; you get
 * 2 HuudCredit once 10 neighbours have voted.
 */
export function CreatePollSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);

  const cleaned = options.map((o) => o.trim());
  const filled = cleaned.filter(Boolean);
  const duplicate = new Set(filled.map((o) => o.toLowerCase())).size !== filled.length;
  const ready = question.trim().length >= 5 && filled.length >= 2 && filled.length === cleaned.length && !duplicate;

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setHours(24);
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await createPoll({ question: question.trim(), options: cleaned, durationHours: hours });
      nhToast.success('Poll posted', 'Neighbours in your area can vote now.');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      reset();
      onClose();
    } catch (e) {
      nhToast.error('Poll not posted', apiMessage(e, 'Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet
      open={open}
      onClose={onClose}
      title="Ask your neighbours"
      description="Only verified neighbours in your area can vote."
      footer={
        <Button fullWidth loading={busy} disabled={!ready} onClick={submit}>
          Post poll
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-navy">Question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 280))}
            rows={2}
            placeholder="Which day should we do the monthly sanitation?"
            className="rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          <span className="self-end text-xs text-faint">{question.length}/280</span>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-bold text-navy">Options</legend>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={o}
                onChange={(e) => setOptions((all) => all.map((x, k) => (k === i ? e.target.value.slice(0, 80) : x)))}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className="min-h-12 flex-1 rounded-2xl border border-line bg-white px-4 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
              {options.length > 2 ? (
                <button type="button" onClick={() => setOptions((all) => all.filter((_, k) => k !== i))} aria-label={`Remove option ${i + 1}`} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-background">
                  <X size={18} />
                </button>
              ) : null}
            </div>
          ))}
          {options.length < 4 ? (
            <Button variant="ghost" size="sm" leftIcon={<Plus size={16} />} onClick={() => setOptions((all) => [...all, ''])} className="self-start">
              Add option
            </Button>
          ) : null}
          {duplicate ? <p className="text-xs font-semibold text-[#C2353A]">Each option must be different.</p> : null}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-navy">Open for</legend>
          <div className="flex flex-wrap gap-2">
            {POLL_DURATIONS.map((d) => (
              <button
                key={d.hours}
                type="button"
                aria-pressed={hours === d.hours}
                onClick={() => setHours(d.hours)}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${hours === d.hours ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="rounded-2xl bg-background px-4 py-3 text-xs text-muted">
          Everyone gets one vote and can change it until the poll closes. You earn 🪙 2 HuudCredit once 10 neighbours have voted.
        </p>
      </div>
    </AppBottomSheet>
  );
}
