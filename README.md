# find-tu

Working name. A campus app for TU Delft students: find a study spot, book a room, see what's on and find your way around campus. A fresh prototype on mock data that will grow into the replacement for studypleq.

## For whom

A new international student at TU Delft, on phone and desktop. They think in tasks: how do I get there, where do I study, where do I eat.

## Scope

The student features studypleq has today, rebuilt from scratch for TU Delft, plus the 15 campus places from the POI card sort.

- Features: [specs/features.md](specs/features.md)
- Screens, routes and flows (Mermaid): [specs/information-architecture.md](specs/information-architecture.md)
- How it's built: [specs/architecture.md](specs/architecture.md)

## Out of scope for now

VU and other campuses · campus kiosk · sign-in, My bookings, event RSVP · a real API, sensors or email · cookie banner and trackers · install prompt · Dutch · a test suite. Parked in [IDEAS.md](IDEAS.md).

## Architecture

- Next.js App Router, TypeScript, Tailwind, pnpm, on Vercel.
- One 3D campus scene (React Three Fiber, built from 3DBAG) behind every screen.
- Typed mock data behind one thin data layer. Writes stay in the browser.

## Quickstart

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm lint           # ESLint, route types, TypeScript
pnpm build:campus   # rebuild the 3D campus from 3DBAG and OpenStreetMap (cached in scripts/.cache)
```

## Try it

- **Study:** Study → a place → a room. Or Recommend me a spot → Silent → Pick a place → Library.
- **Book:** Book → a room → a day, a start and an end → `you@student.tudelft.nl` → Check your inbox → Confirm booking → Cancel this booking.
- **Map:** tap a label, switch to 2D, filter by category on Explore.
- **Error states:** add `?fail=<area>` to a URL, where area is `booking`, `taken`, `confirm`, `cancel`, `contact`, `feedback` or `rating`.

Bookings, ratings and messages live in the browser's localStorage. Clear site data to start over.

## Deploy

Vercel, from `main`. [TBC: Vercel project]

## Docs

[AGENTS.md](AGENTS.md) rules · [BRAND.md](BRAND.md) design direction · [HANDOFF.md](HANDOFF.md) what people still have to do · [IDEAS.md](IDEAS.md) parked ideas
