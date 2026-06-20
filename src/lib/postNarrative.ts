/**
 * postNarrative.ts — Converts structured post metadata into human-readable
 * narrative statements for display in post cards.
 *
 * KEY RULES:
 * - Contact info (phone, email) is NEVER revealed — always replaced with DM CTA.
 * - Currency is always ₦ (Naira).
 * - "used" condition renders as "Tokunbo (used)".
 */

import type { Post } from '@/types/api';

// ── Helpers ──────────────────────────────────────────────────────

function formatNaira(amount: number | string | undefined): string | null {
  if (amount == null || amount === '') return null;
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(num)) return null;
  return `₦${num.toLocaleString('en-NG')}`;
}

function conditionLabel(c?: string): string {
  if (!c) return '';
  switch (c.toLowerCase()) {
    case 'used':
      return 'Tokunbo (used)';
    case 'new':
      return 'Brand new';
    case 'refurbished':
      return 'Refurbished';
    case 'free':
      return 'Free (giveaway)';
    default:
      return c;
  }
}

function deliveryLabel(d?: string): string {
  if (!d) return '';
  switch (d.toLowerCase()) {
    case 'pickup':
      return 'pickup only';
    case 'delivery':
      return 'delivery available';
    case 'both':
      return 'pickup or delivery';
    default:
      return d;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Narrative Generators ─────────────────────────────────────────

function marketplaceNarrative(post: Post): string | null {
  const parts: string[] = [];

  // Opening — use the post content as description
  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  // Price line
  const price = formatNaira(post.price ?? post.metadata?.price);
  if (price) {
    const negotiable = post.isNegotiable ?? post.metadata?.isNegotiable;
    parts.push(`💰 Price: ${price}${negotiable ? ' (negotiable)' : ''}`);
  }

  // Condition
  const cond = post.itemCondition ?? post.metadata?.itemCondition;
  if (cond) {
    parts.push(`📦 Condition: ${conditionLabel(cond)}`);
  }

  // Category
  const cat = post.itemCategory ?? post.metadata?.itemCategory;
  if (cat) {
    parts.push(`🏷️ Category: ${capitalize(cat)}`);
  }

  // Delivery
  const delivery = post.deliveryOption ?? post.metadata?.deliveryOption;
  if (delivery) {
    parts.push(`🚚 ${capitalize(deliveryLabel(delivery))}`);
  }

  // Availability
  const avail = post.availability ?? post.metadata?.availability;
  if (avail && avail !== 'available') {
    parts.push(`📌 Status: ${avail === 'sold' ? 'SOLD' : 'Reserved'}`);
  }

  // DM CTA
  parts.push('💬 Interested? Send a DM!');

  return parts.join('\n');
}

function jobNarrative(post: Post): string | null {
  const meta = post.metadata || {};
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  const title = meta.jobTitle;
  if (title) {
    parts.push(`💼 Position: ${title}`);
  }

  const jobType = meta.jobType;
  if (jobType) {
    parts.push(`📋 Type: ${capitalize(jobType.replace('-', ' ').replace('_', ' '))}`);
  }

  const salary = meta.salary;
  if (salary) {
    const formatted = formatNaira(salary);
    parts.push(`💰 Salary: ${formatted || salary}`);
  }

  const workMode = meta.workMode;
  if (workMode) {
    parts.push(`🏢 Work mode: ${capitalize(workMode.replace('-', ' ').replace('_', ' '))}`);
  }

  if (meta.requirements) {
    parts.push(`📝 Requirements: ${meta.requirements}`);
  }

  parts.push('💬 Interested? Send a DM for details!');

  return parts.join('\n');
}

function servicesNarrative(post: Post): string | null {
  const meta = post.metadata || {};
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  const name = meta.serviceName;
  if (name) {
    parts.push(`🛠️ Service: ${name}`);
  }

  const cat = meta.serviceCategory;
  if (cat) {
    parts.push(`🏷️ Category: ${capitalize(cat)}`);
  }

  const rate = meta.rate;
  const rateType = meta.rateType;
  if (rate != null) {
    const formatted = formatNaira(rate);
    const suffix = rateType === 'hourly' ? '/hr' : rateType === 'flat' ? ' (flat rate)' : ' per project';
    parts.push(`💰 Rate: ${formatted || rate}${suffix}`);
  }

  const area = meta.serviceArea;
  if (area) {
    parts.push(`📍 Service area: ${area}`);
  }

  const avail = meta.availability;
  if (avail) {
    parts.push(`✅ Status: ${capitalize(avail)}`);
  }

  parts.push('💬 Drop a DM to book!');

  return parts.join('\n');
}

function eventNarrative(post: Post): string | null {
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  // Date and time
  const date = post.eventDate ?? post.metadata?.eventDate;
  const time = post.eventTime ?? post.metadata?.eventTime;
  if (date || time) {
    const dateStr = date
      ? new Date(date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
      : '';
    parts.push(`📅 ${dateStr}${time ? ` at ${time}` : ''}`);
  }

  // Venue
  const venue = post.venue ?? post.metadata?.venue;
  if (venue) {
    const venueName = typeof venue === 'object' ? venue.name : venue;
    const venueAddr = typeof venue === 'object' ? venue.address : '';
    parts.push(`📍 Venue: ${venueName}${venueAddr ? `, ${venueAddr}` : ''}`);
  }

  // Ticket info
  const ticket = post.ticketInfo ?? post.metadata?.ticketInfo;
  if (ticket) {
    if (ticket === 'free') {
      parts.push('🎟️ Free admission');
    } else {
      const ticketPrice = formatNaira(post.ticketPrice ?? post.metadata?.ticketPrice);
      parts.push(`🎟️ Ticket: ${ticketPrice || 'Paid'}`);
    }
  }

  // Capacity
  const capacity = post.capacity ?? post.metadata?.capacity;
  if (capacity) {
    parts.push(`👥 Capacity: ${capacity} spots`);
  }

  // Organizer
  const organizer = post.organizer ?? post.metadata?.organizer;
  if (organizer) {
    parts.push(`🎤 Organized by: ${organizer}`);
  }

  // Category
  const cat = post.eventCategory ?? post.metadata?.eventCategory;
  if (cat) {
    parts.push(`🏷️ ${capitalize(cat)}`);
  }

  return parts.join('\n');
}

function helpRequestNarrative(post: Post): string | null {
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  const cat = post.helpCategory ?? post.metadata?.helpCategory;
  if (cat) {
    parts.push(`🆘 Category: ${capitalize(cat)} assistance`);
  }

  const target = post.targetAmount ?? post.metadata?.targetAmount;
  if (target != null) {
    const formatted = formatNaira(target);
    parts.push(`🎯 Target: ${formatted || target}`);
  }

  const received = post.amountReceived ?? post.metadata?.amountReceived;
  if (received != null && target != null) {
    const formatted = formatNaira(received);
    const pct = Math.round((Number(received) / Number(target)) * 100);
    parts.push(`📊 Received: ${formatted || received} (${pct}%)`);
  }

  parts.push('💬 DM the poster to contribute or help!');

  return parts.join('\n');
}

function emergencyNarrative(post: Post): string | null {
  const meta = post.metadata || {};
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  const hazard = meta.hazardType;
  if (hazard) {
    parts.push(`⚠️ Type: ${capitalize(hazard.replace('_', ' '))}`);
  }

  if (meta.incidentTime) {
    parts.push(`🕐 Time: ${meta.incidentTime}`);
  }

  if (meta.incidentLocation) {
    parts.push(`📍 Location: ${meta.incidentLocation}`);
  }

  const severity = post.severity ?? post.priority;
  if (severity) {
    parts.push(`🔴 Severity: ${severity.toUpperCase()}`);
  }

  if (meta.recommendedAction) {
    parts.push(`🛡️ Recommended: ${meta.recommendedAction}`);
  }

  return parts.join('\n');
}

function alertNarrative(post: Post): string | null {
  const meta = post.metadata || {};
  const parts: string[] = [];

  const desc = (post.content || post.body || '').trim();
  if (desc) {
    parts.push(desc);
  }

  if (meta.affectedArea) {
    parts.push(`📍 Affected area: ${meta.affectedArea}`);
  }

  const priority = post.priority;
  if (priority) {
    parts.push(`🔴 Urgency: ${priority.toUpperCase()}`);
  }

  if (meta.precautions) {
    parts.push(`🛡️ Precautions: ${meta.precautions}`);
  }

  return parts.join('\n');
}

// ── Public API ───────────────────────────────────────────────────

export interface PostNarrative {
  /** The narrative text lines (joined by \n) */
  text: string;
  /** Accent color class for the card container */
  accentBg: string;
  /** Accent border color class */
  accentBorder: string;
  /** Emoji label for the content type */
  typeLabel: string;
  /** Material icon name */
  icon: string;
}

/**
 * Generate a human-readable narrative for a post's structured metadata.
 * Returns null if the post type doesn't have structured metadata.
 */
export function generatePostNarrative(post: Post): PostNarrative | null {
  switch (post.contentType) {
    case 'marketplace': {
      const text = marketplaceNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-emerald-50/70 dark:bg-[#0d2a15]/40',
        accentBorder: 'border-emerald-200/40 dark:border-emerald-800/30',
        typeLabel: 'Marketplace',
        icon: 'storefront',
      };
    }
    case 'job': {
      const text = jobNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-purple-50/70 dark:bg-[#1a0e30]/40',
        accentBorder: 'border-purple-200/40 dark:border-purple-800/30',
        typeLabel: 'Job Listing',
        icon: 'work',
      };
    }
    case 'services': {
      const text = servicesNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-teal-50/70 dark:bg-[#0d2a20]/40',
        accentBorder: 'border-teal-200/40 dark:border-teal-800/30',
        typeLabel: 'Service',
        icon: 'handyman',
      };
    }
    case 'event': {
      const text = eventNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-blue-50/70 dark:bg-[#0d1a30]/40',
        accentBorder: 'border-blue-200/40 dark:border-blue-800/30',
        typeLabel: 'Event',
        icon: 'event',
      };
    }
    case 'help_request': {
      const text = helpRequestNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-rose-50/70 dark:bg-[#2a0d0d]/40',
        accentBorder: 'border-rose-200/40 dark:border-rose-800/30',
        typeLabel: 'Help Request',
        icon: 'volunteer_activism',
      };
    }
    case 'emergency': {
      const text = emergencyNarrative(post);
      if (!text) return null;
      return {
        text,
        accentBg: 'bg-red-50/80 dark:bg-[#300a0a]/40',
        accentBorder: 'border-red-200/40 dark:border-red-800/30',
        typeLabel: 'Safety Log',
        icon: 'warning',
      };
    }
    default:
      break;
  }

  // Handle FYI alert subtype
  if (post.contentType === 'fyi' && post.metadata?.fyiType === 'alert') {
    const text = alertNarrative(post);
    if (!text) return null;
    return {
      text,
      accentBg: 'bg-amber-50/70 dark:bg-[#2c1b02]/40',
      accentBorder: 'border-amber-200/40 dark:border-amber-800/30',
      typeLabel: 'Urgent Alert',
      icon: 'warning',
    };
  }

  return null;
}
