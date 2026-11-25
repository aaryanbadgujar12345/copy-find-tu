/**
 * Builds the 3D campus from 3DBAG and OpenStreetMap:
 * public/campus/campus.glb, data/campus-geo.json and public/campus/SOURCE.md.
 * Downloads are cached in scripts/.cache, so reruns work offline.
 */
import fs from "node:fs/promises";
import * as prettier from "prettier";
import path from "node:path";
import {
  BBOX,
  CAMPUS_AREA_WAY,
  ORIGIN,
  OUT_GEO,
  OUT_GLB,
  OUT_PATHS,
  OUT_SOURCE,
  PLACE_IDS,
  PLACES,
  TRAM_19_CAMPUS_STOPS,
  TRAM_19_RELATION,
} from "./campus/config.mjs";
import { loadBag, loadOsm } from "./campus/fetch.mjs";
import {
  dist,
  latLonFromScene,
  pointInRing,
  ringArea,
  ringCentroid,
  round1,
  sceneFromLatLon,
  simplifyLine,
} from "./campus/geo.mjs";
import {
  MeshBuilder,
  addBuilding,
  extrudeFootprint,
  parseFeature,
} from "./campus/buildings.mjs";
import {
  CAMPUS_OUTLINE,
  FLUX_FOOTPRINT,
  FLUX_HEIGHT,
} from "./campus/campus-area.mjs";
import { areaPolygons, buildGround, clipLine } from "./campus/ground.mjs";
import {
  buildGraph,
  nearestNode,
  nearestNodeToRing,
  pathTo,
  shortestFrom,
} from "./campus/routes.mjs";
import { writeGlb } from "./campus/glb.mjs";

const pt = (p) => [round1(p[0]), round1(p[1])];

function elementPoint(e) {
  if (e.lat != null) return sceneFromLatLon(e.lat, e.lon);
  if (e.center) return sceneFromLatLon(e.center.lat, e.center.lon);
  if (e.geometry?.length) {
    const g = e.geometry;
    return sceneFromLatLon(
      g.reduce((s, p) => s + p.lat, 0) / g.length,
      g.reduce((s, p) => s + p.lon, 0) / g.length,
    );
  }
  if (e.bounds) {
    return sceneFromLatLon(
      (e.bounds.minlat + e.bounds.maxlat) / 2,
      (e.bounds.minlon + e.bounds.maxlon) / 2,
    );
  }
  return null;
}

/** A point inside the ring, near its centroid. */
function interiorPoint(ring) {
  const c = ringCentroid(ring);
  if (pointInRing(c, ring)) return c;
  let best = null;
  let bestD = Infinity;
  const xs = ring.map((p) => p[0]);
  const zs = ring.map((p) => p[1]);
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 4) {
    for (let z = Math.min(...zs); z <= Math.max(...zs); z += 4) {
      if (pointInRing([x, z], ring) && dist([x, z], c) < bestD) {
        bestD = dist([x, z], c);
        best = [x, z];
      }
    }
  }
  return best ?? c;
}

function compass(from, to) {
  const dx = to[0] - from[0];
  const dn = -(to[1] - from[1]);
  if (Math.hypot(dx, dn) < 25) return null;
  const deg = (Math.atan2(dx, dn) * 180) / Math.PI;
  return ["north", "east", "south", "west"][
    Math.round(((deg + 360) % 360) / 90) % 4
  ];
}

/** Merge points closer than `radius` into one, averaging their position. */
function cluster(points, radius) {
  const groups = [];
  for (const p of points) {
    const g = groups.find((c) => dist(c.at, p) < radius);
    if (g) {
      g.members.push(p);
      g.at = [
        g.members.reduce((s, q) => s + q[0], 0) / g.members.length,
        g.members.reduce((s, q) => s + q[1], 0) / g.members.length,
      ];
    } else groups.push({ at: p, members: [p] });
  }
  return groups.map((g) => g.at);
}

