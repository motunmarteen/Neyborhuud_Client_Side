# API Registry — Gamification / Wallet / Referrals

> Mount: `app.use("/api/v1/gamification", gamificationRoutes)` — `app.ts:323`
> Source: `NeyborHuud-ServerSide/src/modules/gamification/gamification.routes.ts`
>
> **Total: 21 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`).
>
> **Correction to Step 1 audit**: Step 1 flagged a possible `/gamification` vs `/huud-economy`
> route duplication as unresolved. Grepped the entire backend source directly for
> `huud-economy`/`huudEconomy` this pass — **zero matches**. No such mount or module exists in the
> current codebase. Treating that Step 1 note as stale/resolved; HuudCoin wallet, earning, and
> tipping all live under this one `/gamification` mount today.

## Daily check-in & streak
| Method | Path | Handler |
|---|---|---|
| POST | `/check-in` | `checkIn` |
| GET | `/streak` | `getStreak` |

## Stats
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/stats` | `getFullStats` | |
| GET | `/hero-stats` | `getHeroStats` | |
| GET | `/trust-profile` | `getTrustProfile` | Own trust profile — see also `trust.md` for the dedicated TrustOS/Vouch module |

## Badges
| Method | Path | Handler |
|---|---|---|
| GET | `/badges` | `getAllBadges` |
| GET | `/my-badges` | `getMyBadges` |

## Achievements
| Method | Path | Handler |
|---|---|---|
| GET | `/achievements` | `getAllAchievements` |
| GET | `/my-achievements` | `getMyAchievements` |
| POST | `/achievements/:id/claim` | `claimAchievement` |

## Leaderboard
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/leaderboard` | `getLeaderboardV2` | V2 — see finding below re: dead V1 import |

## Wallet (HuudCoin)
| Method | Path | Handler |
|---|---|---|
| GET | `/wallet` | `getWallet` |
| GET | `/wallet/transactions` | `getWalletTransactions` |
| POST | `/earn` | `earnCoins` | Comment: "fire-and-forget from frontend" |
| POST | `/users/:userId/tip` | `tipUser` |
| POST | `/feed/:postId/pin` | `pinPost` | Pin a feed post using HuudCoin |

## Referrals
| Method | Path | Handler |
|---|---|---|
| POST | `/referral` | `createReferral` |
| GET | `/referral/overview` | `getReferralOverview` |
| POST | `/referral/redeem` | `redeemReferral` (validated) |
| GET | `/referrals` | `getReferralList` |

## Per-user public stats & trust
| Method | Path | Handler |
|---|---|---|
| GET | `/users/:userId/stats` | `getPublicUserStats` |
| GET | `/users/:userId/trust-profile` | `getPublicUserTrustProfile` |
| GET | `/users/:userId/verification` | `getUserVerification` |

## Known issues found while building this registry

- **`/gamification` vs `/huud-economy` Step 1 flag does not reproduce** — see correction note
  above. No route file, no grep hit anywhere in `src/`. Resolving this Step 1 unknown rather than
  carrying it forward.
- **Dead controller imports**: `getUserStats`, `getAchievements`, and `getLeaderboard` are imported
  from `gamification.controller.js` but never wired to a route — superseded by `getFullStats`,
  `getAllAchievements`/`getMyAchievements`, and `getLeaderboardV2` respectively. Not a functional
  bug (the old exports may still be used internally or by another route file), but worth a
  source-level dead-code pass separate from the frontend rebuild.
- This module is the real backing for the "HuudCoin" economy referenced elsewhere (marketplace
  boosts, event boosts, post pinning) — useful to know for the Frontend Contract step, since a
  "wallet balance" UI element will likely need to be globally available/refetched after any
  boost/tip/pin action across other modules, not just within a wallet screen.
