import fs from "node:fs/promises";
import path from "node:path";
import { BAG_API, BBOX, CACHE, OVERPASS_URL, USER_AGENT } from "./config.mjs";
import { rdFromLatLon } from "./geo.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cached(name, load) {
  const file = path.join(CACHE, name);
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    await fs.mkdir(CACHE, { recursive: true });
    const data = await load();
    await fs.writeFile(file, JSON.stringify(data));
    return data;
  }
}

async function overpass(query) {
  for (let attempt = 0, wait = 10_000; attempt < 6; attempt++, wait *= 2) {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(240_000),
    }).catch((error) => ({ ok: false, status: error.name }));
    if (res.ok) return res.json();
    console.log(`  overpass ${res.status}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("Overpass kept failing");
}

const B = BBOX.join(",");

const MAIN_QUERY = `[out:json][timeout:180];
(
  way["highway"](${B});
  nwr["natural"~"^(water|wood|scrub|grassland|tree_row|wetland)$"](${B});
  nwr["water"](${B});
  way["waterway"~"^(canal|river|ditch|stream|drain)$"](${B});
  nwr["landuse"~"^(grass|meadow|recreation_ground|forest|village_green|flowerbed|allotments|cemetery|plant_nursery|education|basin|reservoir)$"](${B});
  nwr["leisure"~"^(park|garden|pitch|playground|sports_centre|track|common|nature_reserve)$"](${B});
  node["natural"="tree"](${B});
  nwr["amenity"~"^(bicycle_parking|cafe|restaurant|fast_food|university|library|college)$"](${B});
  nwr["building"]["name"](${B});
  nwr["railway"="tram_stop"](${B});
  nwr["public_transport"](${B});
  relation["route"="tram"]["ref"="19"](${B});
  nwr["railway"="station"]["name"~"Delft"](51.99,4.34,52.02,4.37);
);
out geom;`;

/** The services desk point (see PLACES in config.mjs). */
const SERVICES_QUERY = `[out:json][timeout:30];
node(2596109166);
out;`;

export async function loadOsm() {
  const main = await cached("osm.json", () => overpass(MAIN_QUERY));
  const services = await cached("osm-services.json", () =>
    overpass(SERVICES_QUERY),
  );
  const byKey = new Map();
  for (const e of [...main.elements, ...services.elements]) {
    byKey.set(`${e.type}/${e.id}`, { ...byKey.get(`${e.type}/${e.id}`), ...e });
  }
  return [...byKey.values()];
}

/** Every 3DBAG pand in the box, fetched in 500 m tiles that follow `next` links. */
export async function loadBag() {
  const [s, w, n, e] = BBOX;
  const [minX, minY] = rdFromLatLon(s, w);
  const [maxX, maxY] = rdFromLatLon(n, e);
  const step = 500;
  const features = new Map();
  for (let x = Math.floor(minX); x < maxX; x += step) {
    for (let y = Math.floor(minY); y < maxY; y += step) {
      const box = [x, y, Math.min(x + step, maxX), Math.min(y + step, maxY)]
        .map((v) => Math.round(v))
        .join(",");
      const pages = await cached(`3dbag-${box}.json`, async () => {
        const out = [];
        let url = `${BAG_API}?bbox=${box}&limit=100`;
        let matched = 0;
        let objects = 0;
        while (url) {
          const res = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
          });
          if (!res.ok) throw new Error(`3DBAG ${res.status} for ${url}`);
          const d = await res.json();
          matched = d.numberMatched;
          const found = d.features ?? [];
          for (const f of found) objects += Object.keys(f.CityObjects).length;
          if (found.length && d.metadata) {
            out.push({ transform: d.metadata.transform, features: found });
          }
          url = d.links?.find((l) => l.rel === "next")?.href;
          await sleep(150);
        }
        if (objects !== matched) {
          console.log(
            `  tile ${box}: ${objects} objects of ${matched} matched`,
          );
        }
        console.log(`  fetched tile ${box}: ${out.length} pages`);
        return out;
      });
      for (const page of pages) {
        for (const f of page.features) {
          if (!features.has(f.id))
            features.set(f.id, { ...f, transform: page.transform });
        }
      }
    }
  }
  return [...features.values()];
}
