/**
 * Updates an existing campus.glb and campus-geo.json without downloading:
 * splits the `context` buildings into `context-campus` (inside the TU Delft
 * campus outline) and `context` (the city around it), takes Flux out as
 * `place-flux`, and writes the campus outline into campus-geo.json.
 *
 * `pnpm build:campus` does the same from fresh 3DBAG and OSM data; use this
 * only when you can't reach those services. Safe to run twice.
 */
import fs from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dequantize } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import * as prettier from "prettier";
import { MeshBuilder, extrudeFootprint } from "./buildings.mjs";
import { CAMPUS_OUTLINE, FLUX_FOOTPRINT, FLUX_HEIGHT } from "./campus-area.mjs";
import { OUT_GEO, OUT_GLB } from "./config.mjs";
import { writeGlb } from "./glb.mjs";
import {
  dist,
  latLonFromScene,
  pointInRing,
  round1,
  sceneFromLatLon,
  simplifyLine,
} from "./geo.mjs";

const toScene = (ring) => ring.map(([lat, lon]) => sceneFromLatLon(lat, lon));
const campusRing = toScene(CAMPUS_OUTLINE);
const fluxRing = toScene(FLUX_FOOTPRINT);
const pt = (p) => [round1(p[0]), round1(p[1])];

/** Plain arrays from a node's (dequantized) primitive, in scene metres. */
function readMesh(node) {
  const prim = node.getMesh().listPrimitives()[0];
  const matrix = node.getWorldMatrix();
  const pos = prim.getAttribute("POSITION");
  const nor = prim.getAttribute("NORMAL");
  const positions = [];
  const normals = [];
  const v = [0, 0, 0];
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, v);
    positions.push(
      matrix[0] * v[0] + matrix[4] * v[1] + matrix[8] * v[2] + matrix[12],
      matrix[1] * v[0] + matrix[5] * v[1] + matrix[9] * v[2] + matrix[13],
      matrix[2] * v[0] + matrix[6] * v[1] + matrix[10] * v[2] + matrix[14],
    );
    nor.getElement(i, v);
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    normals.push(v[0] / len, v[1] / len, v[2] / len);
  }
  return {
    positions,
    normals,
    indices: Array.from(prim.getIndices().getArray()),
  };
}

/** Connected groups of triangles, one per building (or block of joined buildings). */
function components(mesh) {
  const parent = new Int32Array(mesh.positions.length / 3).map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const key = (i) =>
    `${Math.round(mesh.positions[i * 3] * 20)},${Math.round(mesh.positions[i * 3 + 1] * 20)},${Math.round(mesh.positions[i * 3 + 2] * 20)}`;
  const same = new Map();
  for (let i = 0; i < parent.length; i++) {
    const k = key(i);
    if (same.has(k)) parent[find(i)] = find(same.get(k));
    else same.set(k, i);
  }
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = mesh.indices.slice(t, t + 3).map(find);
    parent[b] = a;
    parent[find(c)] = a;
  }
  const groups = new Map();
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const root = find(mesh.indices[t]);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(t);
  }
  return [...groups.values()];
}

/** Footprint centre of a group: the mean of its vertices, in x and z. */
function centreOf(mesh, triangles) {
  let x = 0;
  let z = 0;
  let n = 0;
  for (const t of triangles)
    for (let k = 0; k < 3; k++) {
      const i = mesh.indices[t + k];
      x += mesh.positions[i * 3];
      z += mesh.positions[i * 3 + 2];
      n++;
    }
  return [x / n, z / n];
}

function subMesh(mesh, triangles) {
  const out = { positions: [], normals: [], indices: [] };
  const map = new Map();
  for (const t of triangles)
    for (let k = 0; k < 3; k++) {
      const i = mesh.indices[t + k];
      if (!map.has(i)) {
        map.set(i, out.positions.length / 3);
        out.positions.push(...mesh.positions.slice(i * 3, i * 3 + 3));
        out.normals.push(...mesh.normals.slice(i * 3, i * 3 + 3));
      }
      out.indices.push(map.get(i));
    }
  out.triangleCount = out.indices.length / 3;
  return out;
}

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

async function main() {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
  const doc = await io.read(OUT_GLB);
  await doc.transform(dequantize());
  const nodes = doc
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh());
  const meshes = nodes.map((node) => ({
    name: node.getName(),
    mesh: readMesh(node),
  }));

  const context = meshes.find((m) => m.name === "context");
  const already = meshes.some((m) => m.name === "context-campus");
  if (!context) throw new Error("No context mesh in campus.glb");

  const campus = [];
  const city = [];
  const flux = [];
  for (const group of components(context.mesh)) {
    const c = centreOf(context.mesh, group);
    if (pointInRing(c, fluxRing)) flux.push(...group);
    else if (!already && pointInRing(c, campusRing)) campus.push(...group);
    else city.push(...group);
  }

  const out = meshes.filter((m) => m.name !== "context");
  if (flux.length) {
    out.push({ name: "place-flux", mesh: subMesh(context.mesh, flux) });
  } else if (!out.some((m) => m.name === "place-flux")) {
    const block = new MeshBuilder();
    extrudeFootprint(block, simplifyLine(fluxRing, 0.5), FLUX_HEIGHT);
    out.push({ name: "place-flux", mesh: block });
  }
  out.push({ name: "context", mesh: subMesh(context.mesh, city) });
  if (campus.length)
    out.push({ name: "context-campus", mesh: subMesh(context.mesh, campus) });
  await writeGlb(out, OUT_GLB);

  const geo = JSON.parse(await fs.readFile(OUT_GEO, "utf8"));
  geo.campus = simplifyLine(campusRing, 1).map(pt);
  const fluxMesh = out.find((m) => m.name === "place-flux");
  if (fluxMesh) {
    const { anchor, height } = topOf(fluxMesh.mesh);
    const { lat, lon } = latLonFromScene(anchor[0], anchor[1]);
    geo.places.flux = {
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      anchor: pt(anchor),
      height: round1(height),
      meshes: ["place-flux"],
      markers: [],
      area: null,
      offscene: null,
    };
  }
  await fs.writeFile(
    OUT_GEO,
    await prettier.format(JSON.stringify(geo), { parser: "json" }),
  );
  console.log({
    campusTriangles: campus.length,
    cityTriangles: city.length,
    fluxTriangles: flux.length,
    fluxFromCentre: fluxMesh
      ? Math.round(dist(topOf(fluxMesh.mesh).anchor, [0, 0]))
      : null,
    size: (await fs.stat(OUT_GLB)).size,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
