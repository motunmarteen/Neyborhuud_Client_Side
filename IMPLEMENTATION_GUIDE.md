# NeyborHuud — Complete Implementation Guide
## Frontend + Backend: All Missing Features

> **Reading This Document**  
> Every section specifies exact file paths, exact function names, exact API shapes, and exact
> component patterns. All hooks follow the TanStack Query v5 pattern already established in
> `src/hooks/useMarketplace.ts`. All pages follow the layout pattern in
> `src/app/marketplace/page.tsx` (TopNav + LeftSidebar + RightSidebar + BottomNav). All types are
> already declared in `src/types/api.ts`.

---

## PHASE 1 — Core Product Pages (Jobs, Events, Services)

These three are the highest priority because their service files are 100% complete but there is
zero frontend UI. Each follows the exact same build sequence:
`hook file → component files → page files`.

---

### 1.1 — Jobs Board

**Type definitions already in `src/types/api.ts`:** `Job`, `JobApplication`, `CreateJobPayload`  
**Service file already complete:** `src/services/jobs.service.ts`

#### Step 1 — Create the hook file

**File to create:** `src/hooks/useJobs.ts`

This file must export the following hooks, each wrapping the corresponding service method:

```ts
// useJobs (infinite query — job list with filters)
// queryKey: ["jobs", filter]
// calls: jobsService.getJobs(pageParam, 20, filter)
// getNextPageParam: pagination.hasMore → pagination.page + 1

// useJob (single query)
// queryKey: ["jobs", jobId]
// calls: jobsService.getJob(jobId)
// enabled: !!jobId

// useMyApplications (single query)
// queryKey: ["jobs", "my-applications"]
// calls: jobsService.getMyApplications()

// useApplyForJob (mutation)
// mutationFn: ({ jobId, coverLetter, resume }) => jobsService.applyForJob(jobId, coverLetter, resume)
// onSuccess: invalidate ["jobs", jobId] + toast("Application submitted")

// useCreateJob (mutation)
// mutationFn: (payload) => jobsService.createJob(payload)
// onSuccess: invalidate ["jobs"] + toast("Job posted")

// useWithdrawApplication (mutation)
// mutationFn: (applicationId) => jobsService.withdrawApplication(applicationId)
// onSuccess: invalidate ["jobs", "my-applications"] + toast("Application withdrawn")

// useSaveJob (mutation)
// mutationFn: (jobId) => jobsService.saveJob(jobId)
// useSavedJobs (query) — calls: jobsService.getSavedJobs()
```

#### Step 2 — Create the card component

**File to create:** `src/components/jobs/JobCard.tsx`

Props interface:
```ts
interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
}
```

The card renders:
- Job title (large, bold, white)
- `employer?.firstName + employer?.lastName` or `employer?.username`
- `job.type` badge (full-time = green, part-time = blue, contract = yellow, freelance = purple, internship = gray)
- `job.workMode` badge (on-site, remote, hybrid)
- `job.location.lga + ", " + job.location.state`
- Salary: `₦{job.salary?.min?.toLocaleString()} – ₦{job.salary?.max?.toLocaleString()} / {job.salary?.period}` (hide if absent)
- First 3 skills as small pill badges
- `job.applications` count ("N applicants")
- `job.expiresAt` formatted as "Closes DD MMM YYYY"
- Apply button (disabled + "Applied" label when `job.hasApplied === true`)
- Save icon (filled when saved)

**File to create:** `src/components/jobs/JobFilters.tsx`

Renders a horizontal scrollable row of filter controls:
- Type: `["All", "Full-time", "Part-time", "Contract", "Freelance", "Internship"]`
- Work mode: `["All", "On-site", "Remote", "Hybrid"]`
- Category: `["All", "Tech", "Healthcare", "Education", "Finance", "Construction", "Other"]`
- Each filter emits `onChange(key, value)` to parent

**File to create:** `src/components/jobs/ApplyModal.tsx`

A modal (uses the Radix `<Dialog>` or a custom overlay) with:
- Textarea: cover letter (optional, max 1000 chars)
- File input: resume PDF/DOCX (max 5 MB)
- Submit button calling `useApplyForJob`
- Shows loading spinner during upload (service calls `apiClient.uploadFile`)

**File to create:** `src/components/jobs/CreateJobForm.tsx`

A multi-field form with:
- Title (text, required)
- Description (textarea, required)
- Type (select from `["full-time","part-time","contract","freelance","internship"]`)
- Category (select)
- Work mode (select from `["on-site","remote","hybrid"]`)
- Location fields (auto-filled from `useGeolocation` but editable)
- Salary min/max/currency/period (all optional)
- Requirements (dynamic list with +/- buttons, each entry is a string)
- Skills (dynamic tag input)
- Expires at (date picker, optional)
- Submit calls `useCreateJob`

#### Step 3 — Create the page files

**File to create:** `src/app/jobs/page.tsx`

```
Layout: TopNav + LeftSidebar + main content + RightSidebar + BottomNav
Background: bg-[#0f0f1e]

Content area structure:
  Sticky header: "Jobs" h1, icon "work", "Post a Job" green button → /jobs/create
  <JobFilters> row
  useJobs(filter) — infinite scroll
  Map over products → <JobCard> for each
  Intersection observer div at bottom → fetchNextPage when visible
  Empty state: "No jobs in your area yet"
  Error state: "Could not load jobs. Tap to retry."
```

**File to create:** `src/app/jobs/create/page.tsx`

Renders `<CreateJobForm>` centered, protected (redirect to `/login` if !user).

**File to create:** `src/app/jobs/[id]/page.tsx`

