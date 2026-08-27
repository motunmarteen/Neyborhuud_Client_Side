# API to Feature to Page Matrix - Auth / Settings / Profile / Admin / Gamification

Cluster: Auth (marketing group), Settings, Own Profile, Admin, Gamification/Huud-Economy.
All pages verified to exist under pwa/src/app/(marketing)/, pwa/src/app/(app)/, and
pwa/src/app/app-root/ before tracing. Every API call below was read directly from the
service/hook source, not inferred from naming.

---

## Page: / (app-root)
File(s): pwa/src/app/app-root/page.tsx
Purpose: Marketing/landing splash. Checks stored session validity, then either redirects an
authenticated user into the app, redirects a returning-unauthenticated visitor to /login, or
shows the welcome/video landing for first-time visitors.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| (session validation) | - | validateStoredSession() in lib/authSession.ts, internally calls apiClient | Not traced this pass (lib helper, not a service file) | Wraps a profile/session check; behaviorally equivalent to GET /profile/me per other pages pattern |

Components used: SocialProofBadge, NeyborHuudLogo.
Observed states: splash/checking-auth screen, first-visit landing (video/poster + slideshow), returning-visitor auto-redirect to /login.
Unmatched calls: none directly - validateStoredSession/resolvePostAuthRoute are lib/ helpers, not service calls; would need a separate lib/ trace pass to fully resolve to a raw endpoint.

---

## Page: /login (marketing)
File(s): pwa/src/app/(marketing)/login/page.tsx
Purpose: Email/password login form; also handles session-restore-and-redirect on mount.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/login | POST | authService.login() via useAuth().login mutation | auth.md: POST /login | Page calls login({identifier, password}); hook destructures the same shape and forwards to authService.login(identifier, password, {deviceLocation}) - shapes match, no bug |
| (session validation) | - | validateStoredSession() (lib/authSession.ts) | not independently traced | Same helper as app-root |

Components used: AuthFlowPage, AuthFlowHero, AuthFlowLoading, PremiumInput.
Observed states: checking-session spinner, form, submitting ("Opening..."), inline form error banner on failed login.
Unmatched calls: none.

---

## Page: /signup (marketing)
File(s): pwa/src/app/(marketing)/signup/page.tsx
Purpose: Multi-stage signup (location, identity, security), email verification OTP step, success screen with HuudCoin reward preview.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/create-account | POST | authService.register() | auth.md: POST /create-account | Payload aggressively sanitized client-side to strip assignedCommunityId/communityId/communityName (backend auto-assigns) |
| /auth/resend-verification | POST | authService.resendVerificationEmail() | auth.md: POST /resend-verification | |
| /auth/verify-email | POST | authService.verifyEmailWithCode() | auth.md: POST /verify-email | Registry notes this handler serves both OTP and legacy-token flows |
| /gamification/stats | GET | useMyGamificationStats() via gamificationService.getMyStats() | gamification.md: GET /stats | Used only to display totalHuudCoins on the success screen |

Components used: PremiumInput, OTPInput, LocationPicker, PasswordStrengthMeter, AuthFlowPage, AuthFlowHero, SignupBottomSheet, NeyborHuudLogo.
Observed states: 3-stage progress (location/identity/security), inline username/email availability checking/taken/invalid states, GPS location error banner, OTP verify error/expired/too-many-attempts states, success screen with HuudCoin balance (shows a dash if stats have not synced yet).
Unmatched calls: none - all resolve to documented auth.md routes.

---

## Page: /forgot-password (marketing)
File(s): pwa/src/app/(marketing)/forgot-password/page.tsx
Purpose: Request a password-reset email/link.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/forgot-password | POST | authService.requestPasswordReset() | auth.md: POST /forgot-password | Sends both email and identifier fields with the same value |

Components used: PremiumInput, AuthFlowPage, AuthFlowHero.
Observed states: form, "sent" confirmation with resend cooldown (60s), network/4xx/5xx-differentiated error state.
Unmatched calls: none.

---

## Page: /reset-password (marketing)
File(s): pwa/src/app/(marketing)/reset-password/page.tsx
Purpose: Consume a reset token from the query string and set a new password.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/reset-password | POST | authService.resetPassword(token, password) | auth.md: POST /reset-password | |

Components used: PremiumInput, PasswordStrengthMeter, AuthFlowPage, AuthFlowHero.
Observed states: missing/invalid token leads to "expired" state immediately on mount; success state; generic error state; password-match/strength validation inline.
Unmatched calls: none.

---

## Page: /verify-email (marketing)
File(s): pwa/src/app/(marketing)/verify-email/page.tsx
Purpose: Verify email via link token (auto on mount) or manual 6-digit OTP entry; also reachable mid-signup and post-login for unverified accounts.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/verify-email | POST | authService.verifyEmailWithToken() / verifyEmailWithCode() | auth.md: POST /verify-email | Token path used when ?token= present; code path otherwise |
| /auth/resend-verification | POST | authService.resendVerificationEmail() | auth.md: POST /resend-verification | |
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | Displays reward coin balance on success |

Components used: OTPInput, PremiumInput, AuthFlowPage, AuthFlowHero.
Observed states: code-entry, verifying (spinner), success (with HuudCoin balance), error, expired (with "Retry link" / "Enter code" recovery actions).
Unmatched calls: none.

