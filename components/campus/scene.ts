import * as THREE from "three";
import type { PlaceId, ScenePoint } from "@/data/types";
import { campusGeo } from "@/lib/geo";
import type { Level } from "@/lib/occupancy";

export const SCENE_COLORS = {
  background: "#eceee9",
  water: "#c6dde6",
  green: "#d3e0c6",
  roads: "#fbfbf9",
  paths: "#f2f0e8",
  context: "#e4e6e4",
  campusGround: "#e1ebec",
  campusOutline: "#00759a",
  campusBuilding: "#cfe6ef",
  place: "#ffffff",
  dimmed: "#dde9ee",
  selected: "#00a6d6",
  tree: "#b4cc9f",
  route: "#00759a",
  you: "#1a73e8",
  tram: "#8ea2b5",
};

export const LEVEL_TINT: Record<Level, string> = {
  quiet: "#8dda8c",
  busy: "#ffba52",
  full: "#c95555",
};

const white = new THREE.Color("#ffffff");

export function tint(level: Level): THREE.Color {
  return white.clone().lerp(new THREE.Color(LEVEL_TINT[level]), 0.6);
}

export function toVector(point: ScenePoint, y = 0): THREE.Vector3 {
  return new THREE.Vector3(point[0], y, point[1]);
}

const nodeToPlace = new Map<string, PlaceId>(
  Object.entries(campusGeo.places).flatMap(([id, geo]) =>
    geo.meshes.map((mesh) => [mesh, id as PlaceId] as const),
  ),
);

export function placeIdOfNode(name: string): PlaceId | null {
  return nodeToPlace.get(name) ?? null;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fades the whole scene into the background towards the edge of the model,
 * so the map has no hard square border. Swaps three.js's fog chunks once:
 * every material with `fog` gets it, lines and instanced meshes included.
 */
let fadeInstalled = false;
export function installEdgeFade() {
  if (fadeInstalled) return;
  fadeInstalled = true;
  const { min, max } = campusGeo.bounds;
  const cx = ((min[0] + max[0]) / 2).toFixed(1);
  const cz = ((min[1] + max[1]) / 2).toFixed(1);
  const hx = ((max[0] - min[0]) / 2).toFixed(1);
  const hz = ((max[1] - min[1]) / 2).toFixed(1);
  const chunks = THREE.ShaderChunk as Record<string, string>;
  chunks.fog_pars_vertex = `#ifdef USE_FOG
  varying float vFogDepth;
  varying vec2 vFogWorld;
#endif`;
  chunks.fog_vertex = `#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = (inverse(viewMatrix) * mvPosition).xz;
#endif`;
  chunks.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec2 vFogWorld;
  uniform float fogNear;
  uniform float fogFar;
#endif`;
  chunks.fog_fragment = `#ifdef USE_FOG
  vec2 fogEdge = (vFogWorld - vec2(${cx}, ${cz})) / vec2(${hx}, ${hz});
  float fogFactor = max(
    smoothstep(0.62, 0.97, length(fogEdge)),
    smoothstep(fogNear, fogFar, vFogDepth)
  );
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif`;
}
