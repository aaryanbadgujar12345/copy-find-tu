# Architecture

Status: built · 2026-11-18

How the prototype is built. Folder map: [AGENTS.md](../AGENTS.md#nav-map).

## Stack

- Next.js App Router, TypeScript, Tailwind, pnpm, on Vercel. Latest stable versions at scaffold.
- ESLint with accessibility rules, and Prettier. No test suite.
- 3D: three.js through React Three Fiber, plus drei for camera controls and helpers.
- Extra packages: `lucide-react` for icons and `uqr` for QR codes, both tree-shaken and tiny. Build-only: `proj4`, `earcut` and `@gltf-transform` for the campus script.
- Rejected after all: vaul and Radix. The sheet needs to stay open and non-modal over the map, which a small hand-written sheet does better. Dialogs use the native `<dialog>`, tabs are a plain ARIA tablist, the FAQ uses `<details>`.

## Decisions

- **Fresh project.** Nothing from studypleq's code, logic or styles.
- **React Three Fiber, not a map library.** Full control over the look, no map-tile costs, and the app only needs one campus. Rejected: deck.gl on Mapbox as today (paid tokens, layers of hand-drawn GeoJSON). Rejected: MapLibre with 3D buildings (real streets, much less control over the look). Revisit if the app ever needs street-level navigation.
- **Mock data behind one data layer.** Rejected: designing a full API now.
- **One clock: Europe/Amsterdam.** A student abroad still sees campus hours.
- **Next 16 with Cache Components.** Pages are prerendered. Dynamic `params` are read in a child behind `<Suspense>`, and every component that reads search params or browser storage sits behind one too. Time and storage hooks return `null` while prerendering, so those parts render a skeleton first.
- **The URL drives the map.** `lib/map-focus.ts` turns the path and query into what the campus shows (selected place, highlighted places, route). No shared map state to keep in sync.

## 3D campus

- **Source:** 3DBAG, the open 3D model of every building in the Netherlands, by TU Delft's 3D geoinformation group. Licence CC BY 4.0, so the map carries a small "3DBAG" credit in a corner.
- **Pipeline:** `pnpm build:campus` fetches buildings from api.3dbag.nl and ground, trees, paths and places from OpenStreetMap (Overpass), names the POI buildings, computes walking routes, compresses, and writes `public/campus/campus.glb` plus `data/campus-geo.json`. Downloads are cached in `scripts/.cache`. Sources and licences are in `public/campus/SOURCE.md`.
- **Scene:** each POI building is a mesh named `place-<id>` (three.js drops `:` from names), listed per place in `meshes`. Other buildings inside the TU Delft campus outline (OSM way 201337847) are `context-campus`, tinted TU cyan; the city around it is `context`, muted. The outline itself is in `campus-geo.json` and drawn as a dashed line over a tinted ground. A building 3DBAG doesn't have yet (Flux) is extruded from its OSM footprint.
- **Edge fade:** the fog shader chunks are swapped for a fade by distance from the middle of the model, so the scene melts into the background instead of ending in a square.
- **Directions:** `lib/navigation.ts` follows the device with `watchPosition`, maps lat/lon onto the scene with an affine fit to the places in `campus-geo.json` (no proj4 in the bundle), and hands off to Google Maps for street-by-street walking directions. Trees and bike racks are instanced. Result: 1.4 MB, about 183k triangles.
- **Labels** are normal buttons in the page, moved every frame to where their 3D point lands on screen. Rejected: drei's `Html`, which gives every label its own React root and floods dev mode with unmount errors.
- **Panning** uses camera-controls' `SCREEN_PAN`, which moves along the ground like a map. Its old `verticalDragToForward` option is gone in v3.
- **Camera:** a constrained orbit with fly-to on select, and a top-down preset for 2D. Reduced motion cuts instead of flying.
- **Budget:** GLB under ~3 MB, 60 fps on a recent iPhone, 30 fps or better on a mid-range Android.
- **Fallback:** without WebGL the panels work on their own. The campus area shows a short message for now; the still image is open in [HANDOFF.md](../HANDOFF.md).

## Data layer

- `data/` holds typed fixtures: places, rooms, booking rules, events, FAQ, notices.
- `lib/data/` is the only way in: `catalog.ts` for the fixtures, `bookings.ts` for availability and the booking flow, `messages.ts` for contact, feedback and ratings, `storage.ts` underneath. A real backend can replace them one file at a time.
- Writes (bookings, confirms, cancels, contact, feedback, ratings) go to `localStorage` through the same layer and read back, so a booked slot shows as taken.
- The catalog (places, rooms, events, FAQ, notices) is read directly and prerendered. Writes and anything from browser storage go through a short fake delay. A `?fail=<area>` switch shows each error state.
- **Occupancy** is simulated per room from the hour of day and a fixed seed: stable on reload, moving through the day, refreshed every minute. Some rooms have no sensor.
- **Recommendation** ranks rooms by: matching type, open now, least busy, and closer first when the location is known.
