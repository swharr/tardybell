# TardyBell Changelog

All notable changes to the TardyBell schedule planner for Timpanogos High School 2026-2027.

---

## [Unreleased]

_Nothing yet — ship it!_

---

## 2026-03-16 — Cloud Sync Bug Fix

### Fixed
- **Cross-device sync race condition**: Profiles created in one browser (e.g., Edge) now correctly restore data when the same name is typed in another browser (e.g., Safari). Root cause was `setActiveProfileId` triggering ScheduleBuilder mount before the async cloud pull completed. Fix: pull from cloud and write to localStorage *before* activating the profile.

### Improved
- ProfilePicker now shows a cloud restore hint ("New device? Just type your name — your schedule syncs automatically") so users know they don't need to re-create from scratch.

---

## 2026-03-15 — Cloud Sync

### Added
- **Cloud sync via Azure Functions + Cosmos DB** (free tier): Profiles now persist across devices and browsers. Just type the same name on any device to restore your schedule.
- Azure Functions v4 API (`/api/profile/{name}`) with GET, PUT, DELETE endpoints.
- Debounced cloud push (2-second delay) — localStorage remains the primary store, cloud is the backup.
- Sync status indicator in the header (cloud icon shows syncing / synced / offline states).
- Case-insensitive name matching — "Abigail", "abigail", and "ABIGAIL" all map to the same cloud profile.

---

## 2026-03-15 — UI/UX Polish

### Improved
- Modal animations: backdrop fade-in and panel slide-up for all modals (Help, Conflict, ProfilePicker, MobileGate).
- `focus-visible` ring styles for keyboard navigation accessibility.
- `prefers-reduced-motion` support — all animations and transitions disabled for users who prefer reduced motion.
- Cursor and hover feedback across all interactive elements (buttons, cards, chips, filters).
- "Build My Schedule" button now has a soft pulse glow when the user hasn't built yet.
- BuildFooter: added border-top, green status dot, and `tabular-nums` for build info.

---

## 2026-03-15 — Mobile Gate Dismiss

### Added
- "OK fine, but let me see it" button on the mobile gate modal so phone users can bypass the warning and use the app anyway.

---

## 2026-03-15 — Build Footer Always Visible

### Fixed
- BuildFooter now renders at the App root level so it's visible on all screens (ProfilePicker, ScheduleBuilder, etc.), not just inside ScheduleBuilder.

---

## 2026-03-14 — Production Deploy Fixes

### Fixed
- Production build errors resolved.
- SPA routing configured via `staticwebapp.config.json` navigationFallback.
- Upgraded `actions/checkout` to v4 to fix Node.js 20 deprecation warning in CI.
- Fixed Azure SWA workflow: set output to `dist`, removed duplicate config.

---

## 2026-03-14 — Initial Release

### Added
- Full schedule planner for Timpanogos High School 2026-2027.
- Course browser with filtering by department, grade, and search.
- Drag-and-drop schedule grid (8 periods, A/B days).
- Course pool with priority ordering.
- Auto-schedule builder with conflict detection.
- Saved versions (snapshots) of schedules.
- Multi-profile support (e.g., different students).
- Pre-loaded course catalog from THS registration guide.
- Abigail's completed courses pre-populated for convenience.
- Mobile-responsive layout with tablet/phone detection.
- Garden theme UI with green/earth-tone palette.
- Deployed to Azure Static Web Apps.
