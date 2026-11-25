import { closestOnSegment, dist, sceneFromLatLon } from "./geo.mjs";

const WALKABLE = new Set([
  "footway",
  "path",
  "pedestrian",
  "cycleway",
  "service",
  "residential",
  "living_street",
  "steps",
  "track",
  "unclassified",
  "tertiary",
  "secondary",
  "primary",
]);

/** Walking graph from OSM ways: node positions and weighted neighbours. */
export function buildGraph(osm) {
  const pos = new Map();
  const adj = new Map();
  const link = (a, b, w) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push([b, w]);
  };
  for (const e of osm) {
    if (e.type !== "way" || !e.geometry || !e.nodes) continue;
    const t = e.tags ?? {};
    if (!WALKABLE.has(t.highway)) continue;
    if (t.foot === "no" || (t.access === "no" && t.foot !== "yes")) continue;
    if (t.tunnel && t.tunnel !== "no") continue;
    for (let i = 0; i < e.nodes.length; i++) {
      if (!pos.has(e.nodes[i])) {
        pos.set(
          e.nodes[i],
          sceneFromLatLon(e.geometry[i].lat, e.geometry[i].lon),
        );
      }
      if (i > 0) {
        const w = dist(pos.get(e.nodes[i - 1]), pos.get(e.nodes[i]));
        link(e.nodes[i - 1], e.nodes[i], w);
        link(e.nodes[i], e.nodes[i - 1], w);
      }
    }
  }
  return largestComponent({ pos, adj });
}

/** Drop islands of path that don't connect to the main network. */
function largestComponent(graph) {
  const seen = new Set();
  let best = [];
  for (const start of graph.pos.keys()) {
    if (seen.has(start)) continue;
    const comp = [start];
    seen.add(start);
    for (let i = 0; i < comp.length; i++) {
      for (const [v] of graph.adj.get(comp[i]) ?? []) {
        if (!seen.has(v)) {
          seen.add(v);
          comp.push(v);
        }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  const keep = new Set(best);
  for (const id of [...graph.pos.keys()]) {
    if (!keep.has(id)) {
      graph.pos.delete(id);
      graph.adj.delete(id);
    }
  }
  return graph;
}

export function nearestNode(graph, p, filter = () => true) {
  let best = null;
  let bestD = Infinity;
  for (const [id, q] of graph.pos) {
    if (!filter(id, q)) continue;
    const d = dist(p, q);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

/** Graph node closest to a footprint's edge. */
export function nearestNodeToRing(graph, ring) {
  let best = null;
  let bestD = Infinity;
  for (const [id, q] of graph.pos) {
    for (let i = 0; i < ring.length; i++) {
      const d = dist(
        q,
        closestOnSegment(q, ring[i], ring[(i + 1) % ring.length]),
      );
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
  }
  return best;
}

/** Dijkstra from one node: distances and predecessors. */
export function shortestFrom(graph, start) {
  const d = new Map([[start, 0]]);
  const prev = new Map();
  const heap = [[0, start]];
  const done = new Set();
  while (heap.length) {
    const [du, u] = popMin(heap);
    if (done.has(u)) continue;
    done.add(u);
    for (const [v, w] of graph.adj.get(u) ?? []) {
      const nd = du + w;
      if (nd < (d.get(v) ?? Infinity)) {
        d.set(v, nd);
        prev.set(v, u);
        pushHeap(heap, [nd, v]);
      }
    }
  }
  return { d, prev };
}

/** Nodes from `node` back to the Dijkstra start. */
export function pathTo(prev, node) {
  const out = [node];
  while (prev.has(out.at(-1))) out.push(prev.get(out.at(-1)));
  return out;
}

function pushHeap(h, item) {
  h.push(item);
  let i = h.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (h[p][0] <= h[i][0]) break;
    [h[p], h[i]] = [h[i], h[p]];
    i = p;
  }
}

function popMin(h) {
  const top = h[0];
  const last = h.pop();
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]];
      i = m;
    }
  }
  return top;
}
