"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { levelWord } from "@/components/ui/Occupancy";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import { copy } from "@/lib/copy";
import type { PlaceId, ScenePoint } from "@/data/types";
import type { CampusTime } from "@/lib/campus-time";
import { getPlace, places, roomsIn } from "@/lib/data/catalog";
import { campusGeo } from "@/lib/geo";
import type { MapFocus } from "@/lib/map-focus";
import { placeOccupancy } from "@/lib/occupancy";
import { getUi } from "@/lib/ui-store";
import { LEVEL_TINT } from "./scene";

const MARKER_PLACES = new Set<PlaceId>(["tram-19", "bike-parking", "food"]);
const ALWAYS_MARKED = new Set<PlaceId>(["tram-19"]);

/** Label elements and the 3D point each one follows. Written by the overlay, read every frame. */
const anchors = new Map<
  string,
  { element: HTMLElement; point: THREE.Vector3 }
>();

function edgePoint(bearing: number): ScenePoint {
  const { min, max } = campusGeo.bounds;
  const rad = (bearing * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dz = -Math.cos(rad);
  const scale = Math.min(
    Math.abs((dx > 0 ? max[0] : min[0]) / (dx || 1e-6)),
    Math.abs((dz > 0 ? max[1] : min[1]) / (dz || 1e-6)),
  );
  return [dx * scale * 0.92, dz * scale * 0.92];
}

function track(key: string, point: [number, number, number]) {
  return (element: HTMLElement | null) => {
    if (element)
      anchors.set(key, { element, point: new THREE.Vector3(...point) });
    else anchors.delete(key);
  };
}

/** Inside the canvas: moves every label to where its point lands on screen. */
export function LabelProjector() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const projected = new THREE.Vector3();

  useFrame(() => {
    const { insets } = getUi();
    for (const { element, point } of anchors.values()) {
      projected.copy(point).project(camera);
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;
      const visible =
        projected.z < 1 &&
        x > insets.left + 24 &&
        x < size.width + 40 &&
        y > -20 &&
        y < size.height - insets.bottom - 8;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      element.style.visibility = visible ? "visible" : "hidden";
    }
  });
  return null;
}

/** Outside the canvas: the labels themselves, as normal buttons in the page. */
export function LabelLayer({
  focus,
  time,
}: {
  focus: MapFocus;
  time: CampusTime | null;
}) {
  const router = useRouter();
  const go = (id: PlaceId) => router.push(`/places/${id}`);
  const base =
    "pointer-events-auto absolute top-0 left-0 invisible will-change-transform";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {places.map((place) => {
        const geo = campusGeo.places[place.id];
        if (!geo) return null;
        const selected = focus.selected === place.id;
        const lit = !focus.highlighted || focus.highlighted.includes(place.id);

        if (MARKER_PLACES.has(place.id)) {
          const show =
            selected ||
            ALWAYS_MARKED.has(place.id) ||
            (focus.highlighted?.includes(place.id) ?? false);
          if (!show) return null;
          return geo.markers.map((marker, index) => (
            <button
              key={`${place.id}-${index}`}
              ref={track(`${place.id}-${index}`, [
                marker.point[0],
                2,
                marker.point[1],
              ])}
              type="button"
              onClick={() => go(place.id)}
              title={marker.name}
              aria-label={`${place.name}: ${marker.name}`}
              className={`${base} flex size-9 items-center justify-center rounded-full border-2 border-white shadow-md transition-colors ${
                selected
                  ? "bg-navy text-white"
                  : lit
                    ? "bg-paper text-ink"
                    : "bg-paper/70 text-ink-2"
              }`}
            >
              <PlaceIcon id={place.id} size={14} />
            </button>
          ));
        }

        const point: ScenePoint = geo.offscene
          ? edgePoint(geo.offscene.bearing)
          : geo.anchor;
        const rooms = roomsIn(place.id);
        const found = getPlace(place.id);
        const occupancy =
          time && found && rooms.length > 0
            ? placeOccupancy(found, rooms, time)
            : null;

        return (
          <button
            key={place.id}
            ref={track(place.id, [
              point[0],
              geo.offscene ? 4 : geo.height + 8,
              point[1],
            ])}
            type="button"
            onClick={() => go(place.id)}
            aria-current={selected ? "true" : undefined}
            className={`${base} flex min-h-7 items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-[12px] font-semibold whitespace-nowrap shadow-md transition-[background-color,color,opacity] duration-300 ${
              selected
                ? "z-10 bg-navy text-white"
                : lit
                  ? "bg-paper text-ink hover:bg-mist"
                  : "bg-paper/70 text-ink-2 opacity-70"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full ${selected ? "bg-white/15" : "bg-mist"}`}
            >
              <PlaceIcon id={place.id} size={12} />
            </span>
            {place.shortName}
            {occupancy?.state === "open" ? (
              <span className="flex items-center gap-1 font-medium text-ink-2">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: LEVEL_TINT[occupancy.level] }}
                />
                <span className={selected ? "text-white/85" : undefined}>
                  {levelWord(occupancy)}
                </span>
                <span className="sr-only">({copy.occupancy.estimate})</span>
              </span>
            ) : occupancy?.state === "closed" ? (
              <span
                className={`font-medium ${selected ? "text-white/85" : "text-ink-2"}`}
              >
                {copy.occupancy.closed}
              </span>
            ) : null}
            {geo.offscene ? <ArrowUpRight aria-hidden size={12} /> : null}
          </button>
        );
      })}
    </div>
  );
}
