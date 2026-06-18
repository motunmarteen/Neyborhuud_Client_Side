'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import { PostCardMenuActionIcon } from '@/components/feed/PostCardMenuActionIcon';

export type PostCardMenuItem = {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

export type PostCardMenuSection = {
  id: string;
  title?: string;
  items: PostCardMenuItem[];
};

type PostCardActionsSheetProps = {
  open: boolean;
  onClose: () => void;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  sections: PostCardMenuSection[];
};

export function PostCardActionsSheet({
  open,
  onClose,
  authorName,
  authorUsername,
  authorAvatar,
  sections,
}: PostCardActionsSheetProps) {
  const visibleSections = sections.filter((s) => s.items.length > 0);

  return (
    <BottomSheetOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Post actions"
      zIndexClass="z-[320]"
      alignClass="items-end justify-center"
      backdropClassName="bg-black/35 backdrop-blur-[3px]"
      panelClassName="post-card-actions-sheet mx-auto w-full max-w-[580px] overflow-hidden rounded-t-[1.35rem] border border-white/20 bg-white/92 shadow-[0_-8px_40px_rgba(0,0,0,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(18,27,20,0.94)]"
      handleClassName="pt-2 pb-0"
    >
      <div className="post-card-actions-sheet__header">
        <div className="post-card-actions-sheet__author">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-glass-border bg-black/[0.04] dark:bg-white/10">
            {authorAvatar ? (
              <Image src={authorAvatar} alt="" fill sizes="36px" className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-neu-text-secondary dark:text-white/50">
                <User size={16} strokeWidth={2} aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-neu-text dark:text-white">{authorName}</p>
            {authorUsername && (
              <p className="truncate text-[11px] font-medium text-neu-text-secondary dark:text-white/50">
                @{authorUsername}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="post-card-actions-sheet__body">
        {visibleSections.map((section, sectionIndex) => (
          <div key={section.id} className="post-card-actions-sheet__section">
            {section.title && (
              <p className="post-card-actions-sheet__section-title">{section.title}</p>
            )}
            <div className="post-card-actions-sheet__list" role="group" aria-label={section.title}>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={async () => {
                    await item.onSelect();
                    onClose();
                  }}
                  className={`post-card-actions-sheet__item${
                    item.danger ? ' post-card-actions-sheet__item--danger' : ''
                  }${item.disabled ? ' post-card-actions-sheet__item--disabled' : ''}`}
                >
                  <PostCardMenuActionIcon name={item.icon} danger={item.danger} />
                  <span className="post-card-actions-sheet__item-label">{item.label}</span>
                </button>
              ))}
            </div>
            {sectionIndex < visibleSections.length - 1 && (
              <div className="post-card-actions-sheet__divider" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </BottomSheetOverlay>
  );
}