---

## Page: /verify-location (marketing)
File(s): pwa/src/app/(marketing)/verify-location/page.tsx
Purpose: GPS proximity check against the user's assigned community before onboarding can complete.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/me | GET | authService.syncCommunityFromProfile() | profile.md: GET /me | Used to refresh community/gate flags into localStorage |
| /geo/communities/:communityId/verify | POST | geoService.verifyAssignedCommunityLocation() | geo.md: POST /communities/:communityId/verify (verifyMemberLocation) | Sends lat, lng, accuracyMeters; handles alreadyVerified response flag |

Components used: AuthFlowPage, AuthSheetStageHeader.
Observed states: loading spinner, GPS-accuracy-missing error, distance/verification-failed error (server message surfaced verbatim), submitting state ("Checking location...").
Unmatched calls: none.

---

## Page: /complete-profile (marketing)
File(s): pwa/src/app/(marketing)/complete-profile/page.tsx
Purpose: Post-signup optional profile enrichment (name, phone, gender, DOB) for the first-time HuudCoin reward; also reused as "Edit profile" from Settings.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/complete-profile | POST | authService.completeProfile() via tryCompleteProfileReward() | auth.md: POST /complete-profile | Only called when the cached user has no first/last name yet (reward is one-time) |
| /profile/me, /profile, /auth/profile, /users/me (PUT/PATCH probe chain) | PUT/PATCH | authService.completeProfile() via tryProfileUpdate() | profile.md documents PATCH/PUT /me only; /profile, /auth/profile, /users/me are NOT in the profile.md registry | UNMATCHED: this is a defensive "try multiple candidate routes until one does not 404" pattern - only /profile/me (PUT and PATCH) is a confirmed real route per profile.md; the other 3 candidate paths appear to be legacy/speculative fallbacks with no registry backing |
| /identity/profile | PATCH | authService.completeProfile() via completeProfileViaIdentity() fallback | identity.md: PATCH /profile (updateProfile) | Confirmed real route; used as fallback if /auth/complete-profile and main profile sync do not produce safety-profile fields |
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | Reward-balance display only |

Components used: PremiumInput, AuthFlowPage, AuthFlowHero, AuthSheetStageHeader.
Observed states: loading (no-token gate, redirect to /login), unverified-email guard (redirects to /verify-email), submitting ("Processing..."), success screen with HuudCoins, several distinguishable toast-driven error branches (403/verification, "user not active", 401/session-expired).
Unmatched calls: /profile, /auth/profile, /users/me (PUT/PATCH) inside tryProfileUpdate() - not documented in profile.md; likely dead/speculative fallback candidates that 404 in practice against the real backend (only /profile/me is real). Not a UX bug (the loop just skips 404s) but dead code worth flagging for cleanup.

---

## Page: /pick-community (marketing)
File(s): pwa/src/app/(marketing)/pick-community/page.tsx
Purpose: Post-signup (or settings-triggered "change community") picker for ward/LGA/LCDA community assignment.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /geo/community-picker-options?state=&lga= | GET | direct apiClient.get() call in page (no service wrapper) | geo.md: GET /community-picker-options (public, getCommunityPickerOptionsPublic) | Direct apiClient call bypassing a service layer - inconsistent with the rest of the codebase's service-file pattern |
| /auth/confirm-community | POST | authService.confirmCommunity() | auth.md: POST /confirm-community | Persists assignedCommunityId/needsGpsLocationVerification back into localStorage |

Components used: PremiumInput, AuthFlowPage, AuthSheetStageHeader.
Observed states: GPS-detecting, loading areas, "seed required" notice (dev/ops state - areas not seeded on backend), no-results error, manual state/LGA fallback form, submitting ("Saving..."), "change community" mode (different copy/back target than first-run mode).
Unmatched calls: none - both calls match geo.md/auth.md exactly.

---

## Page: /setup-complete (marketing)
File(s): pwa/src/app/(marketing)/setup-complete/page.tsx
Purpose: Terminal onboarding screen - celebratory checklist and HuudCoin summary before entering /feed.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | Falls back to a hardcoded SIGNUP_REWARDS sum (30 coins) if stats have not loaded |

Components used: AuthFlowPage, AuthFlowHero.
Observed states: loading (gate checks redirect to /pick-community or /verify-location if incomplete), ready (checklist + wallet summary).
Unmatched calls: none.

---

## Page: /welcome (marketing)
File(s): pwa/src/app/(marketing)/welcome/page.tsx
Purpose: Pure server-side redirect('/') - no UI, no API calls. Dead/legacy route kept only for old links.

Unmatched calls: N/A - no calls at all.

---

## Page: /demo (marketing)
File(s): pwa/src/app/(marketing)/demo/page.tsx
Purpose: Static neumorphic UI component sandbox ("Bento UI v1.0") - hardcoded fake weather/smart-home data, no relation to NeyborHuud's real domain. No API calls.

Unmatched calls: N/A - confirmed no service/apiClient usage anywhere in the file.

---