Uses `useJob(params.id)`:
- Cover banner area (gradient fallback)
- Job title, employer info, location
- Full description (prose)
- Requirements list
- Skills pills
- Salary card
- Sidebar section with: "Apply Now" button → opens `<ApplyModal>`, save icon
- Applications count

**File to create:** `src/app/jobs/my-applications/page.tsx`

Uses `useMyApplications()`:
- Lists each application as a card showing: job title, company, status badge
  (pending = gray, reviewing = blue, shortlisted = yellow, rejected = red, accepted = green)
- "Withdraw" button for pending applications → `useWithdrawApplication`

---

### 1.2 — Events

**Type definitions already in `src/types/api.ts`:** `Event`, `CreateEventPayload`  
**Service file already complete:** `src/services/events.service.ts`

#### Step 1 — Create the hook file

**File to create:** `src/hooks/useEvents.ts`

```ts
// useEvents (infinite query)
// queryKey: ["events", filter]
// calls: eventsService.getEvents(pageParam, 20, filter)

// useEvent (single query)
// queryKey: ["events", eventId]
// calls: eventsService.getEvent(eventId)

// useAttendEvent (mutation)
// mutationFn: (eventId) => eventsService.attendEvent(eventId)
// onSuccess: invalidate ["events", eventId]

// useUnattendEvent (mutation)
// mutationFn: (eventId) => eventsService.unattendEvent(eventId)

// useCreateEvent (mutation)
// mutationFn: ({ payload, onProgress }) => eventsService.createEvent(payload, onProgress)
// onSuccess: invalidate ["events"] + router.push("/events")

// useMyEvents (query)
// calls: eventsService.getMyEvents()

// useMyOrganizedEvents (query)
// calls: eventsService.getMyOrganizedEvents()

// useCancelEvent (mutation)
// mutationFn: ({ eventId, reason }) => eventsService.cancelEvent(eventId, reason)
```

#### Step 2 — Create component files

**File to create:** `src/components/events/EventCard.tsx`

Props: `{ event: Event; onAttend: (eventId: string) => void }`

Renders:
- Cover image (with `<img>` + fallback gradient based on `event.type`)
- Type badge (community = blue, sports = orange, cultural = purple, etc.)
- Title, organizer name
- Date: `format(new Date(event.startDate), "EEE, d MMM yyyy")` from `date-fns`
- Time: `format(new Date(event.startDate), "h:mm a")`
- Venue name
- Attendees count
- "Free" or `₦{event.ticketPrice}` label
- RSVP button: "Going" (filled green) if `event.isAttending`, else "Attend" (outline)
- Status badge if `event.status === "cancelled"` (show red "Cancelled" overlay)

**File to create:** `src/components/events/EventFilters.tsx`

Horizontal filter row:
- Type: `["All", "Community", "Social", "Sports", "Cultural", "Educational", "Business"]`
- Date: `["All", "Today", "This Week", "This Month"]`
- Status: `["Upcoming", "Ongoing"]`

**File to create:** `src/components/events/CreateEventForm.tsx`

Fields:
- Title (required)
- Description (textarea, required)
- Type (select from Event.type union)
- Start date + time (datetime-local input)
- End date + time (datetime-local input)
- Venue (text)
- Capacity (number, optional)
- Is Free toggle (if false, show Ticket Price field)
- Visibility (select: public / private / neighborhood)
- Cover image upload (file input, max 10 MB, shows preview)
- Tags (dynamic tag input)

Submit calls `useCreateEvent` with `onProgress` → shows upload progress bar.

#### Step 3 — Create page files

**File to create:** `src/app/events/page.tsx`

Same layout pattern as marketplace. Header: "Events" with "Create Event" button.
`<EventFilters>` row. Infinite scroll of `<EventCard>` items.

**File to create:** `src/app/events/create/page.tsx`

Protected page wrapping `<CreateEventForm>`.

**File to create:** `src/app/events/[id]/page.tsx`

Full event detail:
- Cover image header
- Title, organizer (link to `/profile/[username]`)
- Date/time/venue info card
- Full description
- Attendees section: avatar grid + count
- Ticket info (Free / ₦price)
- RSVP button using `useAttendEvent` / `useUnattendEvent`
- Share button (calls `eventsService.shareEvent(eventId)`)
- For organizer: Cancel Event button (with confirm dialog) → `useCancelEvent`

**File to create:** `src/app/events/my-events/page.tsx`

Tabs: "Attending" | "Organizing"  
"Attending" → `useMyEvents()`, "Organizing" → `useMyOrganizedEvents()`

---

### 1.3 — Services Marketplace

**Type definitions already in `src/types/api.ts`:** `Service`, `ServiceBooking`  
**Service file already complete:** `src/services/services.service.ts`

#### Step 1 — Create the hook file

**File to create:** `src/hooks/useServices.ts`

```ts
// useServices (infinite query)
// queryKey: ["services", filter]
// calls: servicesService.getServices(pageParam, 20, filter)

// useService (single query)
// queryKey: ["services", serviceId]
// calls: servicesService.getService(serviceId)

// useBookService (mutation)
// mutationFn: ({ serviceId, date, notes }) => servicesService.bookService(serviceId, date, notes)
// onSuccess: invalidate ["services", "my-bookings"] + toast("Booking request sent")

// useMyBookings (query)
// calls: servicesService.getMyBookings()

// useCreateService (mutation)
// calls: servicesService.createService(payload)

// useRateService (mutation)
// mutationFn: ({ serviceId, rating, review }) => servicesService.rateService(serviceId, rating, review)
// onSuccess: invalidate ["services", serviceId]

// useServiceReviews (query)
// queryKey: ["services", serviceId, "reviews"]
// calls: servicesService.getReviews(serviceId)
```

