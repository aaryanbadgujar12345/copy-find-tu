"use client";

import { ArrowUpRight, CalendarOff, MapPin } from "lucide-react";
import Link from "next/link";
import { EmptyState, Skeleton } from "@/components/ui/basics";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import type { CampusEvent } from "@/data/types";
import {
  addDays,
  formatDay,
  formatTime,
  useCampusTime,
} from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { events, getPlace } from "@/lib/data/catalog";

const TONES: Record<CampusEvent["tone"], string> = {
  cyan: "from-[#d9f2fa] to-[#b8e6f4] text-[#00597a]",
  green: "from-[#e4f3df] to-[#c9e6bf] text-[#2d6a34]",
  orange: "from-[#fff0d9] to-[#ffdcaa] text-[#8a4f00]",
  violet: "from-[#ece7fb] to-[#d7cdf5] text-[#4f3a99]",
};

export function EventList() {
  const time = useCampusTime();
  if (!time) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-56 w-full rounded-(--radius-card)" />
        <Skeleton className="h-56 w-full rounded-(--radius-card)" />
      </div>
    );
  }
  const upcoming = events
    .map((event) => ({ ...event, date: addDays(time.date, event.dayOffset) }))
    .filter((event) => event.dayOffset > 0 || event.end > time.minutes)
    .sort((a, b) => a.dayOffset - b.dayOffset || a.start - b.start);

  if (upcoming.length === 0) {
    return (
      <EmptyState
        icon={<CalendarOff size={22} />}
        title={copy.events.empty}
        body={copy.events.emptyHint}
      />
    );
  }

  const groups = [
    {
      title: copy.events.thisWeek,
      items: upcoming.filter((event) => event.dayOffset < 7),
    },
    {
      title: copy.events.later,
      items: upcoming.filter((event) => event.dayOffset >= 7),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`events-${group.title}`}>
          <h2
            id={`events-${group.title}`}
            className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2 uppercase"
          >
            {group.title}
          </h2>
          <ul role="list" className="grid gap-4">
            {group.items.map((event) => {
              const place = getPlace(event.placeId);
              return (
                <li
                  key={event.id}
                  className="overflow-hidden rounded-(--radius-card) border border-line"
                >
                  <div
                    className={`flex h-28 items-end justify-between bg-linear-to-br p-4 ${TONES[event.tone]}`}
                  >
                    <p className="text-[13px] font-semibold">
                      {formatDay(event.date, time.date)} ·{" "}
                      {formatTime(event.start)} – {formatTime(event.end)}
                    </p>
                    <span aria-hidden className="opacity-70">
                      <PlaceIcon id={event.placeId} size={40} />
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[17px] font-semibold tracking-tight">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-5 text-ink-2">
                      {event.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      {place ? (
                        <Link
                          href={`/places/${place.id}`}
                          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:underline"
                        >
                          <MapPin
                            aria-hidden
                            size={16}
                            className="text-ink-2"
                          />
                          {place.shortName}
                        </Link>
                      ) : null}
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand-deep hover:underline"
                      >
                        {copy.events.moreInfo}
                        <span className="sr-only">: {event.title}</span>
                        <ArrowUpRight aria-hidden size={16} />
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