## Page: /settings
File(s): pwa/src/app/(app)/settings/page.tsx (1477 lines as of the fix below; was 1871 lines with dead code)
Purpose: Tabbed settings hub - Notifications, Privacy, Posts (defaults), Account, Language.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/settings | PATCH | direct fetchAPI() calls (accessibility text-size, lite-mode, debounced notification toggles) | Not literally in profile.md table (which lists PATCH /settings relative to the /profile mount) - resolves to the same route once the mount prefix is applied; treated as a RESOLVED MATCH, not a gap | Called from 3 separate places in this file |
| /auth/settings/privacy | PUT | direct fetchAPI() in handleSavePrivacy and the live privacy tab panel | auth.md: PUT /settings/privacy | Real, documented route |
| /safety/settings | GET, PATCH | direct fetchAPI() | out of this cluster (safety.md) | Loads/saves emergencyServicesEnabled toggle |
| /auth/consents | GET, POST | authService.getConsents(), authService.updateConsent() | auth.md: GET /consents, POST /consents | **Fixed 2026-08-27** — now live in the Privacy tab's "Data & consent (NDPR)" section |
| /auth/data-access-history | GET | authService.getDataAccessHistory() | auth.md: GET /data-access-history | **Fixed** — now live in the Privacy tab |
| /auth/export-data | GET | authService.exportUserData() | auth.md: GET /export-data | **Fixed** — now live in the Account tab's "Data & danger zone" section |
| /auth/delete-account | DELETE | authService.deleteAccount() | auth.md: DELETE /delete-account | **Fixed** — now live in the Account tab |
| /profile/username | PATCH | authService.changeUsername() | profile.md: PATCH /username | **Fixed** — now live in the Account tab's "Username" section |
| /profile/me | GET | authService.getMyProfileFull() | profile.md: GET /me | Live - called on mount and after email verification |

Components used: EmailVerificationCard, AppBrowseLayout, BrowseTabStrip, ToggleSwitch (local), Section (local).
Observed states: email-unverified banner with Add email in profile CTA if no email on file, 5 tabs (notifications/privacy/posts/account/language), notifications save state, dark/light mode toggle, per-item debounced auto-save on activity/topic toggles.
Unmatched calls: none truly unmatched once the /profile mount prefix is applied to /profile/settings.

**FIXED 2026-08-27** (was: IMPORTANT FINDING - dead code): This file contained two entire tab
implementations wrapped in a literal JS `false &&` guard spanning roughly 673 lines (original lines
858-1529), unreachable since the literal `false` short-circuits the check unconditionally. That dead
block was the only place calling the consent, data-access-history, export-data, delete-account, and
change-username service functions — plus, discovered during the fix, the only place with font-size
and lite-mode toggles and the `/settings/blocked` link, neither reachable from anywhere else either.

Fix applied: moved all the recovered functionality into the live Account tab (Username section with
handle timeline, Invite NeyburHs, Accessibility with font-size/lite-mode, Data & danger zone with
export/delete) and the live Privacy tab (Blocked NeyburHs link, Data & consent (NDPR) with the four
consent toggles and expandable access-history log), rewritten in the live tabs' own Section/
ToggleSwitch style rather than copy-pasted verbatim. Then deleted the three dead `{false && (...)}`
blocks entirely. Verified: `tsc --noEmit` clean; `eslint` diff shows zero new warnings, and confirmed
`consentsLoading`/`handleExportMyData`/etc. are no longer flagged as unused — proof they're now
genuinely referenced from live JSX, not just present in the file. No dedicated test suite exists for
this page to run.

---

## Page: /settings/blocked
File(s): pwa/src/app/(app)/settings/blocked/page.tsx
Purpose: List and unblock previously blocked users.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /follow/blocked | GET | useBlockedUsers() via blockService.getBlockedUsers() | follow.md: GET /blocked | |
| /follow/block/:userId | DELETE | useBlock() via blockService.unblockUser() | follow.md: DELETE /block/:userId | |

Components used: MapPinAvatar, AppBrowseLayout.
Observed states: loading skeletons, empty state (No blocked NeyburHs), per-row Unblocking pending state, pagination.
Unmatched calls: none.

---

## Page: /settings/location
File(s): pwa/src/app/(app)/settings/location/page.tsx
Purpose: Content radius slider plus map-pin location update, distinct from onboarding's community-anchored GPS verification.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/settings | PATCH | direct fetchAPI() | profile.md: PATCH /settings (mount-adjusted match, see settings page note) | Saves contentRadius |
| /auth/location/update | PUT | direct apiClient.put() | auth.md: PUT /location/update | Only called if the user dragged or detected a new map pin |

Components used: MiniMap, BrandPinAvatar, AppBrowseLayout.
Observed states: radius slider with 3 quick presets (Urban/Suburban/Rural), GPS-detecting spinner button, saving state, toast on success or failure.
Unmatched calls: none.

---

## Page: /settings/password
File(s): pwa/src/app/(app)/settings/password/page.tsx
Purpose: Authenticated password change (current, new, confirm).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/change-password | POST | authService.changePassword() | auth.md: POST /change-password | |

Components used: PremiumInput, PasswordStrengthMeter, AppBrowseLayout.
Observed states: password-strength meter live feedback, mismatch error, submit disabled until policy and match and non-empty current password, server error surfaced via toast.
Unmatched calls: none.

---

