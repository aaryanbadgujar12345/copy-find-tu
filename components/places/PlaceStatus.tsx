"use client";

import { OccupancyTag } from "@/components/ui/Occupancy";
import { Skeleton } from "@/components/ui/basics";
import type { Place } from "@/data/types";
import { useCampusTime } from "@/lib/campus-time";
import { getPlace, roomsIn } from "@/lib/data/catalog";
import { openState } from "@/lib/hours";
import { placeOccupancy } from "@/lib/occupancy";

/** Open or closed, plus how busy for places with rooms. */
export function PlaceStatus({ placeId }: { placeId: Place["id"] }) {
  const time = useCampusTime();
  const place = getPlace(placeId);
  if (!place) return null;
  if (!time) return <Skeleton className="h-4 w-28" />;
  const rooms = roomsIn(place.id);
  const state = openState(place.hours, time);
  if (rooms.length > 0 && state.open) {
    return (
      <span className="inline-flex items-center gap-2">
        <OccupancyTag occupancy={placeOccupancy(place, rooms, time)} />
        <span className="text-ink-3" aria-hidden>
          ·
        </span>
        <span>{state.label}</span>
      </span>
    );
  }
  return (
    <span className={state.open ? undefined : "text-ink-2"}>{state.label}</span>
  );
}
