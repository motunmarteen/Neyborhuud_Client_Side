import React from 'react';
import type { Post } from '@/types/api';

interface PremiumSafetyAlertBlockProps {
  post: Post;
  authorUsername: string;
}

export function PremiumSafetyAlertBlock({ post, authorUsername }: PremiumSafetyAlertBlockProps) {
  const meta = post.metadata || {};
  
  const hazardType = meta.hazardType ? String(meta.hazardType).replace('_', ' ') : 'General Threat';
  const time = meta.incidentTime ? String(meta.incidentTime) : null;
  const location = meta.incidentLocation ? String(meta.incidentLocation) : null;
  const severity = (post.severity || post.priority || 'high').toString().toUpperCase();

  return (
    <div className="flex flex-col mt-2 pl-3 border-l-[2px] border-brand-red/30">
      {/* Header Bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[14px] text-brand-red">warning</span>
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-red mr-auto">
          Safety Alert
        </span>
      </div>

      {/* Details List */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-start gap-2 text-[13px] leading-snug">
          <span className="font-semibold text-neu-text-secondary w-16 shrink-0">Type</span>
          <span className="font-medium text-neu-text capitalize">{hazardType}</span>
        </div>
        
        <div className="flex items-start gap-2 text-[13px] leading-snug">
          <span className="font-semibold text-neu-text-secondary w-16 shrink-0">Severity</span>
          <span className="font-bold text-brand-red">{severity}</span>
        </div>

        {time && (
          <div className="flex items-start gap-2 text-[13px] leading-snug">
            <span className="font-semibold text-neu-text-secondary w-16 shrink-0">Time</span>
            <span className="text-neu-text">{time}</span>
          </div>
        )}

        {location && (
          <div className="flex items-start gap-2 text-[13px] leading-snug">
            <span className="font-semibold text-neu-text-secondary w-16 shrink-0">Location</span>
            <span className="text-neu-text">{location}</span>
          </div>
        )}
      </div>

    </div>
  );
}
