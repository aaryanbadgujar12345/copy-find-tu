"use client";

import { OccupancyBar } from "@/components/ui/Occupancy";
import type { Room } from "@/data/types";
import { useCampusTime } from "@/lib/campus-time";
import { placeOf } from "@/lib/data/catalog";
import { roomOccupancy } from "@/lib/occupancy";

export function RoomLive({ room }: { room: Room }) {
  const time = useCampusTime();
  return (
    <OccupancyBar
      occupancy={time ? roomOccupancy(room, placeOf(room), time) : null}
    />
  );
}
