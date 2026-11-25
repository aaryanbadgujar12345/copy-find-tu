"use client";

import { Skeleton } from "@/components/ui/basics";
import { OccupancyTag } from "@/components/ui/Occupancy";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCampusTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { roomsIn, studyPlaces } from "@/lib/data/catalog";
import { openState } from "@/lib/hours";
import { placeOccupancy } from "@/lib/occupancy";

export function StudyList() {
  const time = useCampusTime();
  if (!time) {
    return (
      <div className="grid gap-3">
        {studyPlaces.map((place) => (
          <Skeleton
            key={place.id}
            className="h-24 w-full rounded-(--radius-card)"
          />
        ))}
      </div>
    );
  }
  const rows = studyPlaces
    .map((place) => {
      const rooms = roomsIn(place.id);
      const occupancy = placeOccupancy(place, rooms, time);
      const state = openState(place.hours, time);
      return { place, rooms, occupancy, state };
    })
    .sort((a, b) => Number(b.state.open) - Number(a.state.open));

  return (
    <ul role="list" className="grid gap-3">
      {rows.map(({ place, rooms, occupancy, state }) => (
        <li key={place.id}>
          <Link
            href={`/places/${place.id}`}
            className={`group block rounded-(--radius-card) border border-line p-4 transition-colors hover:border-ink-3 ${
              state.open ? "" : "bg-mist/60"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink-2"
              >
                <PlaceIcon id={place.id} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">
                  {place.name}
                </span>
                <span className="block text-[13px] text-ink-2">
                  {state.open
                    ? state.label
                    : `${copy.study.closedLast} · ${state.label}`}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                size={18}
                className="text-ink-3 transition-transform group-hover:translate-x-0.5"
              />
            </span>
            {state.open ? (
              <span className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <OccupancyTag occupancy={occupancy} />
                <span className="text-[13px] text-ink-2">
                  {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
                </span>
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
