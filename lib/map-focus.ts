import type { PlaceId } from "@/data/types";
import {
  bookableRooms,
  events,
  getRoom,
  isCategoryId,
  isPlaceId,
  places,
  studyPlaces,
} from "./data/catalog";

export interface MapFocus {
  selected: PlaceId | null;
  /** Places to keep bright. `null` keeps every place bright. */
  highlighted: PlaceId[] | null;
  showRoute: boolean;
}

const unique = (ids: PlaceId[]) => [...new Set(ids)];

/** What the campus shows for a URL. The URL is the only source, so back and links just work. */
export function mapFocus(pathname: string, params: URLSearchParams): MapFocus {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "places" && parts[1] && isPlaceId(parts[1])) {
    return { selected: parts[1], highlighted: null, showRoute: true };
  }
  if (parts[0] === "book" && parts[1] && parts[1] !== "sent") {
    const room = getRoom(parts[1]);
    if (room)
      return { selected: room.placeId, highlighted: null, showRoute: true };
  }
  if (parts.length === 0) {
    const category = params.get("category");
    if (isCategoryId(category)) {
      return {
        selected: null,
        highlighted: places
          .filter((place) => place.categories.includes(category))
          .map((place) => place.id),
        showRoute: false,
      };
    }
  }
  if (parts[0] === "study") {
    return {
      selected: null,
      highlighted: studyPlaces.map((place) => place.id),
      showRoute: false,
    };
  }
  if (parts[0] === "book" || parts[0] === "booking") {
    return {
      selected: null,
      highlighted: unique(bookableRooms.map((room) => room.placeId)),
      showRoute: false,
    };
  }
  if (parts[0] === "events") {
    return {
      selected: null,
      highlighted: unique(events.map((event) => event.placeId)),
      showRoute: false,
    };
  }
  return { selected: null, highlighted: null, showRoute: false };
}
