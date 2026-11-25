import geoJson from "@/data/campus-geo.json";
import type { CampusGeo, PlaceGeo, PlaceId } from "@/data/types";

export const campusGeo = geoJson as unknown as CampusGeo;

export function geoOf(placeId: PlaceId): PlaceGeo {
  return campusGeo.places[placeId];
}

/** Metres between two points. */
export function distance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

export function distanceToPlace(
  from: { lat: number; lon: number },
  placeId: PlaceId,
): number {
  return distance(from, geoOf(placeId));
}

/** Whether a position is on or near campus, within two kilometres. */
export function isNearCampus(position: { lat: number; lon: number }): boolean {
  return distance(position, campusGeo.origin) < 2000;
}

export function mapsUrl(placeId: PlaceId): string {
  const { lat, lon } = geoOf(placeId);
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
