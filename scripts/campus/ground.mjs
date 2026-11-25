import earcut from "earcut";
import { MeshBuilder } from "./buildings.mjs";
import { clipRing, ringArea, sceneFromLatLon, stitchRings } from "./geo.mjs";

const UP = [0, 1, 0];

const GREEN_LANDUSE = new Set([
  "grass",
  "meadow",
  "recreation_ground",
  "forest",
  "village_green",
  "flowerbed",
  "allotments",
  "cemetery",
  "plant_nursery",
]);
const GREEN_LEISURE = new Set([
  "park",
  "garden",
  "pitch",
  "playground",
  "common",
  "nature_reserve",
  "track",
]);
const GREEN_NATURAL = new Set(["wood", "scrub", "grassland", "wetland"]);

export const ROAD_WIDTH = {
  motorway: 14,
  trunk: 12,
  primary: 10,
  secondary: 9,
  tertiary: 7.5,
  unclassified: 5.5,
  residential: 5.5,
  living_street: 5,
  busway: 6,
  service: 3.5,
};
export const PATH_WIDTH = {
  pedestrian: 4,
  cycleway: 2.6,
  footway: 1.8,
  path: 1.6,
  steps: 2,
  track: 2.6,
  bridleway: 2,
};
const WATERWAY_WIDTH = {
  river: 18,
  canal: 10,
  stream: 3,
  ditch: 2.5,
  drain: 2,
};

export function areaLayer(tags) {
  if (
    tags.natural === "water" ||
    tags.water ||
    tags.landuse === "basin" ||
    tags.landuse === "reservoir" ||
    tags.waterway === "riverbank"
  ) {
    return "water";
  }
  if (
    GREEN_LANDUSE.has(tags.landuse) ||
    GREEN_LEISURE.has(tags.leisure) ||
    GREEN_NATURAL.has(tags.natural)
  ) {
    return "green";
  }
  if (tags.highway === "pedestrian" && tags.area === "yes") return "paths";
  return null;
}

function walkable(tags) {
  return !(tags.tunnel && tags.tunnel !== "no") && tags.indoor !== "yes";
}

/** OSM area elements as rings of scene points: { outer, holes }[]. */
export function areaPolygons(e) {
  const toScene = (g) => g.map((p) => sceneFromLatLon(p.lat, p.lon));
  if (e.type === "way" && e.geometry && e.nodes?.[0] === e.nodes?.at(-1)) {
    return [{ outer: toScene(e.geometry).slice(0, -1), holes: [] }];
  }
  if (e.type === "relation" && e.members) {
    const seg = (role) =>
      e.members
        .filter((m) => m.type === "way" && m.role === role && m.geometry)
        .map((m) => ({
          points: toScene(m.geometry),
          first: `${m.geometry[0].lat},${m.geometry[0].lon}`,
          last: `${m.geometry.at(-1).lat},${m.geometry.at(-1).lon}`,
        }));
    const outers = stitchRings(seg("outer"));
    const inners = stitchRings(seg("inner"));
    return outers.map((outer) => ({ outer, holes: inners }));
  }
  return [];
}

function addFlatPolygon(mesh, outer, holes, y, box) {
  const o = clipRing(outer, box);
  if (o.length < 3 || Math.abs(ringArea(o)) < 0.5) return;
  const hs = holes
    .map((h) => clipRing(h, box))
    .filter((h) => h.length >= 3 && Math.abs(ringArea(h)) >= 0.5);
  const flat = [];
  const holeIdx = [];
  const pts = [];
  for (const [r, ring] of [o, ...hs].entries()) {
    if (r > 0) holeIdx.push(pts.length);
    for (const p of ring) {
      pts.push(p);
      flat.push(p[0], p[1]);
    }
  }
  const tris = earcut(flat, holeIdx, 2);
  const base = mesh.vertexCount;
  for (const p of pts) {
    mesh.positions.push(p[0], y, p[1]);
    mesh.normals.push(...UP);
  }
  for (let i = 0; i < tris.length; i += 3) {
    pushUpTri(mesh, pts, base, tris[i], tris[i + 1], tris[i + 2]);
  }
}

