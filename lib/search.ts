import type { Place, Room } from "@/data/types";
import { placeOf, places, rooms } from "./data/catalog";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matches(haystack: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const text = normalize(haystack);
  return words.length > 0 && words.every((word) => text.includes(word));
}

export interface SearchResults {
  places: Place[];
  rooms: Room[];
}

export function searchCampus(query: string): SearchResults {
  const q = query.trim();
  if (!q) return { places: [], rooms: [] };
  return {
    places: places.filter((place) =>
      matches([place.name, place.shortName, ...place.searchTerms].join(" "), q),
    ),
    rooms: rooms.filter((room) =>
      matches(
        [
          room.name,
          room.type,
          placeOf(room).shortName,
          placeOf(room).name,
        ].join(" "),
        q,
      ),
    ),
  };
}
