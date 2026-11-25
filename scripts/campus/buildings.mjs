import earcut from "earcut";
import { ORIGIN_RD } from "./geo.mjs";

const [OX, OY] = ORIGIN_RD;

/** Growing vertex/index arrays for one output mesh. */
export class MeshBuilder {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.indices = [];
  }
  get vertexCount() {
    return this.positions.length / 3;
  }
  get triangleCount() {
    return this.indices.length / 3;
  }
  /** One planar polygon: rings of [x, y, z] scene points, a shared normal. */
  addPolygon(rings, normal) {
    const base = this.vertexCount;
    const flat = [];
    const holes = [];
    const pts = [];
    const [ax, ay] = dropAxes(normal);
    for (let r = 0; r < rings.length; r++) {
      if (r > 0) holes.push(pts.length);
      for (const p of rings[r]) {
        pts.push(p);
        flat.push(p[ax], p[ay]);
      }
    }
    const tris = earcut(flat, holes, 2);
    if (!tris.length) return;
    for (const p of pts) {
      this.positions.push(p[0], p[1], p[2]);
      this.normals.push(normal[0], normal[1], normal[2]);
    }
    for (let i = 0; i < tris.length; i += 3) {
      let [a, b, c] = [tris[i], tris[i + 1], tris[i + 2]];
      if (dot(triNormal(pts[a], pts[b], pts[c]), normal) < 0) [b, c] = [c, b];
      this.indices.push(base + a, base + b, base + c);
    }
  }
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function triNormal(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
}

/** Newell normal of a ring, normalised; null when degenerate. */
export function newell(ring) {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const len = Math.hypot(nx, ny, nz);
  return len < 1e-6 ? null : [nx / len, ny / len, nz / len];
}

/** The two axes to keep when projecting onto the plane most facing the normal. */
function dropAxes(n) {
  const ax = Math.abs(n[0]);
  const ay = Math.abs(n[1]);
  const az = Math.abs(n[2]);
  if (ax >= ay && ax >= az) return [1, 2];
  if (ay >= ax && ay >= az) return [0, 2];
  return [0, 1];
}

/**
 * A 3DBAG CityJSONFeature as a building: id, footprint in scene metres,
 * ground height, and its LoD solids.
 */
export function parseFeature(f) {
  const { scale, translate } = f.transform;
  const vertex = (i) => {
    const v = f.vertices[i];
    return [
      v[0] * scale[0] + translate[0],
      v[1] * scale[1] + translate[1],
      v[2] * scale[2] + translate[2],
    ];
  };
  const building = Object.entries(f.CityObjects).find(
    ([, o]) => o.type === "Building",
  );
  if (!building) return null;
  const [id, obj] = building;
  const attrs = obj.attributes ?? {};
  const footprints = [];
  for (const g of obj.geometry ?? []) {
    if (g.type !== "MultiSurface") continue;
    for (const surface of g.boundaries) {
      footprints.push(
        surface[0].map((i) => {
          const [e, n] = vertex(i);
          return [e - OX, -(n - OY)];
        }),
      );
    }
  }
  const solids = {};
  for (const childId of obj.children ?? []) {
    const part = f.CityObjects[childId];
    for (const g of part?.geometry ?? []) {
      if (g.type !== "Solid") continue;
      (solids[g.lod] ??= []).push(g.boundaries);
    }
  }
  let ground = attrs.b3_h_maaiveld;
  if (typeof ground !== "number") {
    ground = Math.min(...f.vertices.map((_, i) => vertex(i)[2]));
  }
  return {
    id,
    bag: id.replace("NL.IMBAG.Pand.", ""),
    footprints,
    ground,
    roof: attrs.b3_h_dak_70p ?? attrs.b3_h_dak_max ?? null,
    roofMax: attrs.b3_h_dak_max ?? null,
    vertex,
    solids,
  };
}

/** Add a building's solid at a level of detail to a mesh. Returns false if missing. */
export function addBuilding(mesh, b, lods) {
  const lod = lods.find((l) => b.solids[l]?.length);
  if (!lod) return false;
  for (const solid of b.solids[lod]) {
    for (const shell of solid) {
      for (const surface of shell) {
        const rings = surface.map((ring) =>
          ring.map((i) => {
            const [e, n, h] = b.vertex(i);
            return [e - OX, h - b.ground, -(n - OY)];
          }),
        );
        const normal = newell(rings[0]);
        if (!normal) continue;
        mesh.addPolygon(rings, normal);
      }
    }
  }
  return true;
}
