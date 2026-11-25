# Information architecture

Status: built · 2026-11-18

Screens, routes and flows. What each feature does is in [features.md](features.md).

## Decisions

- **The campus is the canvas.** Screens open as a sheet (phone) or side panel (desktop) over the 3D campus, and the camera follows what's open. FAQ, contact and feedback have nothing to show on the map, so on phone they open full screen.
- **Five tabs:** Explore, Study, Book, Events, More. Rejected: studypleq's seven-item hamburger menu, which hides the main tasks behind a tap.
- **A place is one page.** The Library has one page, and its rooms live on it. Rejected: separate study-spot and booking pages for the same room, as studypleq had.
- **Categories from the card sort, with three fixes:** a place can sit in two categories, faculties are found by search instead of a category, and the services desk gets its own group.
- **State lives in the URL:** selected place, filters, recommend step, booking slot. Back works and links can be shared.

## Places and categories

| #   | Place                             | Categories                     | Rooms                   |
| --- | --------------------------------- | ------------------------------ | ----------------------- |
| 1   | TU Delft Library                  | Study spots, Help and services | Yes, some bookable      |
| 2   | Aula Conference Centre            | Eat and drink, Campus life     | No                      |
| 3   | Pulse                             | Study spots                    | Yes, some bookable      |
| 4   | Echo                              | Study spots                    | Yes                     |
| 5   | EEMCS (EWI) high-rise             | Search only (faculty)          | No                      |
| 6   | Faculty of Architecture (BK City) | Search only (faculty)          | No                      |
| 7   | X (sports and culture centre)     | Campus life                    | No                      |
| 8   | Science Centre Delft              | Campus life                    | No                      |
| 9   | TU Delft Botanical Garden         | Campus life                    | No                      |
| 10  | Mekelpark                         | Campus life                    | No                      |
| 11  | Delft Centraal                    | Getting here                   | No, edge marker         |
| 12  | Tram 19 campus stops              | Getting here                   | No, one marker per stop |
| 13  | Bike parking (Library, Aula)      | Getting here                   | No, one marker per lot  |
| 14  | Faculty canteens and campus cafés | Eat and drink                  | No, one marker each     |
| 15  | Student and Campus Services desk  | Help and services              | No                      |

Which rooms are bookable is set in the mock data. Faculties show on the map with every chip off, like all other places. Tram stops always show as markers; bike parking and cafés show when their category is on or the place is open.

## Layout

- **Phone:** tab bar at the bottom. The sheet has three heights: peek (title only), half (campus and panel share the screen) and full. Dragging it down shows more campus.
- **Desktop:** a rail on the left with the five tabs, a panel of about 400 px next to it, the campus fills the rest.
- **Both:** selecting a place, on the map or in a list, opens its panel and moves the camera. Closing the panel returns to the tab's root.

## Sitemap

```mermaid
flowchart TD
  nav{{"Tab bar on phone, rail on desktop"}}

  nav --> explore["/ · Explore<br/>search, category chips, notices, main tasks"]
  nav --> study["/study · Study spots<br/>places with rooms, occupancy now"]
  nav --> book["/book · Book a room<br/>bookable rooms, type and date-time filters"]
  nav --> events["/events · Events<br/>upcoming, link out"]
  nav --> more["/more · More"]

  explore --> search["Search<br/>places, faculties, rooms"]
  explore --> place
  search --> place
  search --> room

  study --> place
  study --> recommend["/study/recommend · Recommend me a spot"]
  recommend --> room
  recommend -->|a room I can book| book

  place["/places/[place] · Place<br/>about, hours, getting there, notices, rooms"] --> room["/places/[place]/[room] · Room<br/>photos, facilities, directions, share, rating"]
  room -->|bookable| slot
  book --> slot["/book/[room] · Pick a slot<br/>day, start, end, TU Delft email"]
  slot --> sent["/book/sent · Check your inbox<br/>demo email"]
  sent --> confirm["/booking/confirm · Confirm"]
  sent --> cancel["/booking/cancel · Cancel"]
  confirm --> cancel

  more --> faq["/faq · FAQ"]
  more --> contact["/contact · Contact"]
  more --> feedback["/feedback · Feedback"]
  faq -->|couldn't find it| contact

  classDef page fill:#f4f6f8,stroke:#9aa4ae;
  class faq,contact,feedback page;
```

Grey: full-screen pages on phone, no map. Everything else opens over the campus.

## Booking flow

```mermaid
flowchart TD
  filter["Date and time filter"] --> list["Bookable rooms"]
  list --> pick["Pick a slot"]
  roompage["Room page, Book"] --> pick
  pick --> email["TU Delft email"]
  email -->|not a TU Delft address| email
  email --> submit{"Submit"}
  submit -->|slot taken meanwhile| pick
  submit -->|error| retry["Something went wrong<br/>try again"]
  submit -->|ok| inbox["Check your inbox<br/>demo email"]

  inbox -->|confirm link| confirm{"Confirm"}
  confirm -->|ok| confirmed["Confirmed<br/>booking card, cancel link"]
  confirm -->|bad link| invalid["Link not valid"]
  confirm -->|expired or taken| expired["Expired or slot taken<br/>book again"]
  confirm -->|already used| used["Already confirmed or cancelled"]
  confirm -->|server error| later["Try again later"]
  expired --> list

  confirmed -->|cancel link| cancel["Cancel<br/>booking card"]
  inbox -->|cancel link| cancel
  cancel --> sure{"Are you sure?"}
  sure -->|yes| cancelled["Cancelled"]
  sure -->|no| cancel
  cancel -->|already cancelled| gone["Already cancelled"]
  cancel -->|bad link| invalid
```

## Recommend flow

```mermaid
flowchart LR
  need{"What do you need?"}
  need -->|Silent or Group| where{"Where?"}
  need -->|Computer| result
  need -->|A room I can book| book["Book a room<br/>date-time filter open"]

  where -->|Closest to me| location{"Location"}
  where -->|Pick a place| pick["Choose a study place"]
  where -->|Anywhere| result["Four best rooms"]
  location -->|on campus| result
  location -->|denied or off campus| pick
  pick --> result

  result --> room["Room"]
  result --> map["Show on map"]
  result -->|nothing fits| none["No match<br/>all study spots"]
```