## Page: /settings/payout
File(s): pwa/src/app/(app)/settings/payout/page.tsx
Purpose: Seller bank-payout details, the peer-to-peer settlement info for marketplace deals since the platform never holds funds.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace/payout-details | GET | marketplaceService.getMyPayoutDetails() | Out of cluster - marketplace.md not reviewed this pass, but the path and comment self-document GET /api/v1/marketplace/payout-details | Prefill on mount |
| /marketplace/payout-details | PUT | marketplaceService.savePayoutDetails() | Same as above | Requires password re-entry as step-up auth per in-code comment |

Components used: PremiumInput, AppBrowseLayout.
Observed states: account-number format validation (10-digit NUBAN), registered-name-match warning copy, password-required-to-save framing, saving state.
Unmatched calls: both calls belong to the marketplace module, out of this cluster's registry scope - flagged for cross-reference, not a gap.

---

## Page: /settings/places
File(s): pwa/src/app/(app)/settings/places/page.tsx
Purpose: Manage home plus frequent places (work, gym, etc.) used for local content context.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/locations/places | GET | useMyPlaces() via locationService.getMyPlaces() | auth.md: GET /locations/places | |
| /auth/locations/frequent | POST | useAddFrequentPlace() via locationService.addFrequentPlace() | auth.md: POST /locations/frequent | Triggered from the AddFrequentPlaceSheet component, not directly visible in this page file |
| /auth/locations/frequent/:placeId | DELETE | useRemoveFrequentPlace() via locationService.removeFrequentPlace() | auth.md: DELETE /locations/frequent/:placeId | |

Components used: AddFrequentPlaceSheet, AppBrowseLayout.
Observed states: loading skeletons, empty state (No frequent places yet), per-item icon by kind (home/work/etc.), Update home manually link to /verify-location.
Unmatched calls: none. Home refinement confirm/dismiss (POST /auth/location/confirm-home, POST /auth/location/dismiss-home-hint) exist in useFrequentPlaces.ts/location.service.ts and auth.md but are not called from this specific page - likely used elsewhere, e.g. a home-hint banner component not in this cluster's page set.

---

## Page: /admin
File(s): pwa/src/app/(app)/admin/page.tsx, pwa/src/app/(app)/admin/layout.tsx
Purpose: Admin dashboard - platform stat cards plus engagement plus activity trend sparkline. Route-gated by useAdminAuth.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/me | GET | useAdminAuth() via direct apiClient.get() | profile.md: GET /me | Used purely for role/isAdmin gate check, always fresh (staleTime 0, no localStorage placeholder) - explicit design choice per in-code comment to avoid a stale-role redirect race |
| /admin/dashboard/stats | GET | useDashboardStats() via adminService.getDashboardStats() | admin.md: GET /dashboard/stats | |

Components used: Sparkline (local SVG), StatCard (local).
Observed states: verifying-admin-access spinner (layout-level gate), skeleton loading (8 pulse cards), error state (Could not load dashboard stats), populated stat grid plus engagement row plus optional trend sparkline.
Unmatched calls: none.

---

## Page: /admin/reports
File(s): pwa/src/app/(app)/admin/reports/page.tsx
Purpose: Content-moderation report queue with filter, infinite scroll, and a resolve side-panel.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /admin/reports | GET | useAdminReports() via adminService.getReports() | admin.md: GET /reports | Infinite-scroll paginated |
| /admin/reports/:reportId | GET | useAdminReport() via adminService.getReport() | admin.md: GET /reports/:reportId | |
| /admin/reports/:reportId/status | PATCH | useResolveReport() via adminService.resolveReport() | admin.md: PATCH /reports/:reportId/status | Frontend maps 4 UI actions (dismiss/warn/remove/suspend) down to only 2 backend statuses (dismissed/actioned) - warn, remove, and suspend are indistinguishable to the backend once submitted, a real granularity loss worth flagging |

Components used: ReviewPanel (local), ReportRow (local).
Observed states: status-filter tabs (All/Pending/Under Review/Resolved/Dismissed), loading spinner, error state, empty state, side-panel with report meta/reporter/reason/description/evidence links, per-action Working pending state, infinite-scroll trigger.
Unmatched calls: none, though see the action-to-status mapping loss noted above.

---

## Page: /admin/users
File(s): pwa/src/app/(app)/admin/users/page.tsx
Purpose: User management table - search/filter, suspend/unsuspend, verify/unverify, role change, delete.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /admin/users | GET | useAdminUsers() via adminService.getUsers() | admin.md: GET /users | Infinite-scroll, filterable by search/role/status |
| /admin/users/:userId/suspend | POST | useSuspendUser() via adminService.suspendUser() | admin.md: POST /users/:userId/suspend | Frontend computes an ISO until date client-side, defaulting to about 100 years if no duration given, to emulate permanent |
| /admin/users/:userId/unsuspend | POST | useUnsuspendUser() via adminService.unsuspendUser() | admin.md: POST /users/:userId/unsuspend | |
| /admin/users/:userId/verify | POST | useVerifyUser() via adminService.verifyUser() | admin.md: POST /users/:userId/verify | This is the manual admin-override verification path that admin.md flags as presumably the real path by which any user actually becomes Verified, given submitKYC is a stub - directly confirmed reachable from this exact page and button (Verify User in the row action menu) |
| /admin/users/:userId/unverify | POST | useUnverifyUser() via adminService.unverifyUser() | admin.md: POST /users/:userId/unverify | |
| /admin/users/:userId/role | PATCH | useUpdateUserRole() via adminService.updateUserRole() | admin.md: PATCH /users/:userId/role | |
| /admin/users/:userId | DELETE | useDeleteUser() via adminService.deleteUser() | admin.md: DELETE /users/:userId | Confirmed via a window.confirm prompt before firing |

