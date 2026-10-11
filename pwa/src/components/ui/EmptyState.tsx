import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Design foundation F-09: empty states.
 *
 * Says plainly what is missing and what to do next, in the app's warm, Nigerian voice
 * ("Nothing dey here yet"). One soft circle with an emoji or icon, a heading, one line,
 * and at most one main action.
 */

type EmptyAction = { label: string; href?: string; onClick?: () => void };

type EmptyStateProps = {
  /** An emoji ("📭") or any icon node. */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: EmptyAction | ReactNode;
  /** Smaller, without the card: inside a sheet, a tab or a short list. */
  compact?: boolean;
  className?: string;
};

const isAction = (a: unknown): a is EmptyAction => !!a && typeof a === 'object' && 'label' in (a as object);

const ACTION_CLASS =
  'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark';

export function EmptyState({ icon = '📭', title, description, action, compact = false, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-center ${
        compact ? 'px-4 py-8' : 'rounded-[22px] bg-white px-6 py-12 shadow-[0_2px_10px_rgba(29,36,51,0.06)]'
      } ${className}`.trim()}
    >
      <span
        aria-hidden
        className={`grid place-items-center rounded-full bg-green-soft text-brand-green-dark ${compact ? 'h-14 w-14 text-2xl' : 'h-16 w-16 text-3xl'}`}
      >
        {icon}
      </span>
      <p className="font-heading text-lg font-extrabold text-navy">{title}</p>
      {description ? <p className="max-w-xs text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? (
        <div className="mt-1">
          {isAction(action) ? (
            action.href ? (
              <Link href={action.href} className={ACTION_CLASS}>
                {action.label}
              </Link>
            ) : (
              <button type="button" onClick={action.onClick} className={ACTION_CLASS}>
                {action.label}
              </button>
            )
          ) : (
            action
          )}
        </div>
      ) : null}
    </div>
  );
}
