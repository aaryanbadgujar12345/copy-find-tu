"use client";

import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  CalendarDays,
  ChevronRight,
  Globe,
  LocateFixed,
  MapPin,
  Monitor,
  RotateCcw,
  SearchX,
  Users,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonStyles, EmptyState, Skeleton } from "@/components/ui/basics";
import { OccupancyTag } from "@/components/ui/Occupancy";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import type { RoomType } from "@/data/types";
import { useCampusTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { isPlaceId, placeOf, studyPlaces } from "@/lib/data/catalog";
import { isNearCampus } from "@/lib/geo";
import { recommend } from "@/lib/recommend";

const BASE = "/study/recommend";
const NEEDS: {
  id: RoomType | "bookable";
  title: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "silent",
    title: copy.recommend.needSilent,
    hint: copy.recommend.needSilentHint,
    Icon: VolumeX,
  },
  {
    id: "group",
    title: copy.recommend.needGroup,
    hint: copy.recommend.needGroupHint,
    Icon: Users,
  },
  {
    id: "computer",
    title: copy.recommend.needComputer,
    hint: copy.recommend.needComputerHint,
    Icon: Monitor,
  },
  {
    id: "bookable",
    title: copy.recommend.needBookable,
    hint: copy.recommend.needBookableHint,
    Icon: CalendarDays,
  },
];
const WHERE: { id: string; title: string; hint: string; Icon: LucideIcon }[] = [
  {
    id: "closest",
    title: copy.recommend.whereClosest,
    hint: copy.recommend.whereClosestHint,
    Icon: LocateFixed,
  },
  {
    id: "pick",
    title: copy.recommend.wherePick,
    hint: copy.recommend.wherePickHint,
    Icon: MapPin,
  },
  {
    id: "any",
    title: copy.recommend.whereAny,
    hint: copy.recommend.whereAnyHint,
    Icon: Globe,
  },
];

type Located =
  | { state: "idle" | "locating" | "denied" | "off-campus" }
  | { state: "found"; lat: number; lon: number };