#### Step 2 — Create component files

**File to create:** `src/components/services/ServiceCard.tsx`

Props: `{ service: Service; onBook: (serviceId: string) => void }`

Renders:
- First image or gradient fallback
- Category badge + subcategory pill
- Provider name + verified tick if `service.isVerified`
- Star rating bar: filled stars based on `service.rating` (out of 5) + `({service.reviews} reviews)`
- Pricing: `Fixed: ₦{amount}` or `₦{amount}/hr` or `Custom`
- Availability days + hours
- Location: `service.location.lga, service.location.state`
- "Book" button → opens `<BookModal>`

**File to create:** `src/components/services/BookModal.tsx`

Fields:
- Date picker (date only, no past dates)
- Notes textarea (optional)
- Submit calls `useBookService`

**File to create:** `src/components/services/StarRating.tsx`

Reusable component — shared across Jobs, Events, Services, and Marketplace.

Props:
```ts
interface StarRatingProps {
  rating: number;         // current value (0-5, supports 0.5 steps for display)
  max?: number;           // default 5
  interactive?: boolean;  // if true, renders clickable stars
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}
```

Render logic: map `[1,2,3,4,5]` → filled/half/empty star icon based on value.
Use `material-symbols-outlined` icons: `star`, `star_half`, `star_outline`.

**File to create:** `src/components/services/ReviewCard.tsx`

Props: `{ review: { userId: string; user: User; rating: number; review?: string; createdAt: string } }`

**File to create:** `src/components/services/RateServiceModal.tsx`

Fields:
- `<StarRating interactive onChange={setRating} />`
- Review textarea (optional, max 500 chars)
- Submit calls `useRateService`

#### Step 3 — Create page files

**File to create:** `src/app/services/page.tsx`

Header: "Local Services" with "Offer a Service" button → `/services/create`.
Filter row: category chips. Infinite scroll of `<ServiceCard>` items.

**File to create:** `src/app/services/create/page.tsx`

Form fields: title, description, category (select), subcategory, pricing type/amount/currency,
availability days (multi-select checkboxes: Mon–Sun), hours text, images upload (up to 6 images).

**File to create:** `src/app/services/[id]/page.tsx`

Full detail: image carousel, provider info, star rating summary, reviews list using
`useServiceReviews`, Book button, Rate button (if user has a completed booking for this service).

**File to create:** `src/app/services/my-bookings/page.tsx`

Lists user's bookings. Status badge per booking. "Rate Service" button for completed bookings
→ opens `<RateServiceModal>`.

---

## PHASE 2 — Gamification Hub

**Service file already complete:** `src/services/gamification.service.ts`  
**All types already in `src/types/api.ts`:** `Badge`, `Achievement`, `LeaderboardEntry`

### Step 1 — Expand the hook file

The existing gamification calls are inline. Create a dedicated hook file:

**File to create:** `src/hooks/useGamification.ts`

```ts
// useMyGamificationStats (query)
// queryKey: ["gamification", "stats"]
// calls: gamificationService.getMyStats()
// staleTime: 60000

// useLeaderboard (query)
// queryKey: ["gamification", "leaderboard", timeframe]
// calls: gamificationService.getLeaderboard(timeframe)

// useMyBadges (query)
// queryKey: ["gamification", "my-badges"]
// calls: gamificationService.getMyBadges()

// useAllBadges (query)
// queryKey: ["gamification", "badges"]
// calls: gamificationService.getBadges()

// useMyAchievements (query)
// queryKey: ["gamification", "my-achievements"]
// calls: gamificationService.getMyAchievements()

// useMyStreak (query)
// queryKey: ["gamification", "streak"]
// calls: gamificationService.getStreak()

// useCheckIn (mutation)
// mutationFn: () => gamificationService.checkIn()
// onSuccess: invalidate ["gamification", "streak"] + invalidate ["gamification", "stats"]
//            + show DailyCheckInModal with reward details from response

// useClaimAchievement (mutation)
// mutationFn: (achievementId) => gamificationService.claimAchievement(achievementId)
// onSuccess: invalidate ["gamification", "my-achievements"] + toast with reward value
```

### Step 2 — Create component files

**File to create:** `src/components/gamification/BadgeCard.tsx`

Props: `{ badge: Badge; earned?: boolean }`

Renders: Badge icon (from `badge.icon` URL or emoji), name, rarity chip
(common=gray, uncommon=green, rare=blue, epic=purple, legendary=gold + shimmer animation),
description, "Earned on {date}" if earned, greyed-out + lock icon if not earned.

**File to create:** `src/components/gamification/AchievementCard.tsx`

Props: `{ achievement: Achievement }`

Renders: Name, description, progress bar (`achievement.progress / achievement.goal`),
"Claim Reward" button if `completed && !claimedAt`, reward label (`+{points} pts`).

**File to create:** `src/components/gamification/LeaderboardRow.tsx`

Props: `{ entry: LeaderboardEntry; currentUserId: string }`

Renders: rank medal (🥇🥈🥉 for 1-3, else just number), avatar, username, points score,
level badge. Highlights own row with a light border.

**File to create:** `src/components/gamification/StreakCard.tsx`

Props: `{ streak: number; lastCheckIn: string; nextReward: number }`

Renders: flame icon, current streak count, "🔥 X day streak!", next milestone countdown
(e.g., "3 more days for +50 bonus HuudCoins"), "Check In Today" button → `useCheckIn`.

**File to create:** `src/components/gamification/DailyCheckInModal.tsx`

