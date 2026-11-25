"use client";

import { ChevronDown } from "lucide-react";
import type { WeekHours } from "@/data/types";
import { useCampusTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { formatSpan, openState, WEEKDAY_NAMES } from "@/lib/hours";
import { Skeleton } from "@/components/ui/basics";

export function Hours({ hours }: { hours: WeekHours }) {
  const time = useCampusTime();
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
        <span className="text-[15px]">
          {time ? (
            <span
              className={
                openState(hours, time).open ? "text-ink" : "text-ink-2"
              }
            >
              {openState(hours, time).label}
            </span>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </span>
        <span className="flex items-center gap-1 text-[13px] font-medium text-brand-deep">
          {copy.place.hours}
          <ChevronDown
            aria-hidden
            size={16}
            className="transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <table className="mt-3 w-full text-[14px]">
        <tbody>
          {hours.map((span, weekday) => {
            const today = time?.weekday === weekday;
            return (
              <tr
                key={weekday}
                className={today ? "font-semibold" : "text-ink-2"}
              >
                <th scope="row" className="py-1 text-left font-[inherit]">
                  {WEEKDAY_NAMES[weekday]}
                  {today ? (
                    <span className="sr-only"> ({copy.place.today})</span>
                  ) : null}
                </th>
                <td className="py-1 text-right tabular-nums">
                  {formatSpan(span)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
