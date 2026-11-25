# Handoff

Left: ~2 hours of agent work, plus 6 items waiting on people · updated 2026-11-18
Status: ⬜ open · 🟡 in progress · ✅ done

## Next

- ⬜ **Review the prototype** on phone and desktop: `pnpm dev`, then the flows in [README.md](README.md#try-it). Owner: you.
- ⬜ **Still image for devices without WebGL** · ~30 min. The spec asks for a still of the campus; today they get a short message instead. Owner: agent.
- ⬜ **`ui-review` pass** on the main screens · ~1h. Owner: agent.

## Open questions

- ⬜ **TU Delft brand use.** Can this prototype use the TU Delft name, flame logo and cyan, and who signs off? The app uses the cyan and the name, no logo. Owner: you.
- ⬜ **Booking email domains.** Assumed `@tudelft.nl` and `@student.tudelft.nl`. Owner: you.
- ⬜ **Product name.** `find-tu` is a working name. Renaming also renames the GitHub repo. Owner: you.
- ⬜ **Services desk location.** Pinned to the OSM point "Education & Student Affairs", which has no building of its own. Is that the desk students actually visit? Owner: you.
- ⬜ **Science Centre building.** The OSM point sits in the building OSM calls "Bouwcampus" (Van der Burghweg 1). Confirm it's the right one. Owner: you.
- ⬜ **Hosting.** Which Vercel project and team for previews? Owner: you.

## Placeholder content

Invented for the mocks. Replace before anyone outside the team sees it.

- Rooms, seats, facilities, floors and directions in Library, Pulse and Echo (`data/rooms.ts`).
- Room photos: illustrations stand in for real photos.
- Opening hours and summaries for all 15 places (`data/places.ts`).
- Events, FAQ entries and notices (`data/content.ts`). Every event's "More info" links to the TU Delft home page.
- Occupancy (simulated from the hour of day) and other people's bookings (generated per room and day).

## Verify

Built and checked in headless Chrome. Still needs a real device:

- ⬜ **Phone gestures** · on an iPhone and an Android: drag the sheet between its three heights, pan with one finger, pinch and rotate with two → the map moves, the page doesn't. Owner: you.
- ⬜ **Closest to me** · on campus, Recommend → Silent → Closest to me → allow location → rooms with distances. Off campus it should say so. Owner: you.
- ⬜ **Share** · on a phone, a room → Share → the system share sheet opens. Owner: you.
- ⬜ **Frame rate** · scroll and pan the campus on a mid-range Android → smooth, no stutter. Owner: you.
