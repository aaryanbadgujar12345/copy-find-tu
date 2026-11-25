import type { BookingRules, Room, Span } from "@/data/types";
import type { CampusTime } from "@/lib/campus-time";
import { addDays, weekdayOf } from "@/lib/campus-time";
import { spanOn } from "@/lib/hours";
import { seeded } from "@/lib/seeded";
import { placeOf } from "./catalog";
import {
  latency,
  newId,
  readStored,
  shouldFail,
  useStored,
  writeStored,
} from "./storage";

export interface Booking {
  id: string;
  token: string;
  roomId: string;
  date: string;
  start: number;
  end: number;
  email: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
}

const KEY = "bookings";
const CONFIRM_WITHIN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_RULES: BookingRules = {
  daysAhead: 14,
  slotMinutes: 30,
  longestMinutes: 120,
};

export function rulesOf(room: Room): BookingRules {
  return room.rules ?? DEFAULT_RULES;
}

function allBookings(): Booking[] {
  return readStored<Booking[]>(KEY, []);
}

export function useBookings(): Booking[] | null {
  return useStored<Booking[]>(KEY, []);
}

export function findBooking(id: string | null): Booking | undefined {
  return id ? allBookings().find((booking) => booking.id === id) : undefined;
}

export function isTuDelftEmail(email: string): boolean {
  return /^[^\s@]+@(student\.)?tudelft\.nl$/i.test(email.trim());
}

/** The span the room can be booked on a date: its place's opening hours. */
export function bookableSpan(room: Room, date: string): Span | null {
  return spanOn(placeOf(room).hours, weekdayOf(date));
}

/** Bookings by other people, invented but stable for each room and day. */
function mockTaken(room: Room, date: string): Span[] {
  const span = bookableSpan(room, date);
  if (!span) return [];
  const step = rulesOf(room).slotMinutes;
  const taken: Span[] = [];
  let start = span.open;
  while (start + step <= span.close) {
    const roll = seeded(`${room.id}:${date}:${start}`);
    if (roll > 0.68) {
      const length = step * (1 + Math.floor(seeded(`${room.id}:${start}`) * 4));
      const end = Math.min(start + length, span.close);
      taken.push({ open: start, close: end });
      start = end;
    } else {
      start += step;
    }
  }
  return taken;
}

export function takenSpans(
  room: Room,
  date: string,
  bookings: Booking[],
  ignoreId?: string,
): Span[] {
  const mine = bookings
    .filter(
      (booking) =>
        booking.roomId === room.id &&
        booking.date === date &&
        booking.status !== "cancelled" &&
        booking.id !== ignoreId,
    )
    .map((booking) => ({ open: booking.start, close: booking.end }));
  return [...mockTaken(room, date), ...mine];
}

export function overlaps(spans: Span[], start: number, end: number): boolean {
  return spans.some((span) => start < span.close && end > span.open);
}

export function isFree(
  room: Room,
  date: string,
  start: number,
  end: number,
  bookings: Booking[],
): boolean {
  const span = bookableSpan(room, date);
  if (!span || start < span.open || end > span.close) return false;
  return !overlaps(takenSpans(room, date, bookings), start, end);
}

export type DayStatus = "free-now" | "free-later" | "full" | "closed";

export function dayStatus(
  room: Room,
  time: CampusTime,
  bookings: Booking[],
): DayStatus {
  const span = bookableSpan(room, time.date);
  if (!span || time.minutes >= span.close) return "closed";
  const step = rulesOf(room).slotMinutes;
  const taken = takenSpans(room, time.date, bookings);
  const firstSlot = Math.max(span.open, Math.ceil(time.minutes / step) * step);
  const nowSlot = Math.floor(time.minutes / step) * step;
  if (time.minutes >= span.open && !overlaps(taken, nowSlot, nowSlot + step)) {
    return "free-now";
  }
  for (let start = firstSlot; start + step <= span.close; start += step) {
    if (!overlaps(taken, start, start + step)) return "free-later";
  }
  return "full";
}

export function bookableDates(room: Room, today: string): string[] {
  const { daysAhead } = rulesOf(room);
  return Array.from({ length: daysAhead + 1 }, (_, i) => addDays(today, i));
}

export type CreateResult =
  { ok: true; booking: Booking } | { ok: false; reason: "taken" | "error" };

export async function createBooking(input: {
  room: Room;
  date: string;
  start: number;
  end: number;
  email: string;
}): Promise<CreateResult> {
  await latency(700);
  if (shouldFail("booking")) return { ok: false, reason: "error" };
  const bookings = allBookings();
  if (
    shouldFail("taken") ||
    !isFree(input.room, input.date, input.start, input.end, bookings)
  ) {
    return { ok: false, reason: "taken" };
  }
  const booking: Booking = {
    id: newId(),
    token: newId(24),
    roomId: input.room.id,
    date: input.date,
    start: input.start,
    end: input.end,
    email: input.email.trim().toLowerCase(),
    status: "pending",
    createdAt: Date.now(),
  };
  writeStored(KEY, [...bookings, booking]);
  return { ok: true, booking };
}

export type ConfirmOutcome =
  | { state: "confirmed"; booking: Booking }
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "used"; booking: Booking }
  | { state: "error" };

export async function confirmBooking(
  id: string | null,
  token: string | null,
  room: (id: string) => Room | undefined,
): Promise<ConfirmOutcome> {
  await latency();
  if (shouldFail("confirm")) return { state: "error" };
  const bookings = allBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking || booking.token !== token) return { state: "invalid" };
  if (booking.status !== "pending") return { state: "used", booking };
  const target = room(booking.roomId);
  const expired = Date.now() - booking.createdAt > CONFIRM_WITHIN_MS;
  const clash =
    !target ||
    overlaps(
      takenSpans(target, booking.date, bookings, booking.id),
      booking.start,
      booking.end,
    );
  if (expired || clash) {
    update(booking.id, { status: "cancelled" });
    return { state: "expired" };
  }
  const confirmed = update(booking.id, { status: "confirmed" });
  return { state: "confirmed", booking: confirmed };
}

export type CancelLookup =
  | { state: "invalid" }
  | { state: "cancelled"; booking: Booking }
  | { state: "active"; booking: Booking };

export function lookupForCancel(
  id: string | null,
  token: string | null,
  bookings: Booking[],
): CancelLookup {
  const booking = bookings.find((item) => item.id === id);
  if (!booking || booking.token !== token) return { state: "invalid" };
  if (booking.status === "cancelled") return { state: "cancelled", booking };
  return { state: "active", booking };
}

export async function cancelBooking(
  id: string,
  token: string,
): Promise<{ ok: boolean }> {
  await latency();
  if (shouldFail("cancel")) return { ok: false };
  const booking = allBookings().find((item) => item.id === id);
  if (!booking || booking.token !== token) return { ok: false };
  update(id, { status: "cancelled" });
  return { ok: true };
}

function update(id: string, patch: Partial<Booking>): Booking {
  const bookings = allBookings().map((booking) =>
    booking.id === id ? { ...booking, ...patch } : booking,
  );
  writeStored(KEY, bookings);
  const updated = bookings.find((booking) => booking.id === id);
  if (!updated) throw new Error(`No booking ${id}`);
  return updated;
}
