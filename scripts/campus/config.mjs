import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const CACHE = path.join(ROOT, "scripts/.cache");
export const OUT_GLB = path.join(ROOT, "public/campus/campus.glb");
export const OUT_GEO = path.join(ROOT, "data/campus-geo.json");
export const OUT_SOURCE = path.join(ROOT, "public/campus/SOURCE.md");

/** WGS84 box the scene covers: [south, west, north, east]. */
export const BBOX = [51.9865, 4.363, 52.0105, 4.387];

/** Scene origin, between the Aula and the Library. */
export const ORIGIN = { lat: 52.0025, lon: 4.3744 };

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const BAG_API = "https://api.3dbag.nl/collections/pand/items";
export const USER_AGENT = "campus-prototype/0.1 (one-off build, cached)";

/** OSM way of the TU Delft campus area: buildings inside get LoD 2.2. */
export const CAMPUS_AREA_WAY = 201337847;

/** Tram 19 towards TU Delft: its campus stops and its track. */
export const TRAM_19_RELATION = 21478919;
export const TRAM_19_CAMPUS_STOPS = [
  "Julianalaan",
  "Aula",
  "Mekelpark",
  "Berlageweg",
  "Schoemakerstraat",
];

/**
 * How each place is found in OSM. `bag` matches 3DBAG directly, `point` takes
 * the 3DBAG footprint that contains an OSM node, `area` takes an OSM polygon.
 */
export const PLACES = {
  library: { building: { osmRelation: 6737536, point: [52.00268, 4.37524] } },
  aula: { building: { point: [52.00219, 4.37347] } },
  pulse: { building: { bag: ["0503100000036577"] } },
  echo: { building: { bag: ["0503100000036818"] } },
  eemcs: { building: { point: [51.99884, 4.37365] } },
  flux: { building: { bag: ["0503100000037977"], fallback: "flux" } },
  "bk-city": { building: { bag: ["0503100000032914"] } },
  x: { building: { bag: ["0503100000025419", "0503100000019276"] } },
  "science-centre": { building: { point: [51.99761, 4.37856] } },
  "botanical-garden": { areaWay: 143448512 },
  mekelpark: { areaWay: 868889396 },
  "delft-centraal": { stationNode: 3376839743 },
  "tram-19": { tramStops: true },
  "bike-parking": { bikeNear: ["library", "aula"], radius: 120 },
  food: { food: true },
  "services-desk": { node: 2596109166 },
};

export const PLACE_IDS = Object.keys(PLACES);
