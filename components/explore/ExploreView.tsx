"use client";

import { Armchair, CalendarDays, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlaceStatus } from "@/components/places/PlaceStatus";
import {
  ChipLink,
  EmptyState,
  IconTile,
  RowLink,
  Section,
} from "@/components/ui/basics";
import { Notices } from "@/components/ui/Notices";
import { PlaceIcon } from "@/components/ui/PlaceIcon";
import {
  CATEGORIES,
  isCategoryId,
  noticesFor,
  placeOf,
  places,
} from "@/lib/data/catalog";
import { copy } from "@/lib/copy";
import { searchCampus } from "@/lib/search";

const TASKS = [
  {
    href: "/study",
    title: copy.explore.taskStudy,
    hint: copy.explore.taskStudyHint,
    Icon: Armchair,
  },
  {
    href: "/book",
    title: copy.explore.taskBook,
    hint: copy.explore.taskBookHint,
    Icon: CalendarDays,
  },
  {
    href: "/events",
    title: copy.explore.taskEvents,
    hint: copy.explore.taskEventsHint,
    Icon: Sparkles,
  },
];

export function ExploreView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const category = params.get("category");
  const activeCategory = isCategoryId(category) ? category : null;

  function updateQuery(next: string) {
    setQuery(next);
    const search = new URLSearchParams();
    if (next.trim()) search.set("q", next);
    else if (activeCategory) search.set("category", activeCategory);
    const qs = search.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const results = searchCampus(query);
  const searching = query.trim().length > 0;
  const listed = activeCategory
    ? places.filter((place) => place.categories.includes(activeCategory))
    : places;

  return (
    <>
      <div
        data-drag
        className="sticky top-0 z-10 touch-none bg-paper/95 px-5 pt-1 pb-3 backdrop-blur lg:pt-5"
      >
        <h1 className="sr-only">{copy.nav.explore}</h1>
        <label className="relative block">
          <span className="sr-only">{copy.explore.searchLabel}</span>
          <Search
            aria-hidden
            size={18}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-2"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={copy.explore.searchPlaceholder}
            className="h-12 w-full rounded-full bg-mist pr-11 pl-11 text-[15px] placeholder:text-ink-2 focus:bg-paper focus:ring-2 focus:ring-brand focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => updateQuery("")}
              aria-label={copy.explore.clearSearch}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-2 hover:bg-line"
            >
              <X aria-hidden size={16} />
            </button>
          ) : null}
        </label>
        {searching ? null : (
          <nav
            aria-label={copy.explore.categories}
            className="-mx-5 mt-3 scrollbar-none flex gap-2 overflow-x-auto px-5"
          >
            {CATEGORIES.map(({ id, label }) => (
              <ChipLink
                key={id}
                href={activeCategory === id ? "/" : `/?category=${id}`}
                replace
                scroll={false}
                active={activeCategory === id}
              >
                {label}
              </ChipLink>
            ))}
          </nav>
        )}
      </div>

      {searching ? (
        <SearchResults query={query} results={results} />
      ) : (
        <>
          {activeCategory ? null : <Notices notices={noticesFor(null)} />}
          {activeCategory ? null : (
            <Section title={copy.explore.tasksTitle}>
              <ul role="list" className="grid gap-2">
                {TASKS.map(({ href, title, hint, Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition-colors hover:border-ink-3"
                    >
                      <IconTile tone="brand">
                        <Icon size={20} strokeWidth={1.8} />
                      </IconTile>
                      <span>
                        <span className="block text-[15px] font-semibold">
                          {title}
                        </span>
                        <span className="block text-[13px] text-ink-2">
                          {hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section
            title={
              activeCategory
                ? copy.explore.count(listed.length)
                : copy.explore.allPlaces
            }
          >
            <ul role="list">
              {listed.map((place) => (
                <li key={place.id}>
                  <RowLink
                    href={`/places/${place.id}`}
                    title={place.name}
                    subtitle={<PlaceStatus placeId={place.id} />}
                    leading={
                      <IconTile>
                        <PlaceIcon id={place.id} />
                      </IconTile>
                    }
                  />
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}

function SearchResults({
  query,
  results,
}: {
  query: string;
  results: ReturnType<typeof searchCampus>;
}) {
  if (results.places.length === 0 && results.rooms.length === 0) {
    return (
      <EmptyState
        icon={<Search size={22} />}
        title={copy.explore.noResults(query.trim())}
        body={copy.explore.noResultsHint}
      />
    );
  }
  return (
    <>
      {results.places.length > 0 ? (
        <Section title={copy.explore.places}>
          <ul role="list">
            {results.places.map((place) => (
              <li key={place.id}>
                <RowLink
                  href={`/places/${place.id}`}
                  title={place.name}
                  subtitle={<PlaceStatus placeId={place.id} />}
                  leading={
                    <IconTile>
                      <PlaceIcon id={place.id} />
                    </IconTile>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {results.rooms.length > 0 ? (
        <Section title={copy.explore.rooms}>
          <ul role="list">
            {results.rooms.map((room) => (
              <li key={room.id}>
                <RowLink
                  href={`/places/${room.placeId}/${room.id}`}
                  title={room.name}
                  subtitle={`${placeOf(room).shortName} · ${copy.roomType[room.type]} · ${copy.common.seats(room.seats)}`}
                  leading={
                    <IconTile>
                      <PlaceIcon id={room.placeId} />
                    </IconTile>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
