# Features

Status: built as a prototype on mock data · 2026-11-18

What the prototype does. Feature parity with studypleq's student app, rebuilt for TU Delft, plus the campus places from the POI card sort. Screens and routes: [information-architecture.md](information-architecture.md). How it's built: [architecture.md](architecture.md).

## Decisions

- **Parity first.** No new features until the prototype works end to end on mock data.
- **TU Delft only, phone and desktop.** No VU, no kiosk.
- **The 15 POIs are the map's places.** The list and their categories are in [information-architecture.md](information-architecture.md#places-and-categories).
- **Only Library, Pulse and Echo have rooms.** Every other place gets an info panel.
- **Booking confirms by a link, as today.** Nothing sends real email, so "Check your inbox" shows a demo email holding the confirm and cancel links.
- **No phone landing page.** Its job (welcome plus three tasks) moves into the Explore sheet, so the campus is always one look away. Rejected: studypleq's separate landing screen.
- **Two extra bookable rooms in the mock**, a silent booth and a PC room, so the booking type filter has something to filter.
- **No WebGL shows a message for now**, not the still image F1 asks for. Tracked in [HANDOFF.md](../HANDOFF.md).
- Rejected for now: sign-in, My bookings and event RSVP. A booking app outgrows email links, but these are new features. Parked in [IDEAS.md](../IDEAS.md).

## F1 · 3D campus

- Every screen sits on one 3D scene of the campus, built from 3DBAG.
- Study places are tinted by occupancy right now: quiet, busy, full. Other places stay neutral.
- Tap a place: the camera flies to it and its panel opens.
- The selected place lights up the walking route from the nearest tram 19 stop.
- Trees, bike parking and tram stops are scene props.
- 2D toggle: the same scene, seen from straight above.
- Delft Centraal is outside the scene. An edge marker in its direction opens its panel.
- Reduced motion: the camera cuts instead of flying. No WebGL: the panels still work, the campus area shows a still image.

studypleq had: deck.gl on Mapbox with 3D buildings, trees, routes, bike parking, sports courts and a 2D/3D toggle.

## F2 · Explore and search

- Category chips filter the map: Getting here, Study spots, Eat and drink, Campus life, Help and services. No chip means everything.
- A place can be in more than one category.
- Search finds places, faculties and rooms. Faculties (EEMCS, BK City) are found here, not under a chip.
- Campus notices show at the top.
- On phone, the sheet also holds the three main tasks: find a study spot, book a room, events.

studypleq had: a phone landing page with three tiles. No search, no categories.

## F3 · Place panel

- Name, what it is, opening hours (today, and the week on tap), how to get there with a Google Maps link, notices for this place.
- Study places add occupancy right now and their rooms (see F4).
- Delft Centraal and the tram stops show how to get to campus.

studypleq had: a building popup with hours, then a building panel with its rooms.

## F4 · Find a study spot

- Study places with occupancy, a crowd word and today's hours. Closed ones go last.
- Rooms in a place, filtered by Silent, Group or Computer, each with seats and an occupancy bar.
- Previous and next place, previous and next room.
- A room without a sensor shows no bar and no number, never a fake zero.

## F5 · Room detail

- Photos, seats, occupancy and facilities: coffee, daylight, toilet, number of sockets, whiteboard, monitor.
- Two tabs: Facilities and Directions (written steps inside the building).
- Share: the system share sheet where there is one, otherwise WhatsApp and copy link. On desktop, a QR code to open the room on your phone.
- Rate the room and leave a comment.
- A bookable room shows Book, which opens F7 for that room.

## F6 · Recommend me a spot

- Step 1, what do you need: Silent, Group, Computer, or A room I can book.
- Step 2 for Silent and Group, where: closest to me (location), pick a place, or anywhere.
- Computer goes straight to the result. A room I can book goes to F7 with the date and time filter open.
- Result: the four best rooms, each with occupancy, key facilities, a show-on-map button and a link to the room.
- Back steps through the answers, and a progress bar shows how far along you are.
- Location denied or off campus: say so and offer pick a place.
- Nothing fits: say so and link to all study spots.

## F7 · Book a room

- Bookable rooms with today's status: free now, free later, full today.
- Filter by type, and by date and time across all bookable rooms.
- Pick a day (today plus 14 days), then a start and end on a 30-minute grid, 2 hours at most. Taken slots show as taken, past ones are hidden.
- Each room's rules (window, slot length, longest booking) live in the mock data, with the defaults above.
- Book with a TU Delft email address: `@tudelft.nl` or `@student.tudelft.nl` [TBC: confirm domains].
- Submit: "Check your inbox", with the demo email.
- Errors: the slot was taken meanwhile (back to the picker, slot marked), something went wrong (try again).

## F8 · Confirm and cancel by link

- Confirm link outcomes: confirmed, link not valid, expired or slot taken, already used, try again later.
- Confirmed shows the booking card and the cancel link.
- Cancel link: the booking card, an "are you sure" dialog, then cancelled. Also: already cancelled, link not valid.

## F9 · Events

- Cards with image, title, date and time, place, a short text and a link out for more.
- Upcoming first, past events hidden, an empty state when there's nothing on.

## F10 · Notices

- Banners for the whole campus and per place, in two kinds: warning and notice.
- Shown while active. Each can be closed for the session.

## F11 · FAQ, contact and feedback

- FAQ: grouped questions that expand. "Couldn't find what you need?" leads to contact.
- Contact: name, email and message, then sent or failed.
- Feedback: rate the campus facilities from 1 to 5 and add a comment, then a thank-you.

## F12 · Shell

- Phone: a tab bar and a sheet over the campus. Desktop: a rail and a side panel over the campus. Details in [information-architecture.md](information-architecture.md#layout).
- The clock is campus time (Europe/Amsterdam) whatever the device's zone, so hours and slots match campus.
- Every data read has a loading and an error state.
- Accessibility: WCAG AA contrast, every flow works by keyboard, occupancy is never colour alone, reduced motion is respected.

## Dropped from studypleq

- The kiosk build and all its parts: QR hand-off, idle reset, heartbeat, remote control.
- The cookie banner, GA4, Clarity and click tracking.
- The iOS install prompt and the service worker.
- Per-university branding and settings. There's one campus, set in code.
- Disabled right-click.