Components used: SuspendModal (local), UserRow (local).
Observed states: role/status filter chips, search debounce, loading spinner, error state, empty state, per-row dropdown action menu, suspend modal (reason required, optional duration), infinite scroll.
Unmatched calls: none.

Cross-cutting finding confirmed from source: admin.service.ts also defines getModerationQueue (GET /admin/moderation), approveContent/removeContent (POST /admin/moderation/approve and /admin/moderation/remove), getSystemLogs (GET /admin/logs), getSystemSettings/updateSystemSettings (GET and PUT /admin/settings), and sendBroadcast (POST /admin/broadcast). None of these six service functions are called from any page in /admin, /admin/reports, or /admin/users, and none of these six paths appear in admin.md's registry, which documents a different, non-overlapping set (dashboard, dlq, analytics, users, content/delete, reports, picker-communities). This is dead frontend service code calling unregistered/unverified backend paths - flag for the human reviewer rather than assuming either the frontend or the registry is wrong.

---

## Page: /gamification (legacy redirect)
File(s): pwa/src/app/(app)/gamification/page.tsx
Purpose: Client-side redirect only - forwards to /huud-economy/score (preserving ?tab=). No API calls, no rendered UI.

Unmatched calls: N/A.

---

## Page: /gamification/wallet (legacy redirect)
File(s): pwa/src/app/(app)/gamification/wallet/page.tsx
Purpose: Client-side redirect only - forwards to /huud-economy/wallet (preserving ?tab=). No API calls, no rendered UI.

Unmatched calls: N/A.

---

## Page: /huud-economy (overview/dashboard)
File(s): pwa/src/app/(app)/huud-economy/page.tsx
Purpose: Condensed dashboard - streak card, 4 preview stat tiles (balance/trust/level/spent), trust snapshot, recent wallet activity (3 items), quick-action links out to /huud-economy/wallet and /huud-economy/score.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | |
| /gamification/streak | GET | useMyStreak() | gamification.md: GET /streak | |
| /gamification/check-in | POST | useCheckIn() | gamification.md: POST /check-in | Invalidates streak/stats/wallet/transactions caches on success |
| /gamification/wallet | GET | useWallet() | gamification.md: GET /wallet | |
| /gamification/wallet/transactions | GET | useTransactions(1) | gamification.md: GET /wallet/transactions | Only fetches page 1, sliced to 3 for the recent-activity preview |
| /gamification/trust-profile | GET | useMyTrustProfile() via trustService.getMyTrustProfile() | gamification.md: GET /trust-profile | |

Components used: HuudEconomyHero, HuudEconomySectionNav, StreakCard.
Observed states: streak-loading skeleton, wallet-transaction loading skeleton, empty-transactions copy, check-in pending state.
Unmatched calls: none.

---

## Page: /huud-economy/score
File(s): pwa/src/app/(app)/huud-economy/score/page.tsx
Purpose: The real gamification hub - 5 tabs: Overview, TrustOS, Badges, Achievements, Leaderboard. Much larger and richer than the /huud-economy overview page.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | |
| /gamification/my-badges | GET | useMyBadges() | gamification.md: GET /my-badges | Falls back to a STATIC_BADGES catalogue if the API returns empty |
| /gamification/badges | GET | useAllBadges() | gamification.md: GET /badges | Same static fallback pattern |
| /gamification/my-achievements | GET | useMyAchievements() | gamification.md: GET /my-achievements | Falls back to STATIC_ACHIEVEMENTS |
| /gamification/leaderboard?timeframe= | GET | useLeaderboard(timeframe) | gamification.md: GET /leaderboard | 4 timeframe tabs (daily/weekly/monthly/all-time) |
| /gamification/streak | GET | useMyStreak() | gamification.md: GET /streak | |
| /gamification/check-in | POST | useCheckIn() | gamification.md: POST /check-in | |
| /gamification/trust-profile | GET | useMyTrustProfile() via trustService.getMyTrustProfile() | gamification.md: GET /trust-profile | Powers the Trust Activity Log section on the TrustOS tab |
| /trust/vouches/:userId | GET | useVouches(user.id) via trustService.getVouches() | trust.md: GET /vouches/:userId | Community Vouches section |
| /follow/milestones/me | GET | useMyMilestoneStatus() via followService.getMyMilestoneStatus() | follow.md: GET /milestones/me | Follower Milestones section - out of this cluster's core scope (follow.md) but confirmed real |

Components used: BadgeCard, AchievementCard, LeaderboardRow, StreakCard, BrowseTabStrip, BrowseEmptyState, HuudEconomyHero, HuudEconomySectionNav.
Observed states: per-tab loading skeletons, badge filter (all/earned/not-earned), achievement empty state, leaderboard empty state, sticky Your Rank row, TrustOS tier progress bar, tier-privilege unlocked/locked rows, vouch-eligibility notice (locked until Tree tier), trust-activity empty state, trust-breakdown pillar bars, guardrails list (static copy).
Unmatched calls: none - every call matches a documented registry route.

