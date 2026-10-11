import React from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastBaseOptions extends ExternalToast {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SignalToastProps {
  emoji?: string;
  title?: string;
  signalLabel: string;
  locationName: string;
  coinsEarned?: number;
  duration?: number;
}

interface RewardToastProps {
  coins: number;
  reason: string;
  duration?: number;
}

interface ThanksToastProps {
  /** Warm, short: "Well done! Your report don reach your neighbours". */
  title: string;
  sub?: string;
  /** HuudCredit the server really awarded. Only then the coin and "+N" show; never a guess. */
  coins?: number;
  /** Shown in the circle when no HuudCredit came with it. */
  emoji?: string;
  duration?: number;
}

const BURST = [
  [-34, -26],
  [30, -30],
  [-40, 6],
  [38, 4],
  [-14, -40],
  [16, 30],
] as const;

/**
 * Thank-you card (F-08, from the Home Concept mockup): every useful action is thanked
 * right away. White floating card; a gold coin pops and a few small coins burst out when
 * HuudCredit was earned, otherwise a green circle with an emoji. No motion when the phone
 * asks for reduced motion (CSS).
 */
function ThanksCard({ title, sub, coins = 0, emoji = '💚' }: Omit<ThanksToastProps, 'duration'>) {
  const earned = coins > 0;
  return (
    <div
      className="nh-thanks"
      role="status"
      aria-label={earned ? `${title}. ${sub ? sub + '. ' : ''}You earned ${coins} HuudCredit.` : `${title}${sub ? '. ' + sub : ''}`}
    >
      <span className={earned ? 'nh-thanks__coin' : 'nh-thanks__mark'} aria-hidden>
        {earned ? '🪙' : emoji}
        {earned
          ? BURST.map(([x, y], i) => (
              <span
                key={i}
                className="nh-thanks__spark"
                style={{ '--dx': `${x}px`, '--dy': `${y}px`, animationDelay: `${120 + i * 40}ms` } as React.CSSProperties}
              >
                🪙
              </span>
            ))
          : null}
      </span>
      <span className="nh-thanks__body" aria-hidden>
        <span className="nh-thanks__title">{title}</span>
        {sub ? <span className="nh-thanks__sub">{sub}</span> : null}
      </span>
      {earned ? (
        <span className="nh-thanks__amount" aria-hidden>
          +{coins}
        </span>
      ) : null}
    </div>
  );
}

/**
 * NeyborHuud toasts (F-08).
 *   success / error / info / warning — the navy message card (same look as plain sonner toasts)
 *   thanks / signal / reward         — the white thank-you card with the coin
 */
export const nhToast = {
  /**
   * Standard Success Toast (e.g. "Profile Updated", "Comment posted")
   */
  success: (title: string, description?: string, options?: ToastBaseOptions) => {
    return sonnerToast.custom(
      (id) => (
        <div className="nh-toast-card nh-toast-card--success" role="status">
          <div className="nh-toast-card__icon nh-toast-card__icon--success">
            <CheckCircle2 size={18} strokeWidth={2.5} />
          </div>
          <div className="nh-toast-card__body">
            <h4 className="nh-toast-card__title">{title}</h4>
            {description && <p className="nh-toast-card__desc">{description}</p>}
          </div>
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                options.action?.onClick();
                sonnerToast.dismiss(id);
              }}
              className="nh-toast-card__action"
            >
              {options.action.label}
            </button>
          )}
        </div>
      ),
      { duration: options?.duration || 3500, ...options }
    );
  },

  /**
   * Standard Error Toast (e.g. "Network error", "Submission failed")
   */
  error: (title: string, description?: string, options?: ToastBaseOptions) => {
    return sonnerToast.custom(
      (id) => (
        <div className="nh-toast-card nh-toast-card--error" role="alert">
          <div className="nh-toast-card__icon nh-toast-card__icon--error">
            <AlertCircle size={18} strokeWidth={2.5} />
          </div>
          <div className="nh-toast-card__body">
            <h4 className="nh-toast-card__title">{title}</h4>
            {description && <p className="nh-toast-card__desc">{description}</p>}
          </div>
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                options.action?.onClick();
                sonnerToast.dismiss(id);
              }}
              className="nh-toast-card__action"
            >
              {options.action.label}
            </button>
          )}
        </div>
      ),
      { duration: options?.duration || 4500, ...options }
    );
  },

  /**
   * Standard Info Toast (e.g. "Notice", "FYI update")
   */
  info: (title: string, description?: string, options?: ToastBaseOptions) => {
    return sonnerToast.custom(
      (id) => (
        <div className="nh-toast-card nh-toast-card--info" role="status">
          <div className="nh-toast-card__icon nh-toast-card__icon--info">
            <Info size={18} strokeWidth={2.5} />
          </div>
          <div className="nh-toast-card__body">
            <h4 className="nh-toast-card__title">{title}</h4>
            {description && <p className="nh-toast-card__desc">{description}</p>}
          </div>
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                options.action?.onClick();
                sonnerToast.dismiss(id);
              }}
              className="nh-toast-card__action"
            >
              {options.action.label}
            </button>
          )}
        </div>
      ),
      { duration: options?.duration || 3500, ...options }
    );
  },

  /**
   * Standard Warning Toast (e.g. "Low connection", "Unsaved changes")
   */
  warning: (title: string, description?: string, options?: ToastBaseOptions) => {
    return sonnerToast.custom(
      (id) => (
        <div className="nh-toast-card nh-toast-card--warning" role="alert">
          <div className="nh-toast-card__icon nh-toast-card__icon--warning">
            <AlertTriangle size={18} strokeWidth={2.5} />
          </div>
          <div className="nh-toast-card__body">
            <h4 className="nh-toast-card__title">{title}</h4>
            {description && <p className="nh-toast-card__desc">{description}</p>}
          </div>
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                options.action?.onClick();
                sonnerToast.dismiss(id);
              }}
              className="nh-toast-card__action"
            >
              {options.action.label}
            </button>
          )}
        </div>
      ),
      { duration: options?.duration || 4000, ...options }
    );
  },

  /**
   * Thank-you card for a useful action (report, confirm, help, claim, vote, check-in).
   * Pass coins only with the amount the server says it awarded.
   */
  thanks: ({ duration = 4000, ...props }: ThanksToastProps) => {
    return sonnerToast.custom(() => <ThanksCard {...props} />, { duration });
  },

  /**
   * 1-tap signal sent (quick signals, Sentinel). A thank-you card.
   */
  signal: ({ emoji = '📡', title = 'Signal sent!', signalLabel, locationName, coinsEarned = 0, duration = 4500 }: SignalToastProps) => {
    return nhToast.thanks({ emoji, title, sub: `${signalLabel} · near ${locationName}`, coins: coinsEarned, duration });
  },

  /**
   * HuudCredit earned. A thank-you card with the coin.
   */
  reward: ({ coins, reason, duration = 4000 }: RewardToastProps) => {
    return nhToast.thanks({ title: 'HuudCredit earned', sub: reason, coins, duration });
  },

  /**
   * General Message / Notice Toast
   */
  message: (title: string, description?: string, options?: ToastBaseOptions) => {
    return nhToast.info(title, description, options);
  },

  /**
   * Pass-through dismiss and raw sonner toast
   */
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  raw: sonnerToast,
};

export const toast = nhToast;
export default nhToast;