Triggered automatically on login if `streak.checkedInToday === false`. Shows:
- Animated coin icon
- "Day {n} Check-in Bonus!"
- "+{coins} HuudCoins" earned
- Current streak flame counter
- "Claim" button → calls `useCheckIn`
- Dismissed to session storage so it only shows once per session

### Step 3 — Create page files

**File to create:** `src/app/gamification/page.tsx`

Tab layout with 4 tabs:

**Tab 1 — Overview**  
- `<StreakCard>` at top  
- Stats grid: Level, Total Points, Trust Score, HuudCoins balance  
- Recent badges (last 3 earned)  
- Link to leaderboard  

**Tab 2 — Badges**  
- All badges from `useAllBadges()` in a 2-col grid  
- My earned badges highlighted  
- Filter: "All" | "Earned" | "Not Earned"  

**Tab 3 — Achievements**  
- All achievements from `useMyAchievements()` as a list  
- Progress bars  
- "Claim" button on completed ones  

**Tab 4 — Leaderboard**  
- Timeframe toggle: "Daily" | "Weekly" | "Monthly" | "All Time"  
- Sorted list of `<LeaderboardRow>` items  
- Sticky "Your Rank" card at the bottom  

**DailyCheckInModal integration into `src/app/layout.tsx`:**  
Import `<DailyCheckInModal>` and render it at the root layout level after auth. It self-manages
display via session storage.

---

## PHASE 3 — HuudCoins Wallet

### Step 1 — Extend types

In `src/types/api.ts`, add these interfaces at the bottom:

```ts
export interface HuudCoinTransaction {
  id: string;
  userId: string;
  type: "earn" | "spend" | "transfer" | "bonus";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType?: "check_in" | "boost" | "achievement" | "post" | "review" | "tip";
  referenceId?: string;
  createdAt: string;
}

export interface HuudCoinWallet {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  transactions: HuudCoinTransaction[];
}
```

### Step 2 — Extend the gamification service

In `src/services/gamification.service.ts`, add:

```ts
async getWallet() {
  return await apiClient.get<HuudCoinWallet>("/gamification/wallet");
},

async getTransactionHistory(page = 1, limit = 20) {
  return await apiClient.get<PaginatedResponse<HuudCoinTransaction>>(
    "/gamification/wallet/transactions",
    { params: { page, limit } },
  );
},
```

### Step 3 — Create the hook additions (in `src/hooks/useGamification.ts`)

```ts
// useWallet (query)
// queryKey: ["gamification", "wallet"]
// calls: gamificationService.getWallet()

// useTransactionHistory (infinite query)
// queryKey: ["gamification", "wallet", "transactions"]
// calls: gamificationService.getTransactionHistory(pageParam, 20)
```

### Step 4 — Create the page

**File to create:** `src/app/gamification/wallet/page.tsx`

Layout sections:
- Balance card: large coin icon + `{balance} HuudCoins`, sub-labels: `Lifetime earned: X` | `Spent: X`
- Quick actions row: "Boost a Listing" (→ /marketplace/boost), "Get Premium" (→ /premium)
- Transaction history list: icon per type (earn=green up arrow, spend=red down arrow), description, `±amount`, date
- Infinite scroll for older transactions

---

## PHASE 4 — Listing Boost + Premium Subscription

### Step 1 — Add Boost UI to Marketplace

**File to modify:** `src/app/marketplace/my-listings/page.tsx`

On each listing card, add a "Boost" button beside the Edit button.
Clicking it opens a `<BoostModal>` component.

**File to create:** `src/components/marketplace/BoostModal.tsx`

Props: `{ productId: string; productTitle: string; onClose: () => void }`

Renders a modal with:
- Duration options: 3 days (₦500), 7 days (₦1,000), 14 days (₦2,000), 30 days (₦3,500)
- Pay with: "HuudCoins" (if balance ≥ cost) | "Card (Paystack)"
- "Boost Now" button calls `paymentsService.initiatePayment("listing_boost", amount, "NGN", { productId, duration })`
- On success (type=Card): redirect to `paymentUrl` from response
- On return, call `paymentsService.verifyPayment(reference)` and show success toast

### Step 2 — Create Premium Subscription page

**File to create:** `src/app/premium/page.tsx`

The existing `src/components/PremiumCards.tsx` component already exists — render it here.
Add a header: "Go Premium", subtitle: "Unlock the full power of NeyborHuud".

Below the `<PremiumCards>` component, add:
- "Current Plan" card showing user's tier (from `user.gamification.tier`)
- Payment history table using `usePaymentHistory` hook

**File to create:** `src/hooks/usePayments.ts`

```ts
// useInitiatePayment (mutation)
// mutationFn: (payload) => paymentsService.initiatePayment(...)
// onSuccess: window.location.href = response.data.paymentUrl (if card payment)

// useVerifyPayment (query — disabled by default)
// queryKey: ["payments", "verify", reference]
// calls: paymentsService.verifyPayment(reference)
// enabled: !!reference (trigger from URL param on return page)

// usePaymentHistory (infinite query)
// queryKey: ["payments", "history"]
// calls: paymentsService.getPaymentHistory(pageParam, 20)
```

**File to create:** `src/app/premium/success/page.tsx`

A "Payment processing" page that reads `?reference=` from the URL, calls `useVerifyPayment`,
shows spinner → then "Payment Successful / Failed" result. On success, invalidate
`["currentUser"]` so the tier badge updates everywhere.

---

## PHASE 5 — Admin Panel Frontend

**Service file already complete:** `src/services/admin.service.ts`  
Protected by: `user?.role === "admin" || user?.role === "super_admin"` guard.

