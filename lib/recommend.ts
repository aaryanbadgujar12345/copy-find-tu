import type { PlaceId, Room, RoomType } from "@/data/types";
import type { CampusTime } from "./campus-time";
import { placeOf, rooms } from "./data/catalog";
import { distanceToPlace } from "./geo";
import type { Occupancy } from "./occupancy";
import { roomOccupancy } from "./occupancy";

export interface Pick {
  room: Room;
  occupancy: Occupancy;
  distance: number | null;
}

export function recommend(options: {
  type: RoomType;
  time: CampusTime;
  placeId?: PlaceId;
  near?: { lat: number; lon: number };
}): Pick[] {
  const { type, time, placeId, near } = options;
  return rooms
    .filter(
      (room) =>
        room.type === type &&
        !room.bookable &&
        (!placeId || room.placeId === placeId),
    )
    .map((room) => ({
      room,
      occupancy: roomOccupancy(room, placeOf(room), time),
      distance: near ? distanceToPlace(near, room.placeId) : null,
    }))
    .filter(
      (pick) =>
        pick.occupancy.state !== "closed" &&
        !(pick.occupancy.state === "open" && pick.occupancy.level === "full"),
    )
    .sort((a, b) => score(a) - score(b))
    .slice(0, 4);
}

function score(pick: Pick): number {
  const busy = pick.occupancy.state === "open" ? pick.occupancy.ratio : 0.55;
  const far = pick.distance === null ? 0 : pick.distance / 1500;
  return busy + far;
}
