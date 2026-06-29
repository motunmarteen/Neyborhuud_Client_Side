import React from 'react';
import {
  BarChart2,
  Bookmark,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  ThumbsUp,
  HandHelping,
} from 'lucide-react';

interface XIconProps {
  size?: number | string;
  className?: string;
}

const base = 'shrink-0 text-current';

function toSize(size: number | string | undefined) {
  return typeof size === 'string' ? parseInt(size, 10) || 18 : size ?? 18;
}

export function XReplyIcon({ size = 18, className = '' }: XIconProps) {
  return <MessageCircle size={toSize(size)} strokeWidth={2} className={`${base} ${className}`} aria-hidden />;
}

export function XRepostIcon({ size = 18, className = '' }: XIconProps) {
  return <Repeat2 size={toSize(size)} strokeWidth={2} className={`${base} ${className}`} aria-hidden />;
}

export function XLikeIcon({ size = 18, filled = false, className = '' }: XIconProps & { filled?: boolean }) {
  return (
    <Heart
      size={toSize(size)}
      strokeWidth={2}
      fill={filled ? 'currentColor' : 'none'}
      className={`${base} ${className}`}
      aria-hidden
    />
  );
}

export function XViewIcon({ size = 18, className = '' }: XIconProps) {
  return <BarChart2 size={toSize(size)} strokeWidth={2} className={`${base} ${className}`} aria-hidden />;
}

export function XBookmarkIcon({ size = 18, filled = false, className = '' }: XIconProps & { filled?: boolean }) {
  return (
    <Bookmark
      size={toSize(size)}
      strokeWidth={2}
      fill={filled ? 'currentColor' : 'none'}
      className={`${base} ${className}`}
      aria-hidden
    />
  );
}

export function XShareIcon({ size = 18, className = '' }: XIconProps) {
  return <Share size={toSize(size)} strokeWidth={2} className={`${base} ${className}`} aria-hidden />;
}

export function XHelpIcon({ size = 18, className = '' }: XIconProps) {
  return <HandHelping size={toSize(size)} strokeWidth={2} className={`${base} ${className}`} aria-hidden />;
}

export function XThumbUpIcon({ size = 18, filled = false, className = '' }: XIconProps & { filled?: boolean }) {
  return (
    <ThumbsUp
      size={toSize(size)}
      strokeWidth={2}
      fill={filled ? 'currentColor' : 'none'}
      className={`${base} ${className}`}
      aria-hidden
    />
  );
}
