# Brand

Status: direction set, most tokens still to design · 2026-11-18

## Direction

- Calm and precise, like a good campus model. One accent colour, lots of air, the campus itself as the hero.
- One focal point per screen: the place or room you're looking at.
- Written for a new international student: plain English, names before codes, no jargon.

## Tokens carried over

| Token             | Value                        | Use                                     |
| ----------------- | ---------------------------- | --------------------------------------- |
| `brand`           | `#00A6D6` TU Delft cyan      | Accent, selection, primary action fills |
| `brand-dark`      | `#0C2340` TU Delft dark blue | Optional, for text and dark surfaces    |
| `font`            | Inter, variable              | Everything                              |
| `occupancy-quiet` | `#8DDA8C`                    | Quiet                                   |
| `occupancy-busy`  | `#FFBA52`                    | Busy                                    |
| `occupancy-full`  | `#C95555`                    | Full                                    |

Both TU Delft values come from the TU Delft corporate design colour page. Neutrals, surfaces, radii, shadows and motion get designed fresh at build.

## Rules

- **Cyan is a fill, not a text colour.** `#00A6D6` on white is about 2.8:1, below AA for text and for thin icons. Put dark text on cyan fills, and use dark blue or a darker cyan for links.
- **Occupancy is never colour alone.** It always pairs the colour with a word and a number. The green and orange are light, so text on them is dark.
- **Motion:** camera moves ease out and stay under about a second. Reduced motion cuts them.

## References

- studypleq's Figma for flows only (link in `../studypleq/README.md`).
- Place sheets in Apple Maps and Google Maps, transit in Citymapper.
- TU Delft corporate design: tudelft.nl/en/tu-delft-corporate-design. [TBC: logo files and permission, see HANDOFF.md]