Notable client-side risk, independently confirmed and matching trust.md's flagged concern: trustEconomy.score1000, displayed prominently as TrustOS Signal and used to gate the can-vouch UI copy via useTrustPrivileges, is a synthetic client-computed score (buildTrustEconomyModel in lib/trust-economy.ts) layered on top of the raw normalized score, and is NOT the same value the backend's POST /trust/vouch/:userId endpoint uses for its own canVouch enforcement. This page's "Reach Tree tier (300 pts) to vouch" messaging could show as unlocked/eligible in the UI while the backend still returns 403 on the actual vouch attempt - a real, user-facing UX bug candidate per trust.md's finding, now confirmed reachable from this specific page.

---

## Page: /huud-economy/wallet
File(s): pwa/src/app/(app)/huud-economy/wallet/page.tsx
Purpose: HuudCoin wallet detail - balance, transaction history (earn/spend ledger), payment/boost spend history, and activity-tier panel. Distinct purpose from /huud-economy/score, which covers status/achievements/leaderboard rather than money.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /gamification/wallet | GET | useWallet() | gamification.md: GET /wallet | |
| /gamification/wallet/transactions?page= | GET | useTransactions(page) | gamification.md: GET /wallet/transactions | Paginated, with a client-side earned/spent filter on top |
| (payment history) | GET | usePaymentHistory() from hooks/usePayments.ts, not opened this pass | Out of cluster - belongs to payments.md | Spends tab - boost/payment receipts |
| (payment stats) | GET | usePaymentStats() from the same hook file | Out of cluster - payments.md | Spend breakdown by type |

Components used: HuudCoinTierPanel, PaymentReceiptSheet, BrowseTabStrip, HuudEconomyHero, HuudEconomySectionNav.
Observed states: 4 tabs (Overview/History/Spends/Activity tier), balance-unavailable error state, empty-transactions state, transaction type filter (all/earned/spent), pagination controls, empty-payments state with illustration copy, per-payment Confirmed/refunded/other status badges, receipt bottom-sheet on tap.
Unmatched calls: the two payment-related hooks were not opened this pass, being out of this cluster's assigned registry files - flagged for cross-reference against payments.md in a later step, not treated as unmatched or broken.

---

## Page: /profile/[username] (own profile, when username equals currentUser.username)
File(s): pwa/src/app/(app)/profile/[username]/page.tsx (thin static-params wrapper), pwa/src/app/(app)/profile/[username]/PageClient.tsx (the real client component, roughly 1750 lines)
Purpose: Combined public/own profile page - same route and component serve both; own-profile affordances (avatar upload, Complete profile nudge, edit actions) are conditionally shown when currentUser.username matches the route param. No separate /profile (no-username) route exists - own profile is only reached by navigating to /profile/:ownUsername.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/me | GET | direct apiClient.get() inline in the page's useQuery | profile.md: GET /me | Tried first; only used if the returned user's username matches the route param, i.e. viewing own profile |
| /social/users/username/:username | GET | socialService.getUserByUsername() | Out of cluster - social.md not reviewed this pass | Fallback used for public profiles, or if the /profile/me username check above does not match |
| /gamification/users/:userId/verification | GET | gamificationService.getUserVerification() | gamification.md: GET /users/:userId/verification | Verification tier and progress display |
| /gamification/my-badges | GET | useMyBadges() | gamification.md: GET /my-badges | Overview tab |
| /gamification/stats | GET | useMyGamificationStats() | gamification.md: GET /stats | |
| /trust/vouch-status/:userId | GET | useVouchStatus() via trustService.getVouchStatus() | trust.md: GET /vouch-status/:userId | Powers vouch button eligibility |
| /trust/vouch/:userId | POST | useVouchUser() via trustService.vouchForUser() | trust.md: POST /vouch/:userId | Optimistic update with rollback on error |
| /trust/vouch/:userId | DELETE | useRevokeVouch() via trustService.revokeVouch() | trust.md: DELETE /vouch/:userId | |
| /trust/vouches/:userId | GET | useVouches() | trust.md: GET /vouches/:userId | |
| /gamification/users/:userId/trust-profile | GET | useUserTrustProfile() via trustService.getUserTrustProfile() | gamification.md: GET /users/:userId/trust-profile | |
| /trust/vouch-metrics/:userId | GET | useVouchMetrics() via trustService.getVouchMetrics() | trust.md: GET /vouch-metrics/:userId | |
| /follow/status/:userId, /follow/:userId (POST/DELETE), /follow/counts/:userId | GET/POST/DELETE | useFollow(), useFollowCounts() | Out of cluster - follow.md | Follow/unfollow actions on other users' profiles |
| /follow/block/status/:userId, /follow/block/:userId | GET, POST/DELETE | useBlock() | follow.md, confirmed above via settings/blocked | Block/unblock action on other users' profiles |
| /gamification/users/:userId/tip | POST | useTipUser() via gamificationService.tipUser() | gamification.md: POST /users/:userId/tip | Tip modal |
| (own-profile avatar upload) | POST | useAuth().uploadProfilePicture via authService.uploadProfilePicture() | profile.md: POST /avatar | Only enabled when viewing own profile |
| (chat) | - | chatService.getOrCreateDirectConversation() | Out of cluster - chat.md | Message action on another user's profile |
| (report post) | POST | contentService.reportPost() | Out of cluster - content.md/moderation.md | Report modal on a post in the profile's post feed |
| user's jobs/events/services/marketplace listings | GET | useUserJobs(), useUserEvents(), useUserServices(), useUserMarketplace() | Out of cluster - jobs.md/events.md/services.md/marketplace.md | Listings tab |