### Step 1 — Create hook file

**File to create:** `src/hooks/useAdmin.ts`

```ts
// useDashboardStats (query)
// queryKey: ["admin", "stats"]
// calls: adminService.getDashboardStats()

// useAdminUsers (infinite query)
// queryKey: ["admin", "users", filter]
// calls: adminService.getUsers(pageParam, 20, filter)

// useSuspendUser (mutation)
// mutationFn: ({ userId, reason, duration }) => adminService.suspendUser(userId, reason, duration)
// onSuccess: invalidate ["admin", "users"]

// useVerifyUser (mutation)
// mutationFn: (userId) => adminService.verifyUser(userId)

// useUpdateUserRole (mutation)
// mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role)

// useAdminReports (infinite query)
// queryKey: ["admin", "reports", filter]
// calls: adminService.getReports(pageParam, 20, filter)

// useResolveReport (mutation)
// mutationFn: ({ reportId, action, note }) => adminService.resolveReport(reportId, action, note)
```

### Step 2 — Create page files

**Directory to create:** `src/app/admin/`

**File to create:** `src/app/admin/layout.tsx`

This layout wraps all admin pages. At the top of the component:
```ts
const { user } = useAuth();
if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
  redirect("/feed");
}
```
Renders: left admin sidebar + main content slot.

**File to create:** `src/app/admin/page.tsx` — Dashboard

Stats grid (from `useDashboardStats`):
- Total users, Active users (24h), Total posts, Total events, Total jobs, Total marketplace items
- Engagement: likes / comments / shares
- Trends chart: a simple line chart using the `trends` array. Use a lightweight lib already in the
  project or render a basic SVG sparkline — do NOT install Chart.js or Recharts without confirming.

**File to create:** `src/app/admin/users/page.tsx`

Table of users with:
- Search input (debounced, 300ms, calls `useAdminUsers({ search: query })`)
- Role filter chips
- Status filter (active/suspended)
- Per row: avatar, username, email, role badge, verification status, joined date, action menu
- Action menu: Verify / Unverify, Suspend (opens modal for reason + duration), Change Role (select)

**File to create:** `src/app/admin/reports/page.tsx`

Table of reports:
- Status filter: pending / under_review / resolved / dismissed
- Per row: target type badge, reason, reporter username, date, status, "Review" button
- Review action: opens a side panel with full report details, "Resolve" (with note) or "Dismiss"

---

## PHASE 6 — Accessibility & UX Features

### 6.1 — Voice Message Recording in Chat

**File to modify:** `src/components/chat/ChatActionMenu.tsx`

Add a new action item: microphone icon → "Record Voice Note".

**File to create:** `src/components/chat/VoiceRecorder.tsx`

States: idle → recording → preview → sending

UI logic:
1. Idle: mic button (hold to record or tap to toggle)
2. On start: call `navigator.mediaDevices.getUserMedia({ audio: true })`, create `MediaRecorder`
3. Recording: animated waveform (CSS animation), live timer "0:00 → 0:59 max"
4. Stop: collect blobs into a single `Blob(chunks, { type: "audio/webm" })`, create a preview player
5. Preview: `<audio controls src={URL.createObjectURL(blob)} />`, "Send" and "Delete" buttons
6. Send: call the existing chat send mutation with `type: "audio"` and the blob as a File object

**Browser API used:** `MediaRecorder`, `AudioContext` (for waveform), `URL.createObjectURL`.  
Handle permission denial with a friendly error toast.

### 6.2 — Adjustable Font Size

**File to modify:** `src/app/settings/page.tsx` (or the nearest settings index)

Add a new "Accessibility" section with:
- Font Size selector: Small / Medium (default) / Large
- Calls `PATCH /profile/settings` with `{ accessibility: { textSize: "small"|"medium"|"large" } }`
  using the existing `useUpdateSettings` hook (or add one if absent)

**File to modify:** `src/app/layout.tsx`

Read `user?.settings?.accessibility?.textSize` and apply a CSS class to `<body>`:
```ts
const textSizeClass = {
  small: "text-size-sm",
  medium: "",
  large: "text-size-lg",
}[user?.settings?.accessibility?.textSize ?? "medium"];
```

**File to modify:** `src/app/globals.css`

Add:
```css
.text-size-sm  { font-size: 14px; }
.text-size-lg  { font-size: 18px; }
```

### 6.3 — Notification Preference Toggles

**File to modify:** `src/app/settings/notifications/page.tsx`

The current page likely has basic email/push/sms toggles. Expand it to have **per-category** toggles:

New section: "What you're notified about"

| Category | Toggle key in `user.settings.notifications` |
|---|---|
| Likes on your posts | `likes` |
| Comments on your posts | `comments` |
| Mentions | `mentions` |
| New followers | `follows` |
| Direct messages | `chat` |
| Events in your area | `events` |
| Job postings | `jobs` |
| Safety alerts | `safety` (add to type) |
| Gamification rewards | `gamification` (add to type) |

