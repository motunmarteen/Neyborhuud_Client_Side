import React from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Coins,
} from 'lucide-react';

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

/**
 * Unified NeyborHuud Daylight Toast System
 * High-contrast, clean light-themed toasts tailored for the NeyborHuud platform.
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
   * 1-Tap Signal Bar / Sentinel Radar Logged Toast
   * Beautiful daylight feedback with emoji badge, clear typography, and +15 HC reward chip.
   */
  signal: ({
    emoji = '📡',
    title = 'Signal Logged!',
    signalLabel,
    locationName,
    coinsEarned = 15,
    duration = 4500,
  }: SignalToastProps) => {
    return sonnerToast.custom(
      () => (
        <div className="nh-toast-card nh-toast-card--signal" role="status">
          {/* Left Emoji / Status Badge */}
          <div className="nh-toast-card__icon nh-toast-card__icon--signal">
            <span className="text-base select-none leading-none">{emoji}</span>
          </div>

          {/* Main Info */}
          <div className="nh-toast-card__body">
            <div className="flex items-center justify-between gap-2">
              <h4 className="nh-toast-card__title">{title}</h4>
              {coinsEarned > 0 && (
                <span className="nh-toast-badge nh-toast-badge--coins">
                  <Coins size={11} className="text-emerald-600 shrink-0" />
                  <span>+{coinsEarned} HC</span>
                </span>
              )}
            </div>
            <p className="nh-toast-card__desc">
              <strong className="text-slate-900 font-semibold">{signalLabel}</strong> reported near{' '}
              <span className="text-slate-800 font-medium">{locationName}</span>. Sentinel AI & radar updated.
            </p>
          </div>
        </div>
      ),
      { duration }
    );
  },

  /**
   * HuudCredit / Gamification Reward Toast
   */
  reward: ({ coins, reason, duration = 4000 }: RewardToastProps) => {
    return sonnerToast.custom(
      () => (
        <div className="nh-toast-card nh-toast-card--reward" role="status">
          <div className="nh-toast-card__icon nh-toast-card__icon--reward">
            <Sparkles size={18} className="text-emerald-600 animate-pulse" />
          </div>
          <div className="nh-toast-card__body">
            <div className="flex items-center justify-between gap-2">
              <h4 className="nh-toast-card__title">HuudCredit Earned!</h4>
              <span className="nh-toast-badge nh-toast-badge--coins">
                <Coins size={11} className="text-emerald-600 shrink-0" />
                <span>+{coins} HC</span>
              </span>
            </div>
            <p className="nh-toast-card__desc">{reason}</p>
          </div>
        </div>
      ),
      { duration }
    );
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