async function main() {
  console.log("Loading OSM and 3DBAG (cached after the first run)");
  const osm = await loadOsm();
  const features = await loadBag();
  const byId = new Map(osm.map((e) => [`${e.type}/${e.id}`, e]));

  const [s, w, n, e] = BBOX;
  const sw = sceneFromLatLon(s, w);
  const ne = sceneFromLatLon(n, e);
  const box = [sw[0], ne[1], ne[0], sw[1]];
  const inBox = (p) =>
    p[0] >= box[0] && p[0] <= box[2] && p[1] >= box[1] && p[1] <= box[3];

  const campusRings = [];
  for (const el of osm) {
    const t = el.tags ?? {};
    const isCampus =
      (el.type === "way" && el.id === CAMPUS_AREA_WAY) ||
      t.landuse === "education" ||
      ["university", "college"].includes(t.amenity);
    if (!isCampus) continue;
    for (const poly of areaPolygons(el)) campusRings.push(poly.outer);
  }
  const onCampus = (p) => campusRings.some((r) => pointInRing(p, r));

  const buildings = features
    .map(parseFeature)
    .filter((b) => b && b.footprints.length)
    .map((b) => {
      const main = b.footprints.reduce((a, c) =>
        Math.abs(ringArea(c)) > Math.abs(ringArea(a)) ? c : a,
      );
      return { ...b, main, centroid: ringCentroid(main) };
    })
    .filter((b) => inBox(b.centroid));
  console.log(`${buildings.length} buildings in the box`);

  const placeBuildings = {};
  const taken = new Set();
  for (const id of PLACE_IDS) {
    const rule = PLACES[id].building;
    if (!rule) continue;
    let found = [];
    if (rule.bag) found = buildings.filter((b) => rule.bag.includes(b.bag));
    else if (rule.point) {
      const p = sceneFromLatLon(rule.point[0], rule.point[1]);
      found = buildings.filter((b) =>
        b.footprints.some((r) => pointInRing(p, r)),
      );
    }
    if (!found.length && rule.fallback === "flux") {
      console.log(`  ${id}: not in 3DBAG, extruding the OSM footprint`);
      continue;
    }
    if (!found.length) throw new Error(`No 3DBAG building for ${id}`);
    placeBuildings[id] = found;
    for (const b of found) taken.add(b.id);
    console.log(`  ${id}: ${found.map((b) => b.bag).join(", ")}`);
  }

  const meshes = [];
  const placeTop = {};
  for (const [id, list] of Object.entries(placeBuildings)) {
    const mesh = new MeshBuilder();
    for (const b of list) addBuilding(mesh, b, ["2.2", "1.3", "1.2"]);
    meshes.push({ name: `place-${id}`, mesh });
    placeTop[id] = topOf(mesh);
  }
  if (!placeBuildings.flux) {
    const mesh = new MeshBuilder();
    const ring = FLUX_FOOTPRINT.map(([lat, lon]) => sceneFromLatLon(lat, lon));
    extrudeFootprint(mesh, simplifyLine(ring, 0.5), FLUX_HEIGHT);
    meshes.push({ name: "place-flux", mesh });
    placeTop.flux = topOf(mesh);
    placeBuildings.flux = [{ main: ring, footprints: [ring] }];
  }
  const context = new MeshBuilder();
  const contextCampus = new MeshBuilder();
  let detailed = 0;
  for (const b of buildings) {
    if (taken.has(b.id)) continue;
    const campus = onCampus(b.centroid);
    if (campus) detailed++;
    addBuilding(
      campus ? contextCampus : context,
      b,
      campus ? ["2.2", "1.3", "1.2"] : ["1.2", "1.3", "2.2"],
    );
  }
  meshes.push({ name: "context", mesh: context });
  meshes.push({ name: "context-campus", mesh: contextCampus });
  console.log(
    `  context: ${detailed} campus buildings at LoD 2.2, the rest LoD 1.2`,
  );

  const ground = buildGround(osm, box);
  for (const layer of ["water", "green", "roads", "paths"]) {
    meshes.push({ name: `ground-${layer}`, mesh: ground[layer] });
  }

  await fs.mkdir(path.dirname(OUT_GLB), { recursive: true });
  await writeGlb(meshes, OUT_GLB);
  const glbSize = (await fs.stat(OUT_GLB)).size;
  const triangles = Object.fromEntries(
    meshes.map((m) => [m.name, m.mesh.triangleCount]),
  );

  /* ---------- places ---------- */
  const graph = buildGraph(osm);
  const entranceOf = {};
  const tram = byId.get(`relation/${TRAM_19_RELATION}`);
  const stopsByName = new Map();
  for (const rel of osm.filter(
    (el) => el.tags?.route === "tram" && el.tags?.ref === "19",
  )) {
    for (const m of rel.members ?? []) {
      if (m.type !== "node" || !m.role.startsWith("stop")) continue;
      const name = byId.get(`node/${m.ref}`)?.tags?.name;
      if (!TRAM_19_CAMPUS_STOPS.includes(name)) continue;
      if (!stopsByName.has(name)) stopsByName.set(name, []);
      stopsByName.get(name).push([m.lat, m.lon]);
    }
  }
  const tramStops = TRAM_19_CAMPUS_STOPS.filter((name) =>
    stopsByName.has(name),
  ).map((name) => {
    const list = stopsByName.get(name);
    const lat = list.reduce((a, p) => a + p[0], 0) / list.length;
    const lon = list.reduce((a, p) => a + p[1], 0) / list.length;
    return { name, lat, lon, point: sceneFromLatLon(lat, lon) };
  });
  const stopNodes = tramStops.map((st) => ({
    ...st,
    node: nearestNode(graph, st.point),
  }));

  function routeTo(targetNode, endPoint) {
    const { d, prev } = shortestFrom(graph, targetNode);
    let best = null;
    for (const st of stopNodes) {
      const total =
        (d.get(st.node) ?? Infinity) + dist(st.point, graph.pos.get(st.node));
      if (!best || total < best.total) best = { ...st, total };
    }
    if (!best || !Number.isFinite(best.total)) return [];
    const nodes = pathTo(prev, best.node);
    const line = [best.point, ...nodes.map((id) => graph.pos.get(id))];
    if (endPoint) line.push(endPoint);
    return simplifyLine(line, 1.5).map(pt);
  }

  const geoPlaces = {};
  const routes = {};
  const empty = {
    markers: [],
    area: null,
    offscene: null,
    meshes: [],
    height: 0,
  };
  const anchorOf = {};

  for (const id of PLACE_IDS) {
    const rule = PLACES[id];
    let place;
    if (rule.building) {
      const list = placeBuildings[id];
      const biggest = list.reduce((a, b) =>
        Math.abs(ringArea(a.main)) > Math.abs(ringArea(b.main)) ? a : b,
      );
      const { anchor, height } = placeTop[id];
      place = { ...empty, anchor, height, meshes: [`place-${id}`] };
      const target = nearestNodeToRing(graph, biggest.main);
      entranceOf[id] = target;
      routes[id] = routeTo(target);
    } else if (rule.areaWay) {
      const el = byId.get(`way/${rule.areaWay}`);
      const ring = areaPolygons(el)[0].outer;
      const anchor = interiorPoint(ring);
      place = { ...empty, anchor, area: simplifyLine(ring, 1).map(pt) };
      const target =
        nearestNode(graph, anchor, (_, q) => pointInRing(q, ring)) ??
        nearestNodeToRing(graph, ring);
      entranceOf[id] = target;
      routes[id] = routeTo(target);
    } else if (rule.stationNode) {
      const el = byId.get(`node/${rule.stationNode}`);
      const real = sceneFromLatLon(el.lat, el.lon);
      const bearing =
        ((Math.atan2(real[0], -real[1]) * 180) / Math.PI + 360) % 360;
      place = {
        ...empty,
        anchor: real,
        offscene: {
          bearing: Math.round(bearing),
          distance: Math.round(Math.hypot(...real)),
        },
        lat: el.lat,
        lon: el.lon,
      };
    } else if (rule.tramStops) {
      const central = tramStops.reduce((a, b) =>
        Math.hypot(...a.point) < Math.hypot(...b.point) ? a : b,
      );
      place = {
        ...empty,
        anchor: central.point,
        markers: tramStops.map((st) => ({
          name: st.name,
          point: pt(st.point),
        })),
        lat: central.lat,
        lon: central.lon,
      };
    } else if (rule.node) {
      const el = byId.get(`node/${rule.node}`);
      const p = sceneFromLatLon(el.lat, el.lon);
      const host = buildings.find((b) =>
        b.footprints.some((r) => pointInRing(p, r)),
      );
      place = {
        ...empty,
        anchor: p,
        height: host
          ? (host.roofMax ?? host.roof ?? host.ground) - host.ground
          : 0,
        lat: el.lat,
        lon: el.lon,
      };
      routes[id] = routeTo(
        host ? nearestNodeToRing(graph, host.main) : nearestNode(graph, p),
        p,
      );
    }
    if (place) {
      geoPlaces[id] = place;
      anchorOf[id] = place.anchor;
    }
  }

  // Bike parking near the Library and the Aula.
  const bikeAll = osm
    .filter((el) => el.tags?.amenity === "bicycle_parking")
    .map((el) => elementPoint(el))
    .filter((p) => p && inBox(p) && onCampus(p));
  {
    const rule = PLACES["bike-parking"];
    const near = bikeAll.filter((p) =>
      rule.bikeNear.some((id) => dist(p, anchorOf[id]) < rule.radius),
    );
    const markers = cluster(near, 35).map((c) => {
      const id = rule.bikeNear.reduce((a, b) =>
        dist(c, anchorOf[a]) <= dist(c, anchorOf[b]) ? a : b,
      );
      const side = compass(anchorOf[id], c);
      return {
        name: side ? `${geoName(id)}, ${side} side` : geoName(id),
        point: pt(c),
      };
    });
    const names = new Map();
    for (const m of markers) names.set(m.name, (names.get(m.name) ?? 0) + 1);
    const counts = new Map();
    for (const m of markers) {
      if (names.get(m.name) < 2) continue;
      counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
      m.name = `${m.name} ${counts.get(m.name)}`;
    }
    const anchor = markers.length
      ? [
          markers.reduce((s2, m) => s2 + m.point[0], 0) / markers.length,
          markers.reduce((s2, m) => s2 + m.point[1], 0) / markers.length,
        ]
      : anchorOf.library;
    geoPlaces["bike-parking"] = { ...empty, anchor, markers };
  }

  // Canteens and cafés on campus.
  {
    const seen = [];
    for (const el of osm) {
      const t = el.tags ?? {};
      if (!["cafe", "restaurant", "fast_food"].includes(t.amenity) || !t.name)
        continue;
      const p = elementPoint(el);
      if (!p || !inBox(p) || !onCampus(p)) continue;
      if (seen.some((m) => m.name === t.name && dist(m.point, p) < 15))
        continue;
      seen.push({ name: t.name, point: pt(p) });
    }
    const buildingPlaces = Object.keys(placeBuildings);
    const dupes = new Set(
      seen
        .filter((m, i) => seen.findIndex((o) => o.name === m.name) !== i)
        .map((m) => m.name),
    );
    for (const m of seen) {
      if (!dupes.has(m.name)) continue;
      const nearest = buildingPlaces.reduce((a, b) =>
        dist(m.point, anchorOf[a]) <= dist(m.point, anchorOf[b]) ? a : b,
      );
      m.name =
        dist(m.point, anchorOf[nearest]) < 120
          ? `${m.name}, ${SHORT[nearest]}`
          : `${m.name}, ${compassName(m.point)}`;
    }
    seen.sort((a, b) => a.name.localeCompare(b.name));
    const aula = seen.find((m) => /aula/i.test(m.name)) ?? seen[0];
    geoPlaces.food = { ...empty, anchor: aula.point, markers: seen };
  }

  // lat/lon from the anchor where no OSM point was used.
  for (const p of Object.values(geoPlaces)) {
    if (p.lat == null)
      Object.assign(p, latLonFromScene(p.anchor[0], p.anchor[1]));
    p.lat = Number(p.lat.toFixed(6));
    p.lon = Number(p.lon.toFixed(6));
    p.anchor = pt(p.anchor);
    p.height = round1(p.height);
  }

  // Delft Centraal sits outside the scene: put its anchor on the bounds edge.
  const inScene = Object.entries(geoPlaces)
    .filter(([id]) => id !== "delft-centraal")
    .flatMap(([, p]) => [
      p.anchor,
      ...p.markers.map((m) => m.point),
      ...(p.area ?? []),
    ])
    .concat(
      CAMPUS_OUTLINE.map(([lat, lon]) => sceneFromLatLon(lat, lon)).filter(
        inBox,
      ),
    );
  const margin = 220;
  const bounds = {
    min: pt([
      Math.max(box[0], Math.min(...inScene.map((p) => p[0])) - margin),
      Math.max(box[1], Math.min(...inScene.map((p) => p[1])) - margin),
    ]),
    max: pt([
      Math.min(box[2], Math.max(...inScene.map((p) => p[0])) + margin),
      Math.min(box[3], Math.max(...inScene.map((p) => p[1])) + margin),
    ]),
  };
  {
    const dc = geoPlaces["delft-centraal"];
    const [x, z] = dc.anchor;
    const tx = x < 0 ? (bounds.min[0] + 40) / x : (bounds.max[0] - 40) / x;
    const tz = z < 0 ? (bounds.min[1] + 40) / z : (bounds.max[1] - 40) / z;
    const t = Math.min(tx, tz, 1);
    dc.anchor = pt([x * t, z * t]);
  }

  const tramLine = [];
  for (const m of tram?.members ?? []) {
    if (m.type !== "way" || m.role !== "" || !m.geometry) continue;
    const line = m.geometry.map((g) => sceneFromLatLon(g.lat, g.lon));
    for (const run of clipLine(line, box, 0))
      tramLine.push(simplifyLine(run, 1).map(pt));
  }

  const trees = osm
    .filter((el) => el.type === "node" && el.tags?.natural === "tree")
    .map((el) => sceneFromLatLon(el.lat, el.lon))
    .filter(inBox)
    .sort((a, b) => Math.hypot(...a) - Math.hypot(...b))
    .slice(0, 3000)
    .map(pt);

  const ordered = Object.fromEntries(
    PLACE_IDS.map((id) => {
      const p = geoPlaces[id];
      return [
        id,
        {
          lat: p.lat,
          lon: p.lon,
          anchor: p.anchor,
          height: p.height,
          meshes: p.meshes,
          markers: p.markers,
          area: p.area,
          offscene: p.offscene,
        },
      ];
    }),
  );

  const geo = {
    origin: ORIGIN,
    bounds,
    campus: simplifyLine(
      CAMPUS_OUTLINE.map(([lat, lon]) => sceneFromLatLon(lat, lon)),
      1,
    ).map(pt),
    places: ordered,
    routes: Object.fromEntries(
      Object.entries(routes).filter(([, r]) => r.length > 1),
    ),
    tramLine,
    trees,
    bikeParking: bikeAll.map(pt),
    attribution: ["3DBAG (CC BY 4.0)", "© OpenStreetMap contributors"],
  };
  await writePaths(graph, entranceOf);
  await fs.writeFile(
    OUT_GEO,
    await prettier.format(JSON.stringify(geo), { parser: "json" }),
  );

  const fetched = (
    await fs.stat(
      path.join(path.dirname(OUT_GEO), "../scripts/.cache/osm.json"),
    )
  ).mtime
    .toISOString()
    .slice(0, 10);
  await fs.writeFile(
    OUT_SOURCE,
    await prettier.format(sourceNote({ fetched, glbSize, triangles, bounds }), {
      parser: "markdown",
    }),
  );

  console.log(`GLB ${(glbSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(triangles);
  console.log(
    `bounds ${JSON.stringify(bounds)}, ${trees.length} trees, ${geo.bikeParking.length} bike parking`,
  );
}

/**
 * The walking network for directions in the app: node positions, links between
 * them and the node at each place's door. Loaded only when someone asks for
 * directions, so it stays out of the page bundle.
 */
async function writePaths(graph, entranceOf) {
  const index = new Map();
  const nodes = [];
  for (const [id, p] of graph.pos) {
    index.set(id, index.size);
    nodes.push(round1(p[0]), round1(p[1]));
  }
  const edges = [];
  for (const [a, list] of graph.adj) {
    for (const [b] of list) {
      if (index.get(a) < index.get(b)) edges.push(index.get(a), index.get(b));
    }
  }
  const places = Object.fromEntries(
    Object.entries(entranceOf)
      .filter(([, node]) => index.has(node))
      .map(([id, node]) => [id, index.get(node)]),
  );
  await fs.writeFile(OUT_PATHS, JSON.stringify({ nodes, edges, places }));
  console.log(
    `paths.json: ${nodes.length / 2} nodes, ${edges.length / 2} links, ${((await fs.stat(OUT_PATHS)).size / 1024).toFixed(0)} KB`,
  );
}

const SHORT = {
  library: "Library",
  aula: "Aula",
  pulse: "Pulse",
  echo: "Echo",
  eemcs: "EEMCS",
  flux: "Flux",
  "bk-city": "BK City",
  x: "X",
  "science-centre": "Science Centre",
};

function geoName(id) {
  return SHORT[id] ?? id;
}

function compassName(p) {
  return `${compass([0, 0], p) ?? "central"} campus`;
}

/** Label point and height: the middle of the highest part of a mesh. */
function topOf(mesh) {
  let maxY = 0;
  for (let i = 1; i < mesh.positions.length; i += 3)
    maxY = Math.max(maxY, mesh.positions[i]);
  let sx = 0;
  let sz = 0;
  let n = 0;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    if (mesh.positions[i + 1] < maxY * 0.9) continue;
    sx += mesh.positions[i];
    sz += mesh.positions[i + 2];
    n++;
  }
  return { anchor: [sx / n, sz / n], height: maxY };
}

function sourceNote({ fetched, glbSize, triangles, bounds }) {
  const total = Object.values(triangles).reduce((a, b) => a + b, 0);
  return `# Campus model

Generated by \`pnpm build:campus\` (\`scripts/build-campus.mjs\`). Don't edit by hand.

- **Fetched:** ${fetched}
- **Box (WGS84 south, west, north, east):** ${BBOX.join(", ")}
- **Scene origin:** ${ORIGIN.lat}, ${ORIGIN.lon} (metres, x east, z south, y up)
- **Camera bounds:** ${JSON.stringify(bounds)}
- **campus.glb:** ${(glbSize / 1024 / 1024).toFixed(2)} MB, ${total.toLocaleString("en")} triangles, quantized and meshopt-compressed

## Sources

- **Buildings:** [3DBAG](https://3dbag.nl) by the 3D geoinformation group at TU Delft, via api.3dbag.nl. Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). LoD 2.2 on campus, LoD 1.2 around it.
- **Ground, paths, trees, tram 19, bike parking, cafés, places:** [OpenStreetMap](https://www.openstreetmap.org/copyright) via Overpass. Licence: [ODbL](https://opendatacommons.org/licenses/odbl/). © OpenStreetMap contributors.

Both need a visible credit: the map corner shows "3DBAG (CC BY 4.0) · © OpenStreetMap contributors".

## Regenerate

\`\`\`bash
pnpm build:campus            # uses scripts/.cache when present
rm -rf scripts/.cache && pnpm build:campus   # fresh download
\`\`\`

Node names in the GLB: \`place-<PlaceId>\` per POI building, \`context-campus\` for other buildings inside the TU Delft campus outline, \`context\` for the city around it, \`ground-water\`, \`ground-green\`, \`ground-roads\`, \`ground-paths\`. Geometry is quantized, so each node carries a transform: keep the node's position and scale when reusing its geometry.
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
