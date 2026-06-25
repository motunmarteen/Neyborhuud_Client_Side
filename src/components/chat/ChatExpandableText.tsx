'use client';

import { useMemo, useState } from 'react';
import { renderFormattedText } from '@/lib/renderFormattedText';

const COLLAPSE_CHAR_LIMIT = 320;
const COLLAPSE_LINE_LIMIT = 10;

type ChatExpandableTextProps = {
  text: string;
  className?: string;
};

export function ChatExpandableText({ text, className = 'chat-bubble__text' }: ChatExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  const needsCollapse = useMemo(() => {
    if (text.length > COLLAPSE_CHAR_LIMIT) return true;
    return text.split('\n').length > COLLAPSE_LINE_LIMIT;
  }, [text]);

  const rich = renderFormattedText(text);

  if (!needsCollapse) {
    return <p className={className}>{rich}</p>;
  }

  return (
    <div className="chat-bubble__text-block">
      <p className={`${className}${expanded ? '' : ' chat-bubble__text--clamped'}`}>{rich}</p>
      <button
        type="button"
        className="chat-see-more"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'See less' : 'See more'}
      </button>
    </div>
  );
}
