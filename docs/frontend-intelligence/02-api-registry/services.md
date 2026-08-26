# API Registry — Services (Local Service Providers / Bookings)

> Mount: `app.use("/api/v1/services", serviceRoutes)` — `app.ts:325`
> Source: `NeyborHuud-ServerSide/src/modules/services/service.routes.ts`
>
> **Total: 21 routes.** Mixed public/`optionalAuth`/`protect` (Bearer-only — see
> `_auth-middleware-split.md`). Static/sub-resource paths correctly ordered before `/:id`.
>
> **Note**: `boostService` (this module's `/:id/boost` handler) was the real functional bug fixed
> during the earlier backend remediation thread — confirmed already deployed and working; not an
> open issue.

## Listing & discovery
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/nearby` | public | `getNearbyServices` |
| GET | `/` | public | `listServices` |
| POST | `/` | `protect`, `requireVerified`, multer (≤6 images) | `createService` |
| GET | `/:id` | `optionalAuth` | `getService` |
| PUT | `/:id` | `protect`, multer | `updateService` |
| DELETE | `/:id` | `protect` | `deleteService` |

## My bookings / favorites
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/my/bookings` | `protect` | `getMyBookings` | Source comment: "legacy pre-negotiation rows" |
| GET | `/my/booking-requests` | `protect` | `getMyBookingRequests` | Current system |
| GET | `/my/favorites` | `protect` | `getMyFavorites` | |
| DELETE | `/bookings/:bookingId` | `protect` | `cancelBooking` | |
| PATCH | `/bookings/:bookingId/status` | `protect` | `updateBookingStatus` | |

## Booking negotiation (date/time haggle)
> Source comment: "Mirrors marketplace's offer endpoints. Once accepted the booking becomes an
> Order and the rest of the chain is served by `/marketplace/orders/:orderId/*`." — i.e. this
> module's negotiation flow deliberately hands off to `marketplace.md`'s order lifecycle once a
> booking is accepted.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/bookings/requests/:bookingOfferId` | `protect` | `getBookingRequest` | |
| PATCH | `/bookings/requests/:bookingOfferId/respond` | `protect`, validated | `respondToBookingRequest` | Provider: accept/reject/propose another time |
| PATCH | `/bookings/requests/:bookingOfferId/withdraw` | `protect` | `withdrawBookingRequest` | Client withdraws own request |
| PATCH | `/bookings/requests/:bookingOfferId/close` | `protect` | `closeBookingRequest` | Either party closes a declined negotiation |
| PATCH | `/bookings/requests/:bookingOfferId/accept` | `protect`, validated | `respondToBookingRequest` | Shorthand — injects `action: "accept"` |
| PATCH | `/bookings/requests/:bookingOfferId/reject` | `protect`, validated | `respondToBookingRequest` | Shorthand — injects `action: "reject"` |

## Sub-resources
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/:id/book` | `protect`, validated | `bookService` |
| POST | `/:id/boost` | `protect` | `boostService` |
| POST | `/:id/rate` | `protect` | `rateService` |
| GET | `/:id/reviews` | public | `getServiceReviews` |
| POST | `/:id/favorite` | `protect` | `favoriteService` |
| DELETE | `/:id/favorite` | `protect` | `unfavoriteService` |

## Known issues found while building this registry

- The negotiation-shorthand pattern (accept/reject routes injecting `action` into `req.body` before
  calling the shared `respond` handler) is identical to marketplace's offer-response shorthand —
  confirms this is a deliberate, repeated backend convention rather than a one-off, useful to know
  before designing a shared frontend hook for both.
- `getMyBookings` is explicitly labeled legacy in source but still mounted and presumably still
  returns real data for bookings made before the negotiation system existed — the frontend rebuild
  should decide whether "My Bookings" needs to merge both legacy bookings and current booking
  requests into one UI list, or show them separately.
