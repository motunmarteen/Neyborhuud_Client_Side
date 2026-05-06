/**
 * Static Gamification Catalogue
 *
 * Defines every badge and achievement available on NeyborHuud.
 * Used as a fallback when the backend gamification APIs are not yet live,
 * so users always see the full catalogue (earned items are overlaid by the API).
 */

import { Badge, Achievement } from "@/types/api";

// ─── BADGES ──────────────────────────────────────────────────────────────────
//
// Rarity tiers: common → uncommon → rare → epic → legendary
//
export const STATIC_BADGES: Badge[] = [
  // ── Onboarding ──
  {
    id: "badge_welcome",
    name: "Welcome Neighbour",
    icon: "👋",
    rarity: "common",
    description: "Joined NeyborHuud and completed your profile.",
  },
  {
    id: "badge_verified",
    name: "Verified Identity",
    icon: "✅",
    rarity: "common",
    description: "Verified your identity and location on NeyborHuud.",
  },
  // ── Feed / Content ──
  {
    id: "badge_first_post",
    name: "First Words",
    icon: "📝",
    rarity: "common",
    description: "Made your very first post in the community feed.",
  },
  {
    id: "badge_conversation",
    name: "Conversation Starter",
    icon: "🗣️",
    rarity: "common",
    description: "Received your first comment on a post.",
  },
  {
    id: "badge_prolific",
    name: "Prolific Poster",
    icon: "📣",
    rarity: "uncommon",
    description: "Published 25 posts in your community.",
  },
  {
    id: "badge_content_creator",
    name: "Content Creator",
    icon: "🎨",
    rarity: "rare",
    description: "Published 100 posts — a true voice of the neighbourhood.",
  },
  // ── Social ──
  {
    id: "badge_good_neighbour",
    name: "Good Neighbour",
    icon: "🤝",
    rarity: "uncommon",
    description: "Helped 5 neighbours by responding to help requests.",
  },
  {
    id: "badge_community_pillar",
    name: "Community Pillar",
    icon: "🏛️",
    rarity: "rare",
    description: "Consistently active for 3 months straight in your community.",
  },
  {
    id: "badge_super_connector",
    name: "Super Connector",
    icon: "🔗",
    rarity: "epic",
    description: "Connected with 50 neighbours on NeyborHuud.",
  },
  {
    id: "badge_community_hero",
    name: "Community Hero",
    icon: "🦸",
    rarity: "epic",
    description: "Helped 20 neighbours — your community counts on you.",
  },
  // ── Marketplace ──
  {
    id: "badge_market_opener",
    name: "Market Opener",
    icon: "🛍️",
    rarity: "common",
    description: "Listed your first item on the marketplace.",
  },
  {
    id: "badge_first_sale",
    name: "First Sale",
    icon: "💰",
    rarity: "uncommon",
    description: "Completed your very first marketplace sale.",
  },
  {
    id: "badge_top_seller",
    name: "Top Seller",
    icon: "🏆",
    rarity: "epic",
    description: "Successfully completed 20 marketplace sales.",
  },
  // ── Jobs ──
  {
    id: "badge_job_creator",
    name: "Job Creator",
    icon: "💼",
    rarity: "uncommon",
    description: "Posted your first job listing in the community.",
  },
  {
    id: "badge_employer",
    name: "Local Employer",
    icon: "🏢",
    rarity: "rare",
    description: "Posted 5 job listings and hired from the community.",
  },
  // ── Events ──
  {
    id: "badge_event_host",
    name: "Event Host",
    icon: "🎉",
    rarity: "uncommon",
    description: "Organised your first community event.",
  },
  {
    id: "badge_event_legend",
    name: "Event Legend",
    icon: "🎪",
    rarity: "epic",
    description: "Attended or organised 10 community events.",
  },
  // ── Services ──
  {
    id: "badge_service_pro",
    name: "Service Pro",
    icon: "🔧",
    rarity: "uncommon",
    description: "Offered your first professional service on NeyborHuud.",
  },
  {
    id: "badge_trusted_pro",
    name: "Trusted Professional",
    icon: "⭐",
    rarity: "rare",
    description: "Maintained a 4.5+ rating across 10 service bookings.",
  },
  // ── Safety ──
  {
    id: "badge_safety_guardian",
    name: "Safety Guardian",
    icon: "🛡️",
    rarity: "rare",
    description: "Reported 3 safety concerns that were verified and acted on.",
  },
  {
    id: "badge_sos_responder",
    name: "SOS Responder",
    icon: "🚨",
    rarity: "rare",
    description: "Responded to a neighbour's SOS distress alert.",
  },
  // ── Streaks / Gamification ──
  {
    id: "badge_streak_master",
    name: "Streak Master",
    icon: "🔥",
    rarity: "epic",
    description: "Maintained a 30-day consecutive daily check-in streak.",
  },
  {
    id: "badge_trusted_voice",
    name: "Trusted Voice",
    icon: "💎",
    rarity: "rare",
    description: "Reached a trust score of 75% or higher.",
  },
  {
    id: "badge_coins_collector",
    name: "HuudCoins Collector",
    icon: "🪙",
    rarity: "epic",
    description: "Accumulated 5,000 HuudCoins through community participation.",
  },
  // ── Legendary ──
  {
    id: "badge_og",
    name: "NeyborHuud OG",
    icon: "🌟",
    rarity: "legendary",
    description: "One of the first 1,000 members to join NeyborHuud.",
  },
  {
    id: "badge_legend",
    name: "Community Legend",
    icon: "👑",
    rarity: "legendary",
    description: "Reached Level 20 — a true pillar of the neighbourhood.",
  },
  {
    id: "badge_platinum",
    name: "Platinum Neighbour",
    icon: "💜",
    rarity: "legendary",
    description: "Reached the Platinum subscription tier.",
  },
];

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
//
// progress: 0 in the static catalogue — real values are supplied by the API.
//
export const STATIC_ACHIEVEMENTS: Achievement[] = [
  // ── Getting started ──
  {
    id: "ach_first_post",
    name: "First Steps",
    description: "Make your first post in the community feed.",
    progress: 0,
    goal: 1,
    completed: false,
    reward: { points: 50 },
  },
  {
    id: "ach_5_posts",
    name: "Getting Started",
    description: "Post 5 times in the community feed.",
    progress: 0,
    goal: 5,
    completed: false,
    reward: { points: 100 },
  },
  {
    id: "ach_25_posts",
    name: "Prolific Poster",
    description: "Post 25 times — your neighbours know your name.",
    progress: 0,
    goal: 25,
    completed: false,
    reward: { points: 250 },
  },
  {
    id: "ach_100_posts",
    name: "Content Machine",
    description: "Reach 100 posts in the community feed.",
    progress: 0,
    goal: 100,
    completed: false,
    reward: { points: 500 },
  },
  // ── Marketplace ──
  {
    id: "ach_first_listing",
    name: "Open for Business",
    description: "List your first item on the marketplace.",
    progress: 0,
    goal: 1,
    completed: false,
    reward: { points: 75 },
  },
  {
    id: "ach_5_sales",
    name: "Marketplace Seller",
    description: "Complete 5 successful marketplace sales.",
    progress: 0,
    goal: 5,
    completed: false,
    reward: { points: 200 },
  },
  {
    id: "ach_20_sales",
    name: "Power Seller",
    description: "Complete 20 marketplace sales.",
    progress: 0,
    goal: 20,
    completed: false,
    reward: { points: 500 },
  },
  // ── Events ──
  {
    id: "ach_attend_event",
    name: "Event Goer",
    description: "Attend your first community event.",
    progress: 0,
    goal: 1,
    completed: false,
    reward: { points: 75 },
  },
  {
    id: "ach_5_events",
    name: "Event Enthusiast",
    description: "Attend or RSVP to 5 community events.",
    progress: 0,
    goal: 5,
    completed: false,
    reward: { points: 150 },
  },
  {
    id: "ach_organise_events",
    name: "Event Organiser",
    description: "Organise 3 community events.",
    progress: 0,
    goal: 3,
    completed: false,
    reward: { points: 300 },
  },
  // ── Helping neighbours ──
  {
    id: "ach_help_5",
    name: "Helpful Neighbour",
    description: "Help 5 neighbours by responding to help requests.",
    progress: 0,
    goal: 5,
    completed: false,
    reward: { points: 200 },
  },
  {
    id: "ach_help_20",
    name: "Community Champion",
    description: "Help 20 neighbours — you are the backbone of the hood.",
    progress: 0,
    goal: 20,
    completed: false,
    reward: { points: 500 },
  },
  // ── Jobs ──
  {
    id: "ach_post_jobs",
    name: "Job Creator",
    description: "Post 3 job listings in your community.",
    progress: 0,
    goal: 3,
    completed: false,
    reward: { points: 150 },
  },
  // ── Services ──
  {
    id: "ach_offer_services",
    name: "Service Provider",
    description: "Offer 3 professional services on NeyborHuud.",
    progress: 0,
    goal: 3,
    completed: false,
    reward: { points: 200 },
  },
  // ── Streaks ──
  {
    id: "ach_streak_7",
    name: "Weekly Warrior",
    description: "Check in for 7 consecutive days.",
    progress: 0,
    goal: 7,
    completed: false,
    reward: { points: 100 },
  },
  {
    id: "ach_streak_30",
    name: "Monthly Regular",
    description: "Check in every day for 30 days in a row.",
    progress: 0,
    goal: 30,
    completed: false,
    reward: { points: 500 },
  },
  {
    id: "ach_streak_100",
    name: "Century Streak",
    description: "Maintain a 100-day check-in streak.",
    progress: 0,
    goal: 100,
    completed: false,
    reward: { points: 1500 },
  },
  // ── Social ──
  {
    id: "ach_connect_10",
    name: "Social Butterfly",
    description: "Connect with 10 neighbours on NeyborHuud.",
    progress: 0,
    goal: 10,
    completed: false,
    reward: { points: 150 },
  },
  {
    id: "ach_connect_50",
    name: "Mega Connector",
    description: "Connect with 50 neighbours.",
    progress: 0,
    goal: 50,
    completed: false,
    reward: { points: 400 },
  },
  // ── Safety ──
  {
    id: "ach_safety",
    name: "Safety Champion",
    description: "Report 3 verified safety concerns in your community.",
    progress: 0,
    goal: 3,
    completed: false,
    reward: { points: 200 },
  },
  // ── Coins ──
  {
    id: "ach_1000_coins",
    name: "Coin Collector",
    description: "Earn 1,000 HuudCoins through community participation.",
    progress: 0,
    goal: 1000,
    completed: false,
    reward: { points: 300 },
  },
  {
    id: "ach_5000_coins",
    name: "Coin Hoarder",
    description: "Accumulate 5,000 HuudCoins.",
    progress: 0,
    goal: 5000,
    completed: false,
    reward: { points: 750 },
  },
];
