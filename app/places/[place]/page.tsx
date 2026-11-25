import { ChevronLeft, ChevronRight, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventList } from "@/components/events/EventList";
import { Directions } from "@/components/places/Directions";
import { Hours } from "@/components/places/Hours";
import { PlaceStatus } from "@/components/places/PlaceStatus";
import { RoomList } from "@/components/places/RoomList";
import { Notices } from "@/components/ui/Notices";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import {
  eventsAt,
  getPlace,
  noticesFor,
  places,
  roomsIn,
  studyPlaces,
} from "@/lib/data/catalog";
import { geoOf, mapsUrl } from "@/lib/geo";

export function generateStaticParams() {
  return places.map((place) => ({ place: place.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/places/[place]">): Promise<Metadata> {
  const { place } = await params;
  return { title: getPlace(place)?.name };
}

export default function PlacePage({ params }: PageProps<"/places/[place]">) {
  return (
    <Suspense>
      <PlaceContent params={params} />
    </Suspense>
  );
}

async function PlaceContent({
  params,
}: {
  params: Promise<{ place: string }>;
}) {
  const { place: id } = await params;
  const place = getPlace(id);
  if (!place) notFound();
  const rooms = roomsIn(place.id);
  const geo = geoOf(place.id);
  const studyIndex = studyPlaces.findIndex((p) => p.id === place.id);
  const previous =
    studyIndex >= 0
      ? studyPlaces[(studyIndex - 1 + studyPlaces.length) % studyPlaces.length]
      : null;
  const next =
    studyIndex >= 0 ? studyPlaces[(studyIndex + 1) % studyPlaces.length] : null;

  return (
    <article>
      <PanelHeader
        title={place.name}
        back={rooms.length > 0 ? "/study" : "/"}
      />
      <div className="px-5 text-[14px] text-ink-2">
        <PlaceStatus placeId={place.id} />
        {geo.offscene ? (
          <span>
            {" "}
            · {copy.place.offscene((geo.offscene.distance / 1000).toFixed(1))}
          </span>
        ) : null}
      </div>
      <div className="pt-3">
        <Notices notices={noticesFor(place.id)} />
      </div>

      <Section title={copy.place.gettingThere}>
        <p className="text-[15px] leading-6">{place.gettingThere}</p>
        {geo.offscene ? (
          <a
            href={mapsUrl(place.id)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-deep hover:underline"
          >
            <Navigation aria-hidden size={16} />
            {copy.common.openInMaps}
          </a>
        ) : (
          <Directions placeId={place.id} />
        )}
      </Section>

      {rooms.length > 0 ? (
        <Section title={copy.place.rooms}>
          <Suspense>
            <RoomList rooms={rooms} />
          </Suspense>
        </Section>
      ) : null}

      {geo.markers.length > 0 ? (
        <Section title={copy.place.spots}>
          <ul role="list" className="grid gap-2">
            {geo.markers.map((marker, index) => (
              <li
                key={`${marker.name}-${index}`}
                className="flex items-center gap-3 text-[15px]"
              >
                <MapPin aria-hidden size={16} className="shrink-0 text-ink-2" />
                {marker.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {eventsAt(place.id).length > 0 ? (
        <Suspense>
          <EventList placeId={place.id} />
        </Suspense>
      ) : null}

      <Section title={copy.place.about}>
        <p className="text-[15px] leading-6 text-pretty">{place.summary}</p>
        {place.address ? (
          <p className="mt-2 text-[14px] text-ink-2">{place.address}</p>
        ) : null}
      </Section>

      {Array.isArray(place.hours) ? (
        <Section>
          <Hours hours={place.hours} />
        </Section>
      ) : null}

      {previous && next && studyPlaces.length > 1 ? (
        <nav className="flex justify-between gap-2 border-t border-line px-3 py-3">
          <Link
            href={`/places/${previous.id}`}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 hover:bg-mist hover:text-ink"
          >
            <ChevronLeft aria-hidden size={16} />
            <span className="sr-only">{copy.place.previous}: </span>
            {previous.shortName}
          </Link>
          <Link
            href={`/places/${next.id}`}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 hover:bg-mist hover:text-ink"
          >
            <span className="sr-only">{copy.place.next}: </span>
            {next.shortName}
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
      ) : null}
    </article>
  );
}