Each toggle calls `PATCH /profile/settings` debounced 500ms (don't hit API on every keypress).

Add these new keys to `UserSettings.notifications` in `src/types/api.ts`:
```ts
follows?: boolean;
events?: boolean;
jobs?: boolean;
safety?: boolean;
gamification?: boolean;
```

### 6.4 — Geo Radius Settings

**File to create:** `src/app/settings/location/page.tsx`

UI:
- "Content Radius" slider: range 1 km – 100 km with step 5
- Label: "Show content from within {n} km of your location"
- Two presets: "Urban (5 km)" and "Rural (50 km)"
- Save button: calls `PATCH /profile/settings` with `{ contentRadius: n }`

Add `contentRadius?: number` to `UserSettings` in `src/types/api.ts`.

Add link to this page from the settings index page.

---

## PHASE 7 — Sidebar + Navigation Updates

Add links to the newly created pages in the navigation components.

### 7.1 — LeftSidebar additions

**File to modify:** `src/components/navigation/LeftSidebar.tsx`

In the section that contains the main nav links, add these items:
```ts
{ href: "/jobs",     icon: "work",               label: "Jobs" },
{ href: "/events",   icon: "event",              label: "Events" },
{ href: "/services", icon: "home_repair_service", label: "Services" },
```

Also add a "Gamification" item:
```ts
{ href: "/gamification", icon: "military_tech", label: "My Huud Score" },
```

### 7.2 — Settings page index

**File to modify:** `src/app/settings/page.tsx`

Add two new settings items:
- "Location & Radius" → `/settings/location`
- "Accessibility" → (inline section or `/settings/accessibility`)

### 7.3 — Profile page additions

**File to modify:** `src/app/profile/[username]/page.tsx`

Below the existing stats (posts, followers, following), add:
- HuudCoins balance and level badge (from gamification stats)
- "Badges" mini-row: first 4 earned badges as small icons; "See all" link

---

## BACKEND — Missing Endpoints (for the backend repository)

This section is a precise API contract that the backend must implement. The frontend service files
already call these exact URLs with these exact payloads.

---

### B1 — Events Router (`/api/v1/events`)

All routes require JWT auth unless marked `[public]`.

| Method | Path | Request Body | Response |
|---|---|---|---|
| POST | `/events` | `CreateEventPayload` | `{ data: Event }` |
| GET [public] | `/events` | query: `page, limit, type, date, status` | `PaginatedResponse<Event>` |
| GET [public] | `/events/nearby` | query: `lat, lng, radius, page, limit` | `PaginatedResponse<Event>` |
| GET [public] | `/events/:id` | — | `{ data: Event }` |
| PUT | `/events/:id` | Partial `CreateEventPayload` | `{ data: Event }` |
| DELETE | `/events/:id` | — | `{ success: true }` |
| POST | `/events/:id/attend` | — | `{ data: Event }` (with updated `attendees` count) |
| DELETE | `/events/:id/attend` | — | `{ data: Event }` |
| GET | `/events/:id/attendees` | query: `page, limit` | `PaginatedResponse<User>` |
| GET | `/events/my/attending` | — | `PaginatedResponse<Event>` |
| GET | `/events/my/organized` | — | `PaginatedResponse<Event>` |
| POST | `/events/:id/cancel` | `{ reason: string }` | `{ data: Event }` |
| POST | `/events/:id/share` | — | `{ success: true }` |
| POST | `/events/:id/report` | `{ reason, description }` | `{ success: true }` |

**CreateEventPayload shape:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "type": "community|social|sports|cultural|educational|business|other",
  "venue": "string",
  "startDate": "ISO 8601 datetime",
  "endDate": "ISO 8601 datetime",
  "isFree": true,
  "ticketPrice": 0,
  "capacity": 100,
  "visibility": "public|private|neighborhood",
  "tags": ["string"],
  "location": { "latitude": 0, "longitude": 0, "lga": "", "state": "" }
}
```
The `coverImage` field is sent as `multipart/form-data` when a file is attached.

**Authorization:** Owner of event can `PUT`, `DELETE`, `cancel`. Any authenticated user can attend.

---

### B2 — Jobs Router (`/api/v1/jobs`)

| Method | Path | Request Body | Response |
|---|---|---|---|
| POST | `/jobs` | `CreateJobPayload` | `{ data: Job }` |
| GET [public] | `/jobs` | query: `page, limit, type, category, workMode, minSalary, maxSalary` | `PaginatedResponse<Job>` |
| GET [public] | `/jobs/nearby` | query: `lat, lng, radius, page, limit` | `PaginatedResponse<Job>` |
| GET [public] | `/jobs/:id` | — | `{ data: Job }` |
| PUT | `/jobs/:id` | Partial `CreateJobPayload` | `{ data: Job }` |
| DELETE | `/jobs/:id` | — | `{ success: true }` |
| POST | `/jobs/:id/apply` | `multipart/form-data: coverLetter(text), resume(file)` | `{ data: JobApplication }` |
| GET | `/jobs/my/applications` | query: `page, limit` | `PaginatedResponse<JobApplication>` |
| GET | `/jobs/:id/applications` | (employer only) query: `page, limit` | `PaginatedResponse<JobApplication>` |
| GET | `/jobs/:id/applications/status` | — | `{ data: JobApplication }` |
| PATCH | `/jobs/applications/:applicationId/status` | `{ status }` (employer only) | `{ data: JobApplication }` |
| DELETE | `/jobs/applications/:applicationId` | — | (withdraw) `{ success: true }` |
| POST | `/jobs/:id/save` | — | `{ success: true }` |
| DELETE | `/jobs/:id/save` | — | `{ success: true }` |
| GET | `/jobs/my/saved` | — | `PaginatedResponse<Job>` |
| POST | `/jobs/:id/close` | — | `{ data: Job }` |
| POST | `/jobs/:id/reopen` | — | `{ data: Job }` |
| POST | `/jobs/:id/share` | — | `{ success: true }` |
| POST | `/jobs/:id/report` | `{ reason, description }` | `{ success: true }` |

**CreateJobPayload shape:**
```json
{
  "title": "string",
  "description": "string",
  "type": "full-time|part-time|contract|freelance|internship",
  "category": "string",
  "workMode": "on-site|remote|hybrid",
  "salary": { "min": 0, "max": 0, "currency": "NGN", "period": "monthly" },
  "requirements": ["string"],
  "skills": ["string"],
  "location": { "latitude": 0, "longitude": 0, "lga": "", "state": "" },
  "expiresAt": "ISO 8601 date (optional)"
}
```

**The `hasApplied` field on the `Job` response** must be `true` when the authenticated user has an
application record for that job. This requires a `$lookup` / join on the applications collection.

---

### B3 — Services Router (`/api/v1/services`)

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/services` | `multipart/form-data` (see below) | `{ data: Service }` |
| GET [public] | `/services` | query: `page, limit, category, subcategory, minRating` | `PaginatedResponse<Service>` |
| GET [public] | `/services/nearby` | query: `lat, lng, radius, page, limit` | `PaginatedResponse<Service>` |
| GET [public] | `/services/:id` | — | `{ data: Service }` |
| PUT | `/services/:id` | `multipart/form-data` | `{ data: Service }` |
| DELETE | `/services/:id` | — | `{ success: true }` |
| POST | `/services/:id/book` | `{ date: ISO8601, notes?: string }` | `{ data: ServiceBooking }` |
| DELETE | `/services/bookings/:bookingId` | — | cancel booking `{ success: true }` |
| GET | `/services/my/bookings` | — | `PaginatedResponse<ServiceBooking>` |
| PATCH | `/services/bookings/:bookingId/status` | `{ status }` (provider only) | `{ data: ServiceBooking }` |
| POST | `/services/:id/rate` | `{ rating: 1–5, review?: string }` | `{ success: true, data: { newAverageRating: number } }` |
| GET [public] | `/services/:id/reviews` | query: `page, limit` | `PaginatedResponse<{userId, user, rating, review, createdAt}>` |
| POST | `/services/:id/favorite` | — | `{ success: true }` |
| DELETE | `/services/:id/favorite` | — | `{ success: true }` |
| GET | `/services/my/favorites` | — | `PaginatedResponse<Service>` |