function Option({
  href,
  title,
  hint,
  Icon,
}: {
  href: string;
  title: string;
  hint: string;
  Icon: LucideIcon;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-(--radius-card) border border-line px-4 py-3.5 transition-colors hover:border-brand hover:bg-brand-soft/40"
      >
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-deep"
        >
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold">{title}</span>
          <span className="block text-[13px] text-ink-2">{hint}</span>
        </span>
        <ChevronRight
          aria-hidden
          size={18}
          className="text-ink-3 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-medium text-ink-2">
        {copy.recommend.progress(step, total)}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={copy.recommend.progress(step, total)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out-soft"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function Recommend() {
  const params = useSearchParams();
  const router = useRouter();
  const time = useCampusTime();
  const need = params.get("need");
  const where = params.get("where");
  const placeParam = params.get("place");
  const [located, setLocated] = useState<Located>({ state: "idle" });

  useEffect(() => {
    if (need === "bookable") router.replace("/book?when=open");
  }, [need, router]);

  const wantsLocation =
    (need === "silent" || need === "group") && where === "closest";
  useEffect(() => {
    if (!wantsLocation || located.state !== "idle") return;
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setLocated({ state: "denied" }));
      return;
    }
    queueMicrotask(() => setLocated({ state: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setLocated(
          isNearCampus(point)
            ? { state: "found", ...point }
            : { state: "off-campus" },
        );
      },
      () => setLocated({ state: "denied" }),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, [wantsLocation, located.state]);

  const type: RoomType | null =
    need === "silent" || need === "group" || need === "computer" ? need : null;

  if (!type) {
    if (need === "bookable") return <Skeleton className="h-40 w-full" />;
    return (
      <>
        <Progress step={1} total={2} />
        <h2 className="mb-4 text-[20px] font-semibold tracking-tight">
          {copy.recommend.needTitle}
        </h2>
        <ul role="list" className="grid gap-2">
          {NEEDS.map(({ id, title, hint, Icon }) => (
            <Option
              key={id}
              href={`${BASE}?need=${id}`}
              title={title}
              hint={hint}
              Icon={Icon}
            />
          ))}
        </ul>
      </>
    );
  }

  const asksWhere = type !== "computer";
  if (asksWhere && !where) {
    return (
      <>
        <Progress step={2} total={3} />
        <h2 className="mb-4 text-[20px] font-semibold tracking-tight">
          {copy.recommend.whereTitle}
        </h2>
        <ul role="list" className="grid gap-2">
          {WHERE.map(({ id, title, hint, Icon }) => (
            <Option
              key={id}
              href={`${BASE}?need=${type}&where=${id}`}
              title={title}
              hint={hint}
              Icon={Icon}
            />
          ))}
        </ul>
      </>
    );
  }

  const failedLocation =
    where === "closest" &&
    (located.state === "denied" || located.state === "off-campus");
  if (
    asksWhere &&
    ((where === "pick" && !isPlaceId(placeParam ?? "")) || failedLocation)
  ) {
    return (
      <>
        <Progress step={3} total={3} />
        {failedLocation ? (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning-ink"
          >
            {located.state === "off-campus"
              ? copy.recommend.offCampus
              : copy.recommend.locationDenied}
          </p>
        ) : null}
        <h2 className="mb-4 text-[20px] font-semibold tracking-tight">
          {copy.recommend.pickTitle}
        </h2>
        <ul role="list" className="grid gap-2">
          {studyPlaces.map((place) => (
            <li key={place.id}>
              <Link
                href={`${BASE}?need=${type}&where=pick&place=${place.id}`}
                className="flex items-center gap-3 rounded-(--radius-card) border border-line px-4 py-3.5 transition-colors hover:border-brand hover:bg-brand-soft/40"
              >
                <span
                  aria-hidden
                  className="flex size-11 items-center justify-center rounded-xl bg-mist text-ink-2"
                >
                  <PlaceIcon id={place.id} size={22} />
                </span>
                <span className="text-[16px] font-semibold">{place.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (!time || (where === "closest" && located.state !== "found")) {
    return (
      <div aria-busy className="grid gap-3">
        <p className="text-[14px] text-ink-2">
          {where === "closest" ? copy.recommend.locating : copy.common.loading}
        </p>
        <Skeleton className="h-28 w-full rounded-(--radius-card)" />
        <Skeleton className="h-28 w-full rounded-(--radius-card)" />
      </div>
    );
  }

  const picks = recommend({
    type,
    time,
    placeId:
      where === "pick" && placeParam && isPlaceId(placeParam)
        ? placeParam
        : undefined,
    near:
      located.state === "found"
        ? { lat: located.lat, lon: located.lon }
        : undefined,
  });

  return (
    <>
      <h2 className="mb-4 text-[20px] font-semibold tracking-tight">
        {copy.recommend.resultTitle}
      </h2>
      {picks.length === 0 ? (
        <EmptyState
          icon={<SearchX size={22} />}
          title={copy.recommend.noMatch}
          body={copy.recommend.noMatchHint}
        >
          <Link href="/study" className={buttonStyles.secondary}>
            {copy.recommend.allSpots}
          </Link>
        </EmptyState>
      ) : (
        <ol className="grid gap-3">
          {picks.map(({ room, occupancy, distance }, index) => {
            const place = placeOf(room);
            return (
              <li
                key={room.id}
                className="rounded-(--radius-card) border border-line p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      index === 0 ? "bg-brand text-navy" : "bg-mist text-ink-2"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold">{room.name}</p>
                    <p className="text-[13px] text-ink-2">
                      {place.shortName} · {room.floor}
                      {distance !== null
                        ? ` · ${copy.recommend.away(distance)}`
                        : ""}
                    </p>
                    <div className="mt-2">
                      <OccupancyTag occupancy={occupancy} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 pl-10">
                  <Link
                    href={`/places/${place.id}/${room.id}`}
                    className={`${buttonStyles.secondary} h-10 px-4 text-[14px] whitespace-nowrap`}
                  >
                    <Armchair aria-hidden size={16} />
                    {copy.recommend.openRoom}
                  </Link>
                  <Link
                    href={`/places/${place.id}`}
                    className={`${buttonStyles.quiet} whitespace-nowrap`}
                  >
                    <MapPin aria-hidden size={16} />
                    {copy.common.showOnMap}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-6 flex justify-center">
        <Link href={BASE} className={buttonStyles.quiet}>
          <RotateCcw aria-hidden size={16} />
          {copy.recommend.startOver}
        </Link>
      </div>
    </>
  );
}
