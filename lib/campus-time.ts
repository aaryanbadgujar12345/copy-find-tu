import { useSyncExternalStore } from "react";

export const CAMPUS_TIME_ZONE = "Europe/Amsterdam";

export interface CampusTime {
  /** "2026-11-18" */
  date: string;
  /** Minutes since midnight. */
  minutes: number;
  /** 0 is Monday. */
  weekday: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

export function campusTime(timestamp: number): CampusTime {
  const parts: Record<string, string> = {};
  for (const { type, value } of partsFormat.formatToParts(timestamp)) {
    parts[type] = value;
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday ?? "Mon"),
  };
}

function noonUtc(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const next = noonUtc(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return (noonUtc(date).getUTCDay() + 6) % 7;
}

export function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function formatTime(minutes: number): string {
  const wrapped = minutes % 1440;
  const hours = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mins = String(wrapped % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

export function parseTime(value: string | null): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

const longDayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDay(date: string, today?: string): string {
  if (today && date === today) return "Today";
  if (today && date === addDays(today, 1)) return "Tomorrow";
  return dayFormat.format(noonUtc(date));
}

export function formatLongDay(date: string): string {
  return longDayFormat.format(noonUtc(date));
}

let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function scheduleTick() {
  const untilNextMinute = 60_000 - (Date.now() % 60_000) + 50;
  timer = setTimeout(() => {
    for (const listener of listeners) listener();
    scheduleTick();
  }, untilNextMinute);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) scheduleTick();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
}

const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Campus time, ticking every minute. `null` while prerendering. */
export function useCampusTime(): CampusTime | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  return minute === null ? null : campusTime(minute);
}