**Service create fields:** title, description, category, subcategory, pricing.type, pricing.amount,
pricing.currency, availability.days (array), availability.hours (string), images (multipart, up to 6).

**Rating computation:** When a new `POST /services/:id/rate` is received:
1. Upsert rating record (one rating per user per service)
2. Recompute `service.rating` = average of all ratings, `service.reviews` = count

---

### B4 — Gamification Engine (`/api/v1/gamification`)

This is a full backend sub-system. Here is what each endpoint must do:

| Method | Path | Auth | Logic |
|---|---|---|---|
| POST | `/gamification/check-in` | Required | Check if user already checked in today (UTC day). If yes, return `{ alreadyCheckedIn: true }`. If no: award coins (base 10, +streak bonus), increment streak, update `user.gamification.streak`, return `{ coins: N, streak: N, alreadyCheckedIn: false }` |
| GET | `/gamification/streak` | Required | Return `{ streak: N, lastCheckIn: ISO8601, checkedInToday: bool, nextMilestone: N, nextMilestoneReward: N }` |
| GET | `/gamification/stats` | Required | Return full `GamificationData` shape from `src/types/api.ts` |
| GET | `/gamification/hero-stats` | Required | Lightweight: return `{ trustScore: N, totalHuudCoins: N }` only |
| GET | `/gamification/leaderboard` | Required | query: `timeframe=weekly`, `limit=50`. Aggregate users by points in timeframe, return with user profile + rank |
| GET | `/gamification/badges` | Required | Return all defined badge definitions |
| GET | `/gamification/my-badges` | Required | Return badges earned by this user |
| GET | `/gamification/achievements` | Required | Return all achievement definitions with user's current progress |
| GET | `/gamification/my-achievements` | Required | Return user's achievements with progress and claimed status |
| POST | `/gamification/achievements/:id/claim` | Required | Mark achievement reward as claimed, award coins/badge, return `{ success: true, reward: { points: N, badge?: Badge } }` |
| GET | `/gamification/users/:userId/stats` | Required | Return another user's public gamification stats |
| GET | `/gamification/wallet` | Required | Return `{ balance, lifetimeEarned, lifetimeSpent }` |
| GET | `/gamification/wallet/transactions` | Required | Paginated transaction history |

**Points-earning events (backend must hook into these routes and award points):**
- `POST /content/posts` → +5 points, +1 HuudCoin
- `POST /content/posts/:id/like` (first like of the day per user) → +1 point
- `POST /content/posts/:id/comments` → +2 points
- `POST /gamification/check-in` → +10 HuudCoins base
- `POST /services/:id/rate` → +3 points, +2 HuudCoins
- `POST /jobs` (job posted) → +5 points
- `POST /events` (event created) → +5 points
- `POST /events/:id/attend` → +2 points
- A shared internal `gamificationService.awardPoints(userId, { points, coins, reason, referenceId })` function should handle all these and be imported into each route handler.

**Streak bonus formula:**
- Day 1–6: base 10 coins
- Day 7 (weekly milestone): +50 bonus coins
- Day 14: +100 bonus coins
- Day 30: +200 bonus coins

---

### B5 — Payments Router (`/api/v1/payments`)

Payment gateway: Paystack (primary), Flutterwave (secondary).

