import { useSyncExternalStore } from "react";
import type { PlaceId, ScenePoint } from "@/data/types";
import { campusGeo, distance, geoOf } from "./geo";

export type NavStatus =
  "idle" | "locating" | "active" | "denied" | "unavailable";

export interface NavState {
  target: PlaceId | null;
  status: NavStatus;
  position: { lat: number; lon: number; accuracy: number } | null;
}

let state: NavState = { target: null, status: "idle", position: null };
let watchId: number | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<NavState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getNav(): NavState {
  return state;
}

export function useNav<T>(select: (nav: NavState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => select(state),
    () => select(state),
  );
}

/** Follow the device's location and guide it to a place. */
export function startNavigation(target: PlaceId) {
  stopWatching();
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    set({ target, status: "unavailable", position: null });
    return;
  }
  set({ target, status: state.position ? "active" : "locating" });
  watchId = navigator.geolocation.watchPosition(
    (p) =>
      set({
        status: "active",
        position: {
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          accuracy: p.coords.accuracy,
        },
      }),
    (error) => {
      stopWatching();
      set({
        status:
          error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
      });
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );
}

export function stopNavigation() {
  stopWatching();
  set({ target: null, status: "idle" });
}

function stopWatching() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

/** Metres a person walks per minute, about 5 km/h. */
const WALK_PER_MINUTE = 80;
/** Paths are longer than a straight line; this is a typical campus detour. */
const DETOUR = 1.3;

export interface Leg {
  metres: number;
  minutes: number;
  arrived: boolean;
}

export function legTo(
  from: { lat: number; lon: number },
  target: PlaceId,
): Leg {
  const metres = distance(from, geoOf(target));
  return {
    metres,
    minutes: Math.max(1, Math.round((metres * DETOUR) / WALK_PER_MINUTE)),
    arrived: metres < 30,
  };
}

export function directionsUrl(
  target: PlaceId,
  from?: { lat: number; lon: number } | null,
): string {
  const { lat, lon } = geoOf(target);
  const origin = from ? `&origin=${from.lat},${from.lon}` : "";
  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${lat},${lon}${origin}`;
}

/**
 * Lat/lon to scene metres. Fitted once from the places in campus-geo.json,
 * which carry both, so it matches the 3D model without shipping proj4.
 */
const toScene = (() => {
  const samples = Object.values(campusGeo.places).filter(
    (p) => !p.offscene && p.anchor,
  );
  const lat0 = campusGeo.origin.lat;
  const lon0 = campusGeo.origin.lon;
  const rows = samples.map((p) => [p.lat - lat0, p.lon - lon0, 1]);
  const solve = (values: number[]) => {
    const m = [0, 1, 2].map((i) =>
      [0, 1, 2].map((j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
    );
    const v = [0, 1, 2].map((i) =>
      rows.reduce((s, r, k) => s + r[i] * values[k], 0),
    );
    for (let c = 0; c < 3; c++) {
      for (let r = c + 1; r < 3; r++) {
        const f = m[r][c] / m[c][c];
        for (let k = c; k < 3; k++) m[r][k] -= f * m[c][k];
        v[r] -= f * v[c];
      }
    }
    const x = [0, 0, 0];
    for (let r = 2; r >= 0; r--) {
      let s = v[r];
      for (let k = r + 1; k < 3; k++) s -= m[r][k] * x[k];
      x[r] = s / m[r][r];
    }
    return x;
  };
  const ax = solve(samples.map((p) => p.anchor[0]));
  const az = solve(samples.map((p) => p.anchor[1]));
  return (lat: number, lon: number): ScenePoint => {
    const a = lat - lat0;
    const b = lon - lon0;
    return [ax[0] * a + ax[1] * b + ax[2], az[0] * a + az[1] * b + az[2]];
  };
})();

export function sceneOf(position: { lat: number; lon: number }): ScenePoint {
  return toScene(position.lat, position.lon);
}

/** Whether a scene point is inside the 3D model. */
export function inScene([x, z]: ScenePoint): boolean {
  const { min, max } = campusGeo.bounds;
  return x >= min[0] && x <= max[0] && z >= min[1] && z <= max[1];
}