function pushUpTri(mesh, pts, base, a, b, c) {
  const [ax, az] = pts[a];
  const [bx, bz] = pts[b];
  const [cx, cz] = pts[c];
  const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
  if (ny < 0) mesh.indices.push(base + a, base + c, base + b);
  else mesh.indices.push(base + a, base + b, base + c);
}

/** A flat ribbon along a polyline, mitred joins. */
export function addRibbon(mesh, line, width, y) {
  if (line.length < 2) return;
  const half = width / 2;
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const prev = line[Math.max(0, i - 1)];
    const next = line[Math.min(line.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    let nx = -dz;
    let nz = dx;
    let scale = 1;
    if (i > 0 && i < line.length - 1) {
      const ax = line[i][0] - prev[0];
      const az = line[i][1] - prev[1];
      const al = Math.hypot(ax, az) || 1;
      const cos = (-az / al) * nx + (ax / al) * nz;
      scale = Math.min(1 / Math.max(cos, 0.35), 2.5);
    }
    nx *= half * scale;
    nz *= half * scale;
    left.push([line[i][0] + nx, line[i][1] + nz]);
    right.push([line[i][0] - nx, line[i][1] - nz]);
  }
  const base = mesh.vertexCount;
  const pts = [];
  for (let i = 0; i < line.length; i++) {
    pts.push(left[i], right[i]);
    mesh.positions.push(left[i][0], y, left[i][1], right[i][0], y, right[i][1]);
    mesh.normals.push(...UP, ...UP);
  }
  for (let i = 0; i < line.length - 1; i++) {
    const a = 2 * i;
    pushUpTri(mesh, pts, base, a, a + 1, a + 2);
    pushUpTri(mesh, pts, base, a + 1, a + 3, a + 2);
  }
}

function insideBox(p, [minX, minZ, maxX, maxZ], margin = 0) {
  return (
    p[0] >= minX - margin &&
    p[0] <= maxX + margin &&
    p[1] >= minZ - margin &&
    p[1] <= maxZ + margin
  );
}

/** Split a polyline into runs that stay inside the box. */
export function clipLine(line, box, margin = 20) {
  const runs = [];
  let cur = [];
  for (const p of line) {
    if (insideBox(p, box, margin)) cur.push(p);
    else {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
}

/** The four flat ground layers. */
export function buildGround(osm, box) {
  const layers = {
    water: new MeshBuilder(),
    green: new MeshBuilder(),
    roads: new MeshBuilder(),
    paths: new MeshBuilder(),
  };
  const Y = { water: 0.02, green: 0.04, roads: 0.06, paths: 0.08 };

  for (const e of osm) {
    const tags = e.tags ?? {};
    const layer = areaLayer(tags);
    if (!layer) continue;
    if (e.type === "relation" && tags.type !== "multipolygon") continue;
    for (const { outer, holes } of areaPolygons(e)) {
      addFlatPolygon(layers[layer], outer, holes, Y[layer], box);
    }
  }

  for (const e of osm) {
    if (e.type !== "way" || !e.geometry) continue;
    const tags = e.tags ?? {};
    if (tags.area === "yes" || !walkable(tags)) continue;
    let layer = null;
    let width = 0;
    if (ROAD_WIDTH[tags.highway]) {
      layer = "roads";
      width = ROAD_WIDTH[tags.highway];
    } else if (PATH_WIDTH[tags.highway]) {
      layer = "paths";
      width = PATH_WIDTH[tags.highway];
    } else if (WATERWAY_WIDTH[tags.waterway]) {
      layer = "water";
      width = WATERWAY_WIDTH[tags.waterway];
    }
    if (!layer) continue;
    const line = e.geometry.map((p) => sceneFromLatLon(p.lat, p.lon));
    for (const run of clipLine(line, box)) {
      addRibbon(layers[layer], run, width, Y[layer]);
    }
  }
  return layers;
}
