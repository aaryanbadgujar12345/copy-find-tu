import { events, faq, notices } from "@/data/content";
import { getPlace, isPlaceId, places } from "@/data/places";
import { bookableRooms, getRoom, rooms, roomsIn } from "@/data/rooms";
import type { CategoryId, Place, PlaceId, Room } from "@/data/types";

export {
  bookableRooms,
  events,
  faq,
  getPlace,
  getRoom,
  isPlaceId,
  places,
  rooms,
  roomsIn,
};

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "getting-here", label: "Getting here" },
  { id: "study", label: "Study spots" },
  { id: "eat", label: "Eat and drink" },
  { id: "campus-life", label: "Campus life" },
  { id: "services", label: "Help and services" },
];

export function isCategoryId(value: string | null): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export const studyPlaces: Place[] = places.filter(
  (place) => roomsIn(place.id).length > 0,
);

export function placeOf(room: Room): Place {
  const place = getPlace(room.placeId);
  if (!place) throw new Error(`Room ${room.id} has no place ${room.placeId}`);
  return place;
}

export function noticesFor(placeId: PlaceId | null) {
  return notices.filter((notice) => notice.placeId === placeId);
}

export function eventsAt(placeId: PlaceId) {
  return events.filter((event) => event.placeId === placeId);
}

export { faq as faqGroups };
