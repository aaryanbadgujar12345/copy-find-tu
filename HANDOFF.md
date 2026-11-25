# Handoff

Left: ~3 hours of agent work, plus 8 items waiting on people · updated 2026-11-25
Status: ⬜ open · 🟡 in progress · ✅ done

## Next

- ⬜ **Review the prototype** on phone and desktop: `pnpm dev`, then the flows in [README.md](README.md#try-it). Owner: you.
- ⬜ **Still image for devices without WebGL** · ~30 min. The spec asks for a still of the campus; today they get a short message instead. Owner: agent.
- ⬜ **`ui-review` pass** on the main screens · ~1h. Owner: agent.
- ⬜ **Rebuild the campus model** with `pnpm build:campus` on a machine with internet. The box now reaches south to 51.9865, so Aerospace Engineering, The Fellowship and the rest of south campus get 3D buildings; today the scene stops just south of X and only the campus outline continues. Until then, `node scripts/campus/patch-glb.mjs` was used to split campus and city buildings and add Flux offline. Owner: agent.
- ⬜ **Walking routes from your location** · ~1h. Directions draw a straight line from you to the building and hand off to Google Maps for street-by-street directions. Shipping the campus path network (already built for the tram routes) as a small graph would let the map draw the real route. Owner: agent.

## Open questions

- ⬜ **TU Delft brand use.** Can this prototype use the TU Delft name, flame logo and cyan, and who signs off? The app uses the cyan and the name, no logo. Owner: you.
- ⬜ **Booking email domains.** Assumed `@tudelft.nl` and `@student.tudelft.nl`. Owner: you.
- ⬜ **Product name.** `find-tu` is a working name. Renaming also renames the GitHub repo. Owner: you.
- ⬜ **Services desk location.** Pinned to the OSM point "Education & Student Affairs", which has no building of its own. Is that the desk students actually visit? Owner: you.
- ⬜ **Science Centre building.** The OSM point sits in the building OSM calls "Bouwcampus" (Van der Burghweg 1). Confirm it's the right one. Owner: you.
- ⬜ **Hosting.** Which Vercel project and team for previews? Owner: you.
- ⬜ **Flux height and hours.** Flux isn't in 3DBAG yet, so it's drawn from its OSM footprint as a 12 m block ([TBC: real roof height]). Its opening hours aren't published, so the app says "Opening hours not listed". Owner: you.

## Placeholder content

Invented for the mocks. Replace before anyone outside the team sees it.

- Rooms, seats, facilities, floors and directions in Library, Pulse and Echo (`data/rooms.ts`).
- Room photos: illustrations stand in for real photos.
- Opening hours and summaries for all 15 places (`data/places.ts`).
- Events, FAQ entries and notices (`data/content.ts`). Events now have fixed dates (26 Nov to 11 Dec 2026) and no "More info" link until there's a real page; the Events screen says they're examples. After 11 Dec the list is empty.
- Occupancy is an estimate from the hour of day and the day of the week, labelled as one in the app. Other people's bookings are generated per room and day.

## Verify

Built and checked in headless Chrome. Still needs a real device:

- ⬜ **Phone gestures** · on an iPhone and an Android: drag the sheet between its three heights, pan with one finger, pinch and rotate with two → the map moves, the page doesn't. Owner: you.
- ⬜ **Directions from my location** · on campus, a place → Directions from my location → allow location → a blue dot, a line to the building, distance and minutes that update as you walk, "You've arrived" within 30 m. Open route in Google Maps → walking directions from where you are. Owner: you.
- ⬜ **Screen reader** · VoiceOver on iPhone and NVDA on Windows: skip link, search results are announced, busy levels read as "Busy, estimate", directions updates are announced. Owner: you.
- ⬜ **Closest to me** · on campus, Recommend → Silent → Closest to me → allow location → rooms with distances. Off campus it should say so. Owner: you.
- ⬜ **Share** · on a phone, a room → Share → the system share sheet opens. Owner: you.
- ⬜ **Frame rate** · scroll and pan the campus on a mid-range Android → smooth, no stutter. Owner: you.
