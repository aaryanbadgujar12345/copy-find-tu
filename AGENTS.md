# Agents

## Read first

In order: [README.md](README.md), the spec you're working on, [BRAND.md](BRAND.md). When they conflict, the earlier one wins.

## Nav map

| Path                 | Holds                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| `app/`               | Routes, see [specs/information-architecture.md](specs/information-architecture.md)  |
| `components/shell/`  | Tab bar, rail, and the panel that is a sheet on phone and a side panel on desktop   |
| `components/campus/` | The 3D campus: model, labels, camera, trees and routes                              |
| `components/<area>/` | Screens by area: `explore`, `places`, `rooms`, `study`, `booking`, `events`, `more` |
| `components/ui/`     | Shared pieces: buttons, rows, occupancy tags, notices, stars                        |
| `data/`              | Mock fixtures and `types.ts`. `campus-geo.json` is generated, don't edit it         |
| `lib/data/`          | The data layer, the only code that reads fixtures or browser storage                |
| `lib/`               | Campus clock, opening hours, occupancy, search, recommendation, map focus           |
| `lib/copy.ts`        | All UI copy, English                                                                |
| `public/campus/`     | The campus GLB and `SOURCE.md`                                                      |
| `scripts/`           | `build-campus.mjs`, which makes the GLB and `data/campus-geo.json`                  |

## Rules

- **studypleq is a reference, never a source.** `../studypleq` shows which screens, flows and features exist. Don't copy its code, logic, styles, assets or data shapes. Build each feature from its spec.
- **TU Delft only.** No tenant switches, no VU paths.
- **Mock data only.** Everything goes through `lib/data/`. No API design beyond what the mocks need.
- **No invented facts.** Missing a real hour, name, number or date? Write `[TBC: what's needed]` and add it to [HANDOFF.md](HANDOFF.md). Invented mock content is fine, as long as HANDOFF.md lists it.
- **Lint only.** ESLint with accessibility rules, and Prettier. No test suite unless asked.
- **Few dependencies.** Add a package only when it earns its place, and say why in the spec.
- **Legible over clever.** A junior developer can read it. Flag a file past ~500 lines for a split.
- **No code comments** unless the why isn't obvious.
- **Copy** in English, all of it in `lib/copy.ts`.
- **Answer length:** short by default, longer only for plans and reviews.
- **Never commit or push** unless asked. Stage named paths only, since parallel sessions share the tree.
- **Brand names** in their exact casing: TU Delft, 3DBAG, EEMCS (EWI), BK City, Pulse, Echo, X, Aula, Mekelpark, Delft Centraal.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
