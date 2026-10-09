# API Registry — Departments

> Mount: `app.use("/api/v1/departments", departmentRoutes)` — `app.ts:339`
> Source: `NeyborHuud-ServerSide/src/modules/departments/department.routes.ts`
>
> **Total: 8 routes.** Public reads; admin writes gated by `restrictedTo("admin", "super_admin")`
> (lowercase role names — see finding below).

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/` | public | `listDepartments` | |
| GET | `/:id` | public | `getDepartment` | |
| GET | `/:id/services` | public | `getDepartmentServices` | |
| GET | `/:id/rewards` | public | `getDepartmentRewards` | |
| GET | `/:id/rewards/:action` | public | `getDepartmentRewardForAction` | |
| POST | `/` | `protect`, `restrictedTo("admin", "super_admin")` | `createDepartment` | |
| PUT | `/:id` | `protect`, `restrictedTo("admin", "super_admin")` | `updateDepartment` | |
| DELETE | `/:id` | `protect`, `restrictedTo("admin", "super_admin")` | `deleteDepartment` | |

## Known issues found while building this registry

- **Role-name casing inconsistency, verified at the middleware level but not resolvable from
  source alone**: `restrictedTo` (`auth.middleware.ts:600-615`) does an exact-string
  `userRoles.includes(role)` check — no case-normalization. This file checks for lowercase
  `"admin"`/`"super_admin"`; `moderation.routes.ts` checks for capitalized `'Moderator'`/
  `'Super Admin'`. Roles themselves come from a database-backed `Role` collection
  (`fetchUserRolesAndPermissions`, `auth.middleware.ts:13-68`, populates `role.name` dynamically —
  not a hardcoded enum), so **whether this is a real bug depends on how role documents are actually
  named in the live database**, which can't be confirmed from source code alone. Worth a direct DB
  check (or asking whoever manages admin accounts) before assuming department admin routes work —
  if the seeded roles are capitalized like moderation's, these three write routes may be
  permanently unreachable by design-intended admins.
- "Departments" + "rewards for action" suggests a government/civic-department integration (LGA
  departments, civic rewards) — a product area not yet covered in Step 1's Product Feature Map;
  worth a note for the feature-mapping step.
