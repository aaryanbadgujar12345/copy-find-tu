"use client";

import { CalendarSearch, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChipLink,
  EmptyState,
  RowLink,
  Skeleton,
} from "@/components/ui/basics";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import type { RoomType } from "@/data/types";
import {
  formatDay,
  formatTime,
  isIsoDate,
  parseTime,
  useCampusTime,
} from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import type { DayStatus } from "@/lib/data/bookings";
import { dayStatus, isFree, useBookings } from "@/lib/data/bookings";
import { bookableRooms, placeOf } from "@/lib/data/catalog";
import type { When } from "./WhenDialog";
import { WhenDialog } from "./WhenDialog";

const TYPES: RoomType[] = ["silent", "group", "computer"];

const STATUS: Record<DayStatus, { label: string; dot: string }> = {
  "free-now": { label: copy.book.freeNow, dot: "bg-quiet" },
  "free-later": { label: copy.book.freeLater, dot: "bg-busy" },
  full: { label: copy.book.fullToday, dot: "bg-full" },
  closed: { label: copy.book.closedToday, dot: "bg-line ring-1 ring-ink-3/40" },
};

function StatusTag({ label, dot }: { label: string; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap">
      <span aria-hidden className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function BookList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const time = useCampusTime();
  const bookings = useBookings();

  const type = TYPES.find((t) => t === params.get("type")) ?? null;
  const date = params.get("date");
  const from = parseTime(params.get("from"));
  const to = parseTime(params.get("to"));
  const when: When | null =
    isIsoDate(date) && from !== null && to !== null && to > from
      ? { date, from, to }
      : null;
  const dialogOpen = params.get("when") === "open";

  function replace(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const presentTypes = TYPES.filter((t) =>
    bookableRooms.some((room) => room.type === t),
  );
  const typeHref = (t: RoomType | null) => {
    const next = new URLSearchParams(params.toString());
    if (t) next.set("type", t);
    else next.delete("type");
    next.delete("when");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const ready = time && bookings;
  const rooms = bookableRooms.filter((room) => !type || room.type === type);
  const shown =
    ready && when
      ? rooms.filter((room) =>
          isFree(room, when.date, when.from, when.to, bookings),
        )
      : rooms;
  const slotQuery = when
    ? `?date=${when.date}&from=${formatTime(when.from)}&to=${formatTime(when.to)}`
    : "";

  return (
    <>
      <div className="-mx-5 scrollbar-none flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          type="button"
          onClick={() => replace({ when: "open" })}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
            when
              ? "border-navy bg-navy text-white"
              : "border-line text-ink hover:border-ink-3"
          }`}
        >
          <CalendarSearch aria-hidden size={16} />
          {when && time
            ? `${formatDay(when.date, time.date)}, ${formatTime(when.from)} – ${formatTime(when.to)}`
            : copy.book.anyTime}
        </button>
        {when ? (
          <button
            type="button"
            onClick={() => replace({ date: null, from: null, to: null })}
            aria-label={copy.book.clearWhen}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line hover:border-ink-3"
          >
            <X aria-hidden size={16} />
          </button>
        ) : null}
        <span aria-hidden className="mx-1 my-2 w-px shrink-0 bg-line" />
        <ChipLink href={typeHref(null)} replace scroll={false} active={!type}>
          {copy.place.allTypes}
        </ChipLink>
        {presentTypes.map((t) => (
          <ChipLink
            key={t}
            href={typeHref(t)}
            replace
            scroll={false}
            active={type === t}
          >
            {copy.roomType[t]}
          </ChipLink>
        ))}
      </div>

      {!ready ? (
        <div className="mt-4 grid gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<CalendarSearch size={22} />}
          title={copy.book.noneFree}
          body={copy.book.noneFreeHint}
        />
      ) : (
        <ul role="list" className="mt-3">
          {shown.map((room) => {
            const status = when
              ? { label: copy.book.freeInRange, dot: "bg-quiet" }
              : STATUS[dayStatus(room, time, bookings)];
            return (
              <li key={room.id}>
                <RowLink
                  href={`/book/${room.id}${slotQuery}`}
                  title={room.name}
                  subtitle={`${placeOf(room).shortName} · ${copy.roomType[room.type]} · ${copy.common.seats(room.seats)}`}
                  leading={
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink-2"
                    >
                      <PlaceIcon id={room.placeId} />
                    </span>
                  }
                  trailing={<StatusTag {...status} />}
                />
              </li>
            );
          })}
        </ul>
      )}

      {time ? (
        <WhenDialog
          key={dialogOpen ? "open" : "closed"}
          open={dialogOpen}
          today={time.date}
          initial={when}
          onClose={() => replace({ when: null })}
          onApply={(next) =>
            replace({
              when: null,
              date: next.date,
              from: formatTime(next.from),
              to: formatTime(next.to),
            })
          }
        />
      ) : null}
    </>
  );
}
