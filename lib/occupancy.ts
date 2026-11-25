import type { Place, Room } from "@/data/types";
import type { CampusTime } from "./campus-time";
import { isOpenAt } from "./hours";
import { seeded } from "./seeded";

export type Level = "quiet" | "busy" | "full";

export type Occupancy =
  | { state: "closed" }
  | { state: "unknown" }
  | {
      state: "open";
      ratio: number;
      level: Level;
      taken: number;
      seats: number;
    };

/** How full a study space usually is at each hour, 0 to 1. */
const DAY_CURVE = [
  0, 0, 0, 0, 0, 0, 0, 0.05, 0.18, 0.4, 0.62, 0.78, 0.7, 0.82, 0.88, 0.8, 0.66,
  0.5, 0.38, 0.34, 0.3, 0.24, 0.16, 0.1,
];

export function levelOf(ratio: number): Level {
  if (ratio < 0.5) return "quiet";
  if (ratio < 0.8) return "busy";
  return "full";
}

function curveAt(minutes: number): number {
  const hour = Math.floor(minutes / 60);
  const next = DAY_CURVE[(hour + 1) % 24];
  const blend = (minutes % 60) / 60;
  return DAY_CURVE[hour] * (1 - blend) + next * blend;
}

export function roomOccupancy(
  room: Room,
  place: Place,
  time: CampusTime,
): Occupancy {
  if (!isOpenAt(place.hours, time)) return { state: "closed" };
  if (!room.hasSensor) return { state: "unknown" };
  const weekend = time.weekday >= 5 ? 0.45 : 1;
  const bias = 0.75 + seeded(room.id) * 0.45;
  const quarter = Math.floor(time.minutes / 15);
  const noise = (seeded(`${room.id}:${time.date}:${quarter}`) - 0.5) * 0.16;
  const ratio = clamp(curveAt(time.minutes) * weekend * bias + noise);
  const taken = Math.round(ratio * room.seats);
  return {
    state: "open",
    ratio: taken / room.seats,
    level: levelOf(taken / room.seats),
    taken,
    seats: room.seats,
  };
}

export function placeOccupancy(
  place: Place,
  rooms: Room[],
  time: CampusTime,
): Occupancy {
  if (!isOpenAt(place.hours, time)) return { state: "closed" };
  let taken = 0;
  let seats = 0;
  for (const room of rooms) {
    const occupancy = roomOccupancy(room, place, time);
    if (occupancy.state === "open") {
      taken += occupancy.taken;
      seats += occupancy.seats;
    }
  }
  if (seats === 0) return { state: "unknown" };
  return {
    state: "open",
    ratio: taken / seats,
    level: levelOf(taken / seats),
    taken,
    seats,
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
