import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import { bookableRooms, getRoom, placeOf } from "@/lib/data/catalog";

export function generateStaticParams() {
  return bookableRooms.map((room) => ({ room: room.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/book/[room]">): Promise<Metadata> {
  const { room } = await params;
  const found = getRoom(room);
  return {
    title: found ? `${copy.book.title}: ${found.name}` : copy.book.title,
  };
}

export default function BookRoomPage({ params }: PageProps<"/book/[room]">) {
  return (
    <Suspense>
      <BookRoomContent params={params} />
    </Suspense>
  );
}

async function BookRoomContent({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room: id } = await params;
  const room = getRoom(id);
  if (!room?.bookable) notFound();
  const place = placeOf(room);
  return (
    <>
      <PanelHeader title={room.name} back="/book" />
      <p className="-mt-1 px-5 text-[14px] text-ink-2">
        {place.shortName} · {room.floor} · {copy.roomType[room.type]} ·{" "}
        {copy.common.seats(room.seats)}
      </p>
      <Section>
        <Suspense>
          <SlotPicker room={room} />
        </Suspense>
      </Section>
    </>
  );
}
