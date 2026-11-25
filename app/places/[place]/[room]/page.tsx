import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RateRoom } from "@/components/rooms/RateRoom";
import { RoomArt } from "@/components/rooms/RoomArt";
import { RoomLive } from "@/components/rooms/RoomLive";
import { RoomTabs } from "@/components/rooms/RoomTabs";
import { RoomQr, ShareRoom } from "@/components/rooms/ShareRoom";
import { buttonStyles, PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import { getPlace, getRoom, rooms, roomsIn } from "@/lib/data/catalog";

export function generateStaticParams() {
  return rooms.map((room) => ({ place: room.placeId, room: room.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/places/[place]/[room]">): Promise<Metadata> {
  const { room } = await params;
  return { title: getRoom(room)?.name };
}

export default function RoomPage({
  params,
}: PageProps<"/places/[place]/[room]">) {
  return (
    <Suspense>
      <RoomContent params={params} />
    </Suspense>
  );
}

async function RoomContent({
  params,
}: {
  params: Promise<{ place: string; room: string }>;
}) {
  const { place: placeId, room: roomId } = await params;
  const room = getRoom(roomId);
  const place = getPlace(placeId);
  if (!room || !place || room.placeId !== place.id) notFound();

  const siblings = roomsIn(place.id);
  const index = siblings.findIndex((r) => r.id === room.id);
  const previous = siblings[(index - 1 + siblings.length) % siblings.length];
  const next = siblings[(index + 1) % siblings.length];

  return (
    <article>
      <PanelHeader title={room.name} back={`/places/${place.id}`} />
      <div className="px-5">
        <p className="text-[14px] text-ink-2">
          {place.shortName} · {room.floor} · {copy.roomType[room.type]} ·{" "}
          {copy.common.seats(room.seats)}
        </p>
        <RoomArt room={room} className="mt-4" />
        <div className="mt-4">
          <RoomLive room={room} />
        </div>
        {room.bookable ? (
          <Link
            href={`/book/${room.id}`}
            className={`${buttonStyles.primary} mt-5 w-full`}
          >
            <CalendarDays aria-hidden size={18} />
            {copy.room.book}
          </Link>
        ) : null}
      </div>

      <Section className="pt-6">
        <RoomTabs room={room} />
      </Section>

      <Section>
        <div className="grid gap-4">
          <ShareRoom title={`${room.name}, ${place.shortName}`} />
          <RoomQr />
        </div>
      </Section>

      <Section title={copy.room.rateTitle}>
        <RateRoom roomId={room.id} />
      </Section>

      {siblings.length > 1 ? (
        <nav className="flex justify-between gap-2 border-t border-line px-3 py-3">
          <Link
            href={`/places/${place.id}/${previous.id}`}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 hover:bg-mist hover:text-ink"
          >
            <ChevronLeft aria-hidden size={16} />
            <span className="sr-only">{copy.room.previous}: </span>
            {previous.name}
          </Link>
          <Link
            href={`/places/${place.id}/${next.id}`}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 hover:bg-mist hover:text-ink"
          >
            <span className="sr-only">{copy.room.next}: </span>
            {next.name}
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
      ) : null}
    </article>
  );
}
