import type { PlaceId, ScenePoint } from "@/data/types";

/** The campus walking network that `pnpm build:campus` writes to public/campus/paths.json. */
interface PathsFile {
  nodes: number[];
  edges: number[];
  places: Partial<Record<PlaceId, number>>;
}

interface Network {
  x: Float32Array;
  z: Float32Array;
  start: Int32Array;
  next: Int32Array;
  weight: Float32Array;
  places: Partial<Record<PlaceId, number>>;
}

export interface WalkRoute {
  points: ScenePoint[];
  metres: number;
}

let loading: Promise<Network | null> | null = null;

/** Fetch the network once. `null` when the model was built before it existed. */
export function loadNetwork(): Promise<Network | null> {
  loading ??= fetch("/campus/paths.json")
    .then((res) => (res.ok ? (res.json() as Promise<PathsFile>) : null))
    .then((file) => (file ? toNetwork(file) : null))
    .catch(() => null);
  return loading;
}

function toNetwork(file: PathsFile): Network {
  const count = file.nodes.length / 2;
  const x = new Float32Array(count);
  const z = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    x[i] = file.nodes[i * 2];
    z[i] = file.nodes[i * 2 + 1];
  }
  const degree = new Int32Array(count + 1);
  for (const node of file.edges) degree[node + 1]++;
  const start = new Int32Array(count + 1);
  for (let i = 0; i < count; i++) start[i + 1] = start[i] + degree[i + 1];
  const fill = start.slice(0, count);
  const next = new Int32Array(file.edges.length);
  const weight = new Float32Array(file.edges.length);
  for (let e = 0; e < file.edges.length; e += 2) {
    const a = file.edges[e];
    const b = file.edges[e + 1];
    const w = Math.hypot(x[a] - x[b], z[a] - z[b]);
    next[fill[a]] = b;
    weight[fill[a]++] = w;
    next[fill[b]] = a;
    weight[fill[b]++] = w;
  }
  return { x, z, start, next, weight, places: file.places };
}

function nearest(net: Network, [px, pz]: ScenePoint): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < net.x.length; i++) {
    const d = (net.x[i] - px) ** 2 + (net.z[i] - pz) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Shortest walk along paths from a scene point to a place's door. */
export function walkTo(
  net: Network,
  from: ScenePoint,
  target: PlaceId,
  goal: ScenePoint,
): WalkRoute | null {
  const end = net.places[target];
  if (end === undefined) return null;
  const begin = nearest(net, from);
  const dist = new Float64Array(net.x.length).fill(Infinity);
  const prev = new Int32Array(net.x.length).fill(-1);
  const heap: [number, number][] = [[0, begin]];
  dist[begin] = 0;
  while (heap.length) {
    const [d, u] = pop(heap);
    if (u === end) break;
    if (d > dist[u]) continue;
    for (let k = net.start[u]; k < net.start[u + 1]; k++) {
      const v = net.next[k];
      const nd = d + net.weight[k];
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        push(heap, [nd, v]);
      }
    }
  }
  if (!Number.isFinite(dist[end])) return null;
  const nodes: ScenePoint[] = [];
  for (let n = end; n !== -1; n = prev[n]) nodes.push([net.x[n], net.z[n]]);
  nodes.reverse();
  const door = nodes.at(-1)!;
  const points: ScenePoint[] =
    Math.hypot(door[0] - goal[0], door[1] - goal[1]) > 60
      ? [from, ...nodes, goal]
      : [from, ...nodes];
  let metres = 0;
  for (let i = 1; i < points.length; i++) {
    metres += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  }
  return { points, metres };
}

function push(heap: [number, number][], item: [number, number]) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p][0] <= heap[i][0]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function pop(heap: [number, number][]): [number, number] {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
      if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
      if (m === i) break;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  }
  return top;
}
