import proj4 from "proj4";
import { ORIGIN } from "./config.mjs";

proj4.defs(
  "EPSG:28992",
  "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs",
);

const toRd = proj4("EPSG:4326", "EPSG:28992");

/** WGS84 to Dutch RD metres: [east, north]. */
export function rdFromLatLon(lat, lon) {
  return toRd.forward([lon, lat]);
}

/** WGS84 back from RD. */
export function latLonFromRd(east, north) {
  const [lon, lat] = toRd.inverse([east, north]);
  return { lat, lon };
}

const [OX, OY] = rdFromLatLon(ORIGIN.lat, ORIGIN.lon).map(Math.round);
export const ORIGIN_RD = [OX, OY];

/** RD to scene: x east, z south. */
export function sceneFromRd(east, north) {
  return [east - OX, -(north - OY)];
}

export function sceneFromLatLon(lat, lon) {
  const [e, n] = rdFromLatLon(lat, lon);
  return sceneFromRd(e, n);
}

export function latLonFromScene(x, z) {
  return latLonFromRd(x + OX, -z + OY);
}

export const round1 = (v) => Math.round(v * 10) / 10;

export function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return a / 2;
}

/** Area-weighted centroid of a simple ring. */
export function ringCentroid(ring) {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
    a += f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = ring.length;
    return [
      ring.reduce((s, p) => s + p[0], 0) / n,
      ring.reduce((s, p) => s + p[1], 0) / n,
    ];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/** Closest point on segment ab to p. */
export function closestOnSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2),
        );
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Douglas-Peucker on a polyline of [x, z]. */
export function simplifyLine(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = dist(
        points[i],
        closestOnSegment(points[i], points[s], points[e]),
      );
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > tolerance && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Sutherland-Hodgman clip of a ring to an axis-aligned box. */
export function clipRing(ring, [minX, minZ, maxX, maxZ]) {
  const edges = [
    (p) => p[0] >= minX,
    (p) => p[0] <= maxX,
    (p) => p[1] >= minZ,
    (p) => p[1] <= maxZ,
  ];
  const cut = [
    (a, b) => lerpAt(a, b, (minX - a[0]) / (b[0] - a[0])),
    (a, b) => lerpAt(a, b, (maxX - a[0]) / (b[0] - a[0])),
    (a, b) => lerpAt(a, b, (minZ - a[1]) / (b[1] - a[1])),
    (a, b) => lerpAt(a, b, (maxZ - a[1]) / (b[1] - a[1])),
  ];
  let out = ring;
  for (let k = 0; k < 4; k++) {
    const input = out;
    out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = edges[k](cur);
      const prevIn = edges[k](prev);
      if (curIn) {
        if (!prevIn) out.push(cut[k](prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(cut[k](prev, cur));
      }
    }
  }
  return out;
}

function lerpAt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Join OSM way segments (arrays of points with end node ids) into closed rings. */
export function stitchRings(segments) {
  const pending = segments.map((s) => ({ ...s, points: [...s.points] }));
  const rings = [];
  while (pending.length) {
    const cur = pending.shift();
    let guard = 0;
    while (cur.first !== cur.last && guard++ < 10000) {
      const i = pending.findIndex(
        (s) =>
          s.first === cur.last ||
          s.last === cur.last ||
          s.first === cur.first ||
          s.last === cur.first,
      );
      if (i === -1) break;
      const s = pending.splice(i, 1)[0];
      if (s.first === cur.last) {
        cur.points.push(...s.points.slice(1));
        cur.last = s.last;
      } else if (s.last === cur.last) {
        cur.points.push(...s.points.slice(0, -1).reverse());
        cur.last = s.first;
      } else if (s.last === cur.first) {
        cur.points.unshift(...s.points.slice(0, -1));
        cur.first = s.first;
      } else {
        cur.points.unshift(...s.points.slice(1).reverse());
        cur.first = s.last;
      }
    }
    if (cur.first === cur.last && cur.points.length >= 4) {
      rings.push(cur.points.slice(0, -1));
    }
  }
  return rings;
}