| Method | Path | Body / Query | Response |
|---|---|---|---|
| POST | `/payments/initiate` | `{ type, amount, currency, metadata }` | `{ paymentUrl: string, reference: string }` |
| GET | `/payments/verify/:reference` | — | `{ data: Payment }` |
| GET | `/payments/history` | query: `page, limit` | `PaginatedResponse<Payment>` |
| GET | `/payments/:id` | — | `{ data: Payment }` |
| POST | `/payments/:id/refund` | `{ reason: string }` | `{ success: true }` |
| GET | `/payments/stats` | — | `{ totalSpent, totalTransactions, lastPayment }` |
| POST | `/payments/webhook/paystack` | Paystack event body | `200 OK` (verify HMAC first) |

**Initiate flow:**
1. Create a pending Payment record in DB
2. Call Paystack `POST /transaction/initialize` with `{ email, amount, reference, callback_url }`
3. Return `{ paymentUrl: data.authorization_url, reference: data.reference }`

**Webhook flow:**
1. Verify `x-paystack-signature` HMAC-SHA512 against raw body using `PAYSTACK_SECRET_KEY`
2. On `charge.success`: update Payment status to `completed`, then handle by type:
   - `listing_boost`: flag product as boosted in DB, set `boostedUntil` date
   - `premium_subscription`: update `user.gamification.tier` to the purchased tier
   - `event_ticket`: mark user as attending the event
   - `marketplace_purchase`: create an Order record
   - `service_payment`: mark booking as confirmed

**Metadata shape per type:**
```json
listing_boost:          { "productId": "", "duration": 7 }
premium_subscription:   { "tier": "gold", "durationMonths": 1 }
event_ticket:           { "eventId": "", "quantity": 1 }
marketplace_purchase:   { "orderId": "" }
service_payment:        { "bookingId": "" }
```

---

### B6 — Admin Router (`/api/v1/admin`)

All routes require `role: admin | super_admin` middleware.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard/stats` | Returns `AnalyticsData` shape |
| GET | `/admin/users` | query: `page, limit, role, status, verified` |
| GET | `/admin/users/:id` | Full user detail |
| POST | `/admin/users/:id/suspend` | Body: `{ reason, duration? }` — set `user.status = "suspended"` + record reason |
| POST | `/admin/users/:id/unsuspend` | Removes suspension |
| POST | `/admin/users/:id/verify` | Sets `user.identityVerified = true` |
| POST | `/admin/users/:id/unverify` | Sets `user.identityVerified = false` |
| PATCH | `/admin/users/:id/role` | Body: `{ role }` — only super_admin can set admin |
| DELETE | `/admin/users/:id` | Soft delete + reason |
| GET | `/admin/reports` | query: `page, limit, status, targetType` |
| GET | `/admin/reports/:id` | Full report detail |
| PATCH | `/admin/reports/:id/status` | Body: `{ status, note }` |
| GET | `/admin/analytics` | Returns trend data, top content, top users |

---

### B7 — Profile Settings Extensions

The existing `PATCH /profile/settings` endpoint must accept these new fields (merge into existing
`UserSettings` schema):

```json
{
  "notifications": {
    "follows": true,
    "events": true,
    "jobs": true,
    "safety": true,
    "gamification": true
  },
  "accessibility": {
    "textSize": "small|medium|large",
    "liteMode": false
  },
  "contentRadius": 10
}
```

---

### B8 — Email Delivery Fix (Critical — blocks user onboarding)

**Current issue (from `BACKEND_INTEGRATION_STATUS.md`):** Verification emails are not arriving.

**Frontend adaptation already in place:** Sends `POST /auth/verify-email` with `{ email, code }`.

**Backend checklist:**
1. Confirm `POST /auth/verify-email` accepts `{ email, code }` — not just `{ token }`.
2. If using a token-only system, add a code-based path: hash the 6-digit code, store against `email` with a 15-minute TTL, accept `{ email, code }` and compare.
3. For email delivery: if using Nodemailer, confirm SMTP credentials are set. Use a transactional email service (Resend, Mailgun, Sendgrid) — not Gmail SMTP in production.
4. Add a `POST /auth/resend-verification` endpoint. Frontend already calls this.
5. Test with a real Nigerian ISP email address (e.g., Yahoo, Gmail) — some corporate SMTP block delivery to them.

---

## Build Order Summary

| # | What | Effort Est. | Blocks |
|---|---|---|---|
| 1 | Fix email delivery (backend) | Low | User onboarding |
| 2 | `src/hooks/useJobs.ts` + Jobs pages | Medium | Jobs feature |
| 3 | `src/hooks/useEvents.ts` + Events pages | Medium | Events feature |
| 4 | `src/hooks/useServices.ts` + Services pages + `<StarRating>` | Medium | Services feature |
| 5 | `src/hooks/useGamification.ts` + Gamification hub + DailyCheckInModal | Medium | Engagement loops |
| 6 | HuudCoins wallet page | Small | Monetization |
| 7 | `<BoostModal>` + `src/hooks/usePayments.ts` + Premium page | Medium | Revenue |
| 8 | `src/hooks/useAdmin.ts` + Admin panel pages | Large | Operations |
| 9 | Voice recorder component in chat | Small | Accessibility |
| 10 | Notification preference toggles | Small | UX |
| 11 | Geo radius settings page | Small | UX |
| 12 | Font size settings | Small | Accessibility |
| 13 | LeftSidebar navigation additions | Small | Navigation |
| 14 | Backend: Events + Jobs + Services routers | Large | All frontend pages |
| 15 | Backend: Gamification engine + point hooks | Large | Engagement |
| 16 | Backend: Payments + Paystack webhook | Medium | Revenue |
| 17 | Backend: Admin router | Medium | Operations |
| 18 | Backend: HuudCoins wallet endpoints | Small | Wallet UI |

---

*End of Implementation Guide. Every item in this document maps 1-to-1 to an existing service
function, type definition, or API pattern already present in the codebase.*
