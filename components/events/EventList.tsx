"use client";

import { ArrowUpRight, CalendarOff, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChipLink,
  EmptyState,
  Section,
  Skeleton,
} from "@/components/ui/basics";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import type { CampusEvent, PlaceId } from "@/data/types";
import {
  addDays,
  type CampusTime,
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

export const EVENT_FILTERS = ["today", "week", "later"] as const;
export type EventFilter = (typeof EVENT_FILTERS)[number];

export function isEventFilter(value: string | null): value is EventFilter {
  return EVENT_FILTERS.includes(value as EventFilter);
}

/** Events that haven't ended yet, soonest first, optionally for one day range. */
export function upcomingEvents(
  time: CampusTime,
  filter: EventFilter | null,
  placeId?: PlaceId,
): CampusEvent[] {
  const weekEnd = addDays(time.date, 7);
  return events
    .filter((event) => !placeId || event.placeId === placeId)
    .filter(
      (event) =>
        event.date > time.date ||
        (event.date === time.date && event.end > time.minutes),
    )
    .filter((event) => {
      if (filter === "today") return event.date === time.date;
      if (filter === "week") return event.date < weekEnd;
      if (filter === "later") return event.date >= weekEnd;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
}

const FILTER_LABELS: Record<EventFilter | "all", string> = {
  all: copy.events.all,
  today: copy.events.today,
  week: copy.events.week,
  later: copy.events.laterFilter,
};

export function EventList({ placeId }: { placeId?: PlaceId }) {
  const time = useCampusTime();
  const params = useSearchParams();
  const raw = params.get("when");
  const filter = !placeId && isEventFilter(raw) ? raw : null;

  if (!time) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-56 w-full rounded-(--radius-card)" />
        <Skeleton className="h-56 w-full rounded-(--radius-card)" />
      </div>
    );
  }
  const list = upcomingEvents(time, filter, placeId);
  if (placeId) {
    if (list.length === 0) return null;
    return (
      <Section title={copy.events.here}>
        <ul role="list" className="grid gap-4">
          {list.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              time={time}
              showPlace={false}
              Heading="h3"
            />
          ))}
        </ul>
      </Section>
    );
  }

  return (
    <div className="grid gap-4">
      {placeId ? null : (
        <>
          <nav
            aria-label={copy.events.filters}
            className="-mx-5 scrollbar-none flex gap-2 overflow-x-auto px-5"
          >
            {(["all", ...EVENT_FILTERS] as const).map((id) => (
              <ChipLink
                key={id}
                href={id === "all" ? "/events" : `/events?when=${id}`}
                replace
                scroll={false}
                active={(filter ?? "all") === id}
              >
                {FILTER_LABELS[id]}
              </ChipLink>
            ))}
          </nav>
          <p className="text-[13px] leading-5 text-ink-2">{copy.events.demo}</p>
        </>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={22} />}
          title={filter ? copy.events.emptyFilter : copy.events.empty}
          body={filter ? copy.events.emptyFilterHint : copy.events.emptyHint}
        />
      ) : (
        <ul role="list" className="grid gap-4">
          {list.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              time={time}
              showPlace
              Heading="h2"
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({
  event,
  time,
  showPlace,
  Heading,
}: {
  event: CampusEvent;
  time: CampusTime;
  showPlace: boolean;
  Heading: "h2" | "h3";
}) {
  const place = getPlace(event.placeId);
  const now =
    event.date === time.date &&
    event.start <= time.minutes &&
    event.end > time.minutes;
  return (
    <li className="overflow-hidden rounded-(--radius-card) border border-line">
      <article aria-labelledby={`event-${event.id}`}>
        <div
          className={`flex h-24 items-end justify-between bg-linear-to-br p-4 ${TONES[event.tone]}`}
        >
          <p className="text-[13px] font-semibold">
            {now ? (
              <span className="mr-2 rounded-full bg-white/80 px-2 py-0.5 text-[12px]">
                {copy.events.happeningNow}
              </span>
            ) : null}
            <time dateTime={`${event.date}T${formatTime(event.start)}`}>
              {formatDay(event.date, time.date)} · {formatTime(event.start)} –{" "}
              {formatTime(event.end)}
            </time>
          </p>
          <span aria-hidden className="opacity-70">
            <PlaceIcon id={event.placeId} size={36} />
          </span>
        </div>
        <div className="p-4">
          <Heading
            id={`event-${event.id}`}
            className="text-[17px] font-semibold tracking-tight"
          >
            {event.title}
          </Heading>
          <p className="mt-1 text-[14px] leading-5 text-ink-2">
            {event.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {showPlace && place ? (
              <Link
                href={`/places/${place.id}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-ink hover:underline"
              >
                <MapPin aria-hidden size={16} className="text-ink-2" />
                {place.shortName}
                <span className="sr-only">: {copy.common.showOnMap}</span>
              </Link>
            ) : null}
            {event.link ? (
              <a
                href={event.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-brand-deep hover:underline"
              >
                {copy.events.moreInfo}
                <span className="sr-only">: {event.title}</span>
                <ArrowUpRight aria-hidden size={16} />
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  );
}