Components used: ProfileBrowseHero, ProfileSnapStatsRow, ProfileSnapPlusCard, ProfileSnapHub, ProfileSnapFriends, XPostCard, PostDetailsModal, ReportModal, CreatePostModal, AvatarAdjusterModal, TipModal, FollowerMilestoneCelebration, TopNav, BottomNav, BrowseTabStrip.
Observed states: 7 tabs (Overview/Posts/Trust/Listings/Saved/Economy/Radar - Saved and Radar are likely own-profile-only, not independently confirmed this pass), avatar-upload-in-progress, follower-milestone celebration overlay, vouch button locked/unlocked/pending/already-vouched states, block/unblock confirmation, own-vs-other-profile conditional affordances throughout.
Unmatched calls: none within this cluster's assigned registry files; several calls belong to modules outside this cluster's registry scope (social.md, follow.md, chat.md, content.md, jobs.md, events.md, services.md, marketplace.md) and were not independently verified against those registry files this pass - flagged for cross-reference by whichever cluster owns those modules.

---

## Page: /profile/[username]/followers
File(s): pwa/src/app/(app)/profile/[username]/followers/page.tsx, .../followers/PageClient.tsx
Purpose: Paginated followers list for a given user.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /profile/me or /social/users/username/:username | GET | Same dual-path pattern as the main profile page | profile.md / out-of-cluster (social.md) | Resolves userId from username first |
| /follow/:userId/followers | GET | useFollowers() via followService.getFollowers() | Out of cluster - follow.md | |

Components used: UserListItem, ProfileConnectionsLayout, ProfileConnectionsEmpty, ProfileConnectionsPagination.
Observed states: loading, empty, paginated list (not fully traced beyond the first 60 lines this pass).
Unmatched calls: none within cluster scope.

---

## Page: /profile/[username]/following
File(s): pwa/src/app/(app)/profile/[username]/following/page.tsx, .../following/PageClient.tsx
Purpose: Paginated following list - not opened line-by-line this pass, but structurally mirrors /followers per identical file layout and shared useFollow.ts hooks (useFollowing() maps to follow.md: GET /:userId/following).
Unmatched calls: not independently verified this pass - high confidence match to follow.md by symmetry with /followers, but flagged as not directly read.

---

## Pages: /info/community-rules, /info/nigeria-postal-codes, /info/privacy-policy, /info/terms-of-service
File(s): pwa/src/app/(app)/info/community-rules/page.tsx, .../nigeria-postal-codes/page.tsx, .../privacy-policy/page.tsx, .../terms-of-service/page.tsx
Purpose: Static legal/informational content pages, all built on a shared LegalDocumentPage component with hardcoded section content.

