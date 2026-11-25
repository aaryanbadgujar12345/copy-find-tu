"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { OccupancyTag } from "@/components/ui/Occupancy";
import { ChipLink, EmptyState, RowLink } from "@/components/ui/basics";
import type { Room, RoomType } from "@/data/types";
import { useCampusTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { getPlace } from "@/lib/data/catalog";
import { roomOccupancy } from "@/lib/occupancy";

const TYPES: RoomType[] = ["silent", "group", "computer"];

export function RoomList({ rooms }: { rooms: Room[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const time = useCampusTime();
  const requested = params.get("type");
  const type = TYPES.find((t) => t === requested) ?? null;
  const present = TYPES.filter((t) => rooms.some((room) => room.type === t));
  const shown = type ? rooms.filter((room) => room.type === type) : rooms;

  return (
    <>
      {present.length > 1 ? (
        <div className="-mx-5 mb-2 scrollbar-none flex gap-2 overflow-x-auto px-5">
          <ChipLink href={pathname} replace scroll={false} active={!type}>
            {copy.place.allTypes}
          </ChipLink>
          {present.map((t) => (
            <ChipLink
              key={t}
              href={`${pathname}?type=${t}`}
              replace
              scroll={false}
              active={type === t}
            >
              {copy.roomType[t]}
            </ChipLink>
          ))}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <EmptyState title={copy.place.noRooms} />
      ) : (
        <ul role="list">
          {shown.map((room) => {
            const place = getPlace(room.placeId);
            const occupancy =
              time && place ? roomOccupancy(room, place, time) : null;
            return (
              <li key={room.id}>
                <RowLink
                  href={`/places/${room.placeId}/${room.id}`}
                  title={room.name}
                  subtitle={
                    <>
                      {copy.roomType[room.type]} · {room.floor} ·{" "}
                      {copy.common.seats(room.seats)}
                      {room.bookable ? (
                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-navy">
                          {copy.nav.book}
                        </span>
                      ) : null}
                    </>
                  }
                  trailing={<OccupancyTag occupancy={occupancy} />}
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
