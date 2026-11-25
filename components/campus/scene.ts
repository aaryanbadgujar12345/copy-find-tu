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
  context: "#dfe2e4",
  place: "#fbfbfa",
  dimmed: "#e3e5e7",
  selected: "#00a6d6",
  tree: "#b4cc9f",
  route: "#00759a",
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
