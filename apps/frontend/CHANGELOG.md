# BulkFlow Frontend — Changelog

Real bugs found and fixed while testing this against the backend's actual
API contracts and Socket.IO behavior, in the order they were found.

## Results page never updated live

`useResults` fetched once on mount and never again. The job page already had
live socket updates; the results table didn't. Fixed: the Results page now
joins the active job's socket room and also polls every 4s while the job is
`queued`/`processing` (there's no per-row socket event from the backend, so
this is the closest to "live" the current API allows), stopping once the job
finishes. A pulsing "Live" badge shows when this is active.

## Mobile nav drawer stayed open after navigating

Tapping a link in the mobile sidebar drawer navigated but left the drawer
open over the new page. Fixed: the drawer now closes itself when a link
inside it is clicked.

## "New Upload" button overlapped the mobile header

`hidden sm:inline-flex` lost to the button's own base `inline-flex` class at
some widths. Changed to `max-sm:hidden`, which always wins.

## AI Enrichment page claimed the mock provider "always" runs

This was accurate when written, but became stale the moment real Gemini
enrichment was wired up on the backend. The page now reads
`GET /dashboard`'s `data.enrichment.geminiConfigured` and shows real status
("Connected · gemini-1.5-flash" vs. "Not connected - falls back to mock")
instead of a hardcoded claim.

## Socket reconnection: two separate real bugs

1. **The job room was never rejoined on reconnect.** `useJobSocket` only
   joined the `job:{id}` room once, when the hook first ran. Socket.IO rooms
   live on the server-side connection; when the transport reconnects after
   any network blip, that's a new connection server-side and the old room
   membership is gone. The UI would keep showing a "Live" badge while
   silently receiving nothing. Fixed: the hook now rejoins on every
   `connect` event, not just the first one.

2. **Socket.IO does not auto-reconnect after a server-initiated disconnect**
   (e.g. a backend deploy or restart) — this is intentional default
   behavior in the library, not a transport failure, so its automatic
   reconnection logic skips it. Every connected client would go dead and
   stay dead until the page was manually refreshed. Fixed: `useJobSocket`
   checks the disconnect reason and calls `socket.connect()` itself when
   `reason === 'io server disconnect'`.

   Verified with a real A/B test against a mock server that forcibly
   disconnects every socket: reproduced the stuck-forever behavior with the
   fix removed, confirmed it resolves with the fix restored (live updates
   resume within ~150ms of the server-side disconnect on localhost, well
   under Socket.IO's default 1s reconnection backoff, since the fix calls
   `connect()` immediately rather than waiting for the library's own retry
   timer).

## What wasn't (and can't be) tested here

This project has no automated test suite (no Vitest/RTL in `package.json`).
Verification during development was done with throwaway Puppeteer scripts
against a hand-written mock API server matching the real backend's response
shapes - useful for catching real bugs (all of the above were found this
way), but not a substitute for running this against your actual backend with
real data. The mock scripts aren't included in this zip.
