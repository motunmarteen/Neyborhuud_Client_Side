# API Registry — Jobs

> Mount: `app.use("/api/v1/jobs", jobRoutes)` — `app.ts:326`
> Source: `NeyborHuud-ServerSide/src/modules/jobs/job.routes.ts`
>
> **Total: 18 routes.** Mixed public/`optionalAuth`/`protect` (Bearer-only — see
> `_auth-middleware-split.md`). Static paths correctly ordered before `/:id` per source comment.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/my/applications` | `protect` | `getMyApplications` | |
| GET | `/my/saved` | `protect` | `getMySavedJobs` | |
| GET | `/nearby` | `optionalAuth` | `getNearbyJobs` | |
| PATCH | `/applications/:applicationId/status` | `protect`, validated | `updateApplicationStatus` | Employer action |
| DELETE | `/applications/:applicationId` | `protect` | `withdrawApplication` | Applicant action |
| GET | `/` | `optionalAuth` | `listJobs` | |
| POST | `/` | `protect`, `requireVerified`, validated | `createJob` | |
| GET | `/:id` | `optionalAuth` | `getJob` | |
| PUT | `/:id` | `protect`, validated | `updateJob` | |
| DELETE | `/:id` | `protect` | `deleteJob` | |
| POST | `/:id/apply` | `protect`, optional multer (resume), validated | `applyForJob` | Multer only engages if `Content-Type` is multipart — see notes |
| GET | `/:id/applications` | `protect` | `getJobApplications` | Employer view |
| GET | `/:id/applications/status` | `protect` | `getApplicationStatus` | |
| POST | `/:id/save` | `protect` | `saveJob` | |
| DELETE | `/:id/save` | `protect` | `unsaveJob` | |
| POST | `/:id/boost` | `protect` | `boostJob` | HuudCoin-paid, consistent with events/marketplace boost pattern |
| POST | `/:id/reopen` | `protect` | `reopenJob` | |
| POST | `/:id/share` | `protect` | `shareJob` | |
| POST | `/:id/report` | `protect`, validated | `reportJob` | |

## Known issues found while building this registry

- **Dead controller import**: `closeJob` is imported from `job.controller.js` but never wired to
  any route in this file. `reopenJob` exists as a route, but its counterpart close action does not
  — meaning there may be no way to close a job listing via a dedicated endpoint (possibly folded
  into `updateJob` via a status field instead, not confirmed this pass). Worth checking the
  controller directly before the frontend designs a "close this job posting" UI action.
- The optional-multer-by-content-type pattern on `/:id/apply` (resume upload) is the same technique
  used in `events.md`'s cover-image upload — a second confirmed instance of this backend
  convention.
