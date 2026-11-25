import { copy } from "@/lib/copy";
import type { Level, Occupancy } from "@/lib/occupancy";
import { Skeleton } from "./basics";

const DOT: Record<Level, string> = {
  quiet: "bg-quiet",
  busy: "bg-busy",
  full: "bg-full",
};

export function levelWord(occupancy: Occupancy): string {
  if (occupancy.state === "closed") return copy.occupancy.closed;
  if (occupancy.state === "unknown") return copy.occupancy.unknown;
  return copy.occupancy[occupancy.level];
}

/** A dot and a word, with the percentage when there is one. Never colour alone. */
export function OccupancyTag({ occupancy }: { occupancy: Occupancy | null }) {
  if (!occupancy) return <Skeleton className="h-4 w-20" />;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-ink">
      <span
        aria-hidden
        className={`size-2 rounded-full ${
          occupancy.state === "open"
            ? DOT[occupancy.level]
            : "bg-line ring-1 ring-ink-3/40"
        }`}
      />
      {levelWord(occupancy)}
      {occupancy.state === "open" ? (
        <span className="font-normal text-ink-2">
          {copy.occupancy.percent(occupancy.ratio)}
          <span className="sr-only"> ({copy.occupancy.estimate})</span>
        </span>
      ) : null}
    </span>
  );
}

export function OccupancyBar({ occupancy }: { occupancy: Occupancy | null }) {
  if (!occupancy) return <Skeleton className="h-10 w-full" />;
  if (occupancy.state !== "open") {
    return <OccupancyTag occupancy={occupancy} />;
  }
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <OccupancyTag occupancy={occupancy} />
        <span className="text-[13px] text-ink-2">
          {copy.occupancy.taken(occupancy.taken, occupancy.seats)} ·{" "}
          {copy.occupancy.estimate}
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${levelWord(occupancy)}, ${copy.occupancy.estimate}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(occupancy.ratio * 100)}
        className="mt-2 h-2 overflow-hidden rounded-full bg-mist"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out-soft ${DOT[occupancy.level]}`}
          style={{ width: `${Math.max(4, occupancy.ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
