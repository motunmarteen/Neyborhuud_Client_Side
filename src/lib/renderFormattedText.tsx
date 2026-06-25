'use client';

/**
 * Shared rich-text renderer for feed posts and chat messages.
 * Highlights URLs, emails, @mentions, #hashtags, and phone numbers
 * as tappable links with distinct colours.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

// Order matters: URLs/emails first, then phone, then @mention/# so we don't
// accidentally split an email address on the @ symbol.
const RICH_TEXT_RE =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?:\+?[\d][\d\s\-().]{6,14}\d)|(?<!\w)@\w+|(?<!\w)#\w+)/g;

interface Options {
  /** Stop-propagation on click (needed inside feed cards). */
  stopPropagation?: boolean;
}

export function renderFormattedText(text: string, opts: Options = {}): ReactNode[] {
  if (!text) return [];
  const parts = text.split(RICH_TEXT_RE);
  const stop = opts.stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  return parts.map((part, i) => {
    if (!part) return null;

    // URL
    if (/^(https?:\/\/|www\.)[^\s]+$/.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={stop}
        >
          {part}
        </a>
      );
    }

    // Email (must come before the @ mention check)
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="text-primary hover:underline" onClick={stop}>
          {part}
        </a>
      );
    }

    // Phone number
    if (/^(?:\+?[\d][\d\s\-().]{6,14}\d)$/.test(part)) {
      const tel = part.replace(/[\s\-().]/g, '');
      return (
        <a key={i} href={`tel:${tel}`} className="text-primary hover:underline" onClick={stop}>
          {part}
        </a>
      );
    }

    // @mention → profile
    if (/^@\w+$/.test(part)) {
      return (
        <Link
          key={i}
          href={`/profile/${part.slice(1)}`}
          className="font-semibold text-primary hover:underline"
          onClick={stop}
        >
          {part}
        </Link>
      );
    }

    // #hashtag → explore
    if (/^#\w+$/.test(part)) {
      return (
        <Link
          key={i}
          href={`/explore?q=${encodeURIComponent(part)}`}
          className="text-brand-blue hover:underline"
          onClick={stop}
        >
          {part}
        </Link>
      );
    }

    return <span key={i}>{part}</span>;
  });
}