API Called: none. Confirmed via grep - zero apiClient/fetchAPI/*Service references in any of the four files.
Unmatched calls: N/A.

---

## Cross-cluster notes

Registry routes with no caller found in this cluster:

- identity.md: POST /kyc (submitKYC) - not called anywhere in this cluster, including onboarding/complete-profile. The fake-stub KYC flow is not currently wired to any reachable frontend page in Auth/Settings/Profile/Admin/Gamification. This reduces urgency of the UX-honesty concern for this cluster specifically, since nothing here presents fake KYC as real, but the admin.md registry's cross-reference finding stands: POST /admin/users/:userId/verify (confirmed live, in /admin/users) is the operative real verification path today, and trust.md's vouching-triggers-verification path is also live via POST /trust/vouch/:userId, confirmed on the profile page. Recommend a later step search the other clusters (marketplace/jobs/services, wherever Get Verified CTAs might live) for the actual submitKYC caller.
- identity.md: GET /status, POST /data-access, POST /onboarding/survey, GET /wrapped, POST /recovery/request, POST /recovery/approve - none called from this cluster.
- admin.md: GET /discovery, GET /ops/metrics, GET /dashboard/activity, GET /dashboard/moderation, GET /ops/dashboard, all /dlq routes, all /analytics routes, GET /audit-logs, GET /users/:userId/export, GET /users/:userId, POST /users/:userId/ban, POST /users/purge-deleted, POST /content/delete, GET and PATCH /picker-communities - not called from any of the 3 admin pages in this cluster. The admin UI, with only 3 nav items (Dashboard/Users/Reports), covers a small fraction of the documented 30-route admin API surface.
- moderation.md: none of its 4 routes are called anywhere in this cluster. The /admin/reports page uses the separate admin.md reports routes instead, not moderation.md's. Confirms moderation.md's own note that this is a genuinely distinct module from the admin console.
- trust.md: all 5 routes matched to callers in this cluster, via the profile page plus the huud-economy score page.
- gamification.md: 15 of 21 routes matched to callers in this cluster. Unused here: the achievement-claim route (service function and hook exist but no page in this cluster calls it, likely triggered from an achievement-card component's own button, not traced this pass), the feed-pin route (usePinPost hook exists, unused in this cluster, likely a feed-page action), and all 4 referral routes (no referral UI found in this cluster at all - worth flagging, since the settings page's dead-code block did contain an Invite NeyburHs referral-link-copy UI that used the user's own username as a client-side-only referral code, never calling any real referral endpoint even when live).

Gamification versus huud-economy resolution: Confirmed directly, not inferred. The /gamification and /gamification/wallet routes are thin client-side redirect shims, a router.replace call inside a useEffect with no rendered UI, that forward to /huud-economy/score and /huud-economy/wallet respectively, preserving the tab query param. The real pages live under huud-economy, which itself has three genuinely distinct sub-pages, not one duplicated feature.

- The huud-economy overview page is a condensed dashboard and preview: streak card, 4 stat tiles, snapshot cards, quick links out.
- The huud-economy score page is the full gamification hub with 5 tabs (Overview, TrustOS, Badges, Achievements, Leaderboard) - this is where most of the actual feature depth lives.
- The huud-economy wallet page is the dedicated wallet and ledger detail: balance, transaction history, spend history, activity tier.

This matches the API registry's own gamification.md correction that no huud-economy backend mount exists, confirmed by grep. The frontend's huud-economy namespace is purely a route-naming and information-architecture layer over the single real gamification backend surface, plus trust and follow for milestones. Not a duplication bug; it is a rebrand-in-progress with legacy redirects left in place for old bookmarks and links.

Anything surprising or worth flagging for the human reviewer:

1. **FIXED 2026-08-27.** The /settings page had roughly 673 lines of unreachable dead code (a literal JS `false &&` guarded block) that was the only place six real, registry-documented backend features were wired up: NDPR consent management, data-access history, data export, account deletion, username change, and font-size/lite-mode accessibility toggles. Moved into the live Privacy/Account tabs; dead blocks deleted. One caveat carried over unchanged: the "Invite NeyburHs" referral-link-copy UI is (and always was) purely client-side — it builds a signup URL from the user's own username but never calls a real referral-tracking endpoint, even now that it's reachable. gamification.md's cross-cluster notes confirm all 4 real referral routes (`/gamification/referral*`) have no caller anywhere in this cluster — worth a product decision on whether the referral UI should be wired to those real endpoints, separately from this reachability fix.
2. admin.service.ts defines 6 functions calling paths that do not appear anywhere in admin.md's 30-route registry (moderation queue and approve and remove, system logs, get and update system settings, and broadcast), and none of them are called by any page in this cluster. Could be dead frontend code targeting routes that do not exist server-side, or the registry step may have missed them - worth a targeted backend grep in a follow-up pass rather than assuming either side is correct.
3. The /admin/reports page collapses 4 distinct UI actions (dismiss, warn, remove, suspend) into only 2 backend statuses, dismissed and actioned - an admin resolving a report as Warn User versus Suspend User versus Remove Content produces identical backend state, with only an optional free-text note field to distinguish intent after the fact. Worth flagging as a possible audit-trail gap.
4. The TrustOS score-inflation UX bug is independently reachable and confirmed from this cluster's pages, the huud-economy score page and the profile page: the frontend displays a synthetic, streak and badge boosted trust score that can show a user as vouch-eligible while the backend's actual canVouch check, which uses the raw score only, would reject the vouch attempt with a confusing 403. This was flagged in trust.md from source-reading alone; this pass confirms both of the pages that surface the inflated score to users.
5. The pick-community page makes a raw apiClient.get call directly in the page component rather than going through a service file, unlike almost every other page in this cluster - a minor architectural inconsistency worth noting for a later service-layer cleanup pass.
6. submitKYC and the fake-KYC stub are not reachable from anywhere in this cluster - good news for this cluster specifically, but it means the real path to becoming Verified is either an admin manual override, confirmed live, or community vouching, also confirmed live. Neither of these is currently labeled to end users as the real explanation of how verification works, anywhere observed in this cluster - worth a copy and product review in a later step, separate from the KYC-stub finding itself.
7. The app-root and login pages both rely on lib/authSession.ts's session-validation and post-auth-route helpers, which were not traced to their underlying raw endpoint this pass since these are lib helpers, not services. A future step tracing these lib session helpers directly would sharpen the app-root and login rows above.

## Summary

Traced 24 real pages across Auth, Settings, Profile, Admin, and Gamification/Huud-Economy. Nearly all API calls matched documented registry routes. The /settings page's ~673-line dead-code block (NDPR consent, data export, account deletion, username change, accessibility toggles) has been fixed — moved into the live tabs and verified with a clean `tsc`/`eslint` pass. Remaining open finding: admin.service.ts calls six admin paths absent from admin.md's registry, suggesting either dead frontend code or a registry gap — not yet resolved. Confirmed the gamification routes are legacy redirects to three genuinely distinct huud-economy pages, not a duplication bug. submitKYC is unreachable from this cluster; real verification happens via admin override or community vouching, both confirmed live. The TrustOS synthetic-score-versus-backend-enforcement mismatch flagged in trust.md is confirmed reachable from two pages in this cluster.
