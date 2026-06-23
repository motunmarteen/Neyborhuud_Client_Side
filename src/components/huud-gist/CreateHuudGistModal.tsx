'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import { useCreateHuudGist } from '@/hooks/useHuudGist';
import { getErrorMessage } from '@/lib/error-handler';
import { defaultPostSection, postableSections } from '@/lib/huudGistConfig';
import { gistPostId, type GistSection, type GistSectionId } from '@/types/huudGist';

type CreateHuudGistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sections: GistSection[];
  defaultSection?: GistSectionId;
};

function SectionPicker({
  sections,
  value,
  onChange,
}: {
  sections: GistSection[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = sections.find((s) => s.id === value);

  return (
    <div className="mt-1 min-w-0">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mod-inset flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm"
        >
          <span className="truncate">{selected?.label ?? 'Choose section'}</span>
          <span className="material-symbols-outlined shrink-0 text-[20px] text-primary">
            expand_more
          </span>
        </button>
      ) : (
        <div className="mod-inset overflow-hidden rounded-xl">
          <div
            className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold text-[var(--neu-text-muted)]"
            style={{ borderColor: 'var(--neu-shadow-dark)' }}
          >
            <span>Pick a section</span>
            <button type="button" onClick={() => setOpen(false)} className="text-primary">
              Done
            </button>
          </div>
          <ul className="max-h-[min(38vh,220px)] overflow-y-auto overscroll-contain">
            {sections.map((opt) => {
              const active = opt.id === value;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`flex w-full min-w-0 px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'hover:bg-black/[0.03]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CreateHuudGistModal({
  isOpen,
  onClose,
  sections,
  defaultSection = 'local_gist',
}: CreateHuudGistModalProps) {
  const router = useRouter();
  const createGist = useCreateHuudGist();
  const postSections = postableSections(sections);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [section, setSection] = useState<string>(
    defaultSection === 'all' ? defaultPostSection(sections) : defaultSection,
  );
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSection(
        defaultSection === 'all' ? defaultPostSection(sections) : defaultSection,
      );
      setError(null);
    }
  }, [isOpen, defaultSection, sections]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setError(null);
    try {
      const res = await createGist.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        anonymous,
        discussion_type: section,
        tags: ['huudgist'],
      });
      const thread = res?.data?.gossip;
      const id = thread ? gistPostId(thread) : null;
      setTitle('');
      setBody('');
      setAnonymous(false);
      onClose();
      if (id) router.push(`/gist/${id}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err as AxiosError) || 'Could not post thread.');
    }
  };

  const selectedSection = postSections.find((s) => s.id === section);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-black/50 p-3 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="mod-card box-border max-h-[min(92vh,720px)] w-full max-w-lg min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
            New Huud Gist
          </h2>
          <button type="button" onClick={onClose} className="mod-chip shrink-0 rounded-full px-2 py-1 text-sm">
            Close
          </button>
        </div>

        <div className="mb-3 min-w-0">
          <span className="text-xs font-semibold text-[var(--neu-text-muted)]">Section</span>
          <SectionPicker sections={postSections} value={section} onChange={setSection} />
        </div>

        {selectedSection?.description ? (
          <p className="mb-3 text-xs leading-relaxed text-[var(--neu-text-muted)]">
            {selectedSection.description}
          </p>
        ) : null}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title"
          className="mod-inset mb-3 box-border w-full min-w-0 rounded-xl px-3 py-2.5 text-sm"
          maxLength={100}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share the gist with your Huud…"
          className="mod-inset mb-3 box-border min-h-[120px] w-full min-w-0 rounded-xl px-3 py-2.5 text-sm"
        />

        <label className="mb-4 flex items-center gap-2 text-sm text-[var(--neu-text-muted)]">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Post anonymously
        </label>

        {error ? <p className="mb-3 text-sm text-brand-red">{error}</p> : null}

        <button
          type="submit"
          disabled={createGist.isPending || !title.trim() || !body.trim()}
          className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
        >
          {createGist.isPending ? 'Posting…' : 'Post to Huud Gist'}
        </button>
      </form>
    </div>
  );
}
