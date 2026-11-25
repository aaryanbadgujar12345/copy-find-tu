import type { Span, WeekHours } from "@/data/types";
import type { CampusTime } from "./campus-time";
import { formatTime } from "./campus-time";

type PlaceHours = WeekHours | null | "unlisted";

export function spanOn(hours: PlaceHours, weekday: number): Span | null {
  if (hours === "unlisted") return null;
  if (hours === null) return { open: 0, close: 1440 };
  return hours[weekday] ?? null;
}

export function isOpenAt(hours: PlaceHours, time: CampusTime): boolean {
  const span = spanOn(hours, time.weekday);
  return !!span && time.minutes >= span.open && time.minutes < span.close;
}

export function formatSpan(span: Span | null): string {
  if (!span) return "Closed";
  if (span.open === 0 && span.close === 1440) return "Open all day";
  return `${formatTime(span.open)} – ${formatTime(span.close)}`;
}

export interface OpenState {
  open: boolean;
  label: string;
}

export function openState(hours: PlaceHours, time: CampusTime): OpenState {
  if (hours === "unlisted")
    return { open: false, label: "Opening hours not listed" };
  if (hours === null) return { open: true, label: "Always open" };
  const today = spanOn(hours, time.weekday);
  if (today && time.minutes >= today.open && time.minutes < today.close) {
    const until = today.close >= 1440 ? "midnight" : formatTime(today.close);
    return { open: true, label: `Open until ${until}` };
  }
  if (today && time.minutes < today.open) {
    return { open: false, label: `Opens at ${formatTime(today.open)}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const weekday = (time.weekday + ahead) % 7;
    const next = spanOn(hours, weekday);
    if (next) {
      const day = ahead === 1 ? "tomorrow" : WEEKDAY_NAMES[weekday];
      return { open: false, label: `Opens ${day} at ${formatTime(next.open)}` };
    }
  }
  return { open: false, label: "Closed" };
}

export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
