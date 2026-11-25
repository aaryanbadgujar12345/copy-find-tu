import type { Place, PlaceId, Span, WeekHours } from "./types";

const h = (open: number, close: number): Span => ({
  open: open * 60,
  close: close * 60,
});

const weekdays = (
  span: Span,
  sat: Span | null,
  sun: Span | null,
): WeekHours => [span, span, span, span, span, sat, sun];

export const places: Place[] = [
  {
    id: "library",
    name: "TU Delft Library",
    shortName: "Library",
    categories: ["study", "services"],
    searchTerms: ["library", "bibliotheek", "study", "cone"],
    isFaculty: false,
    summary:
      "The big study hall under the grass roof. Silent floors, group tables, computers and project rooms you can book.",
    address: "Prometheusplein 1",
    hours: weekdays(h(8, 24), h(10, 18), h(10, 18)),
    gettingThere: "Tram 19 to Aula, then two minutes across the square.",
  },
  {
    id: "aula",
    name: "Aula Conference Centre",
    shortName: "Aula",
    categories: ["eat", "campus-life"],
    searchTerms: ["aula", "food court", "lunch", "conference"],
    isFaculty: false,
    summary:
      "The main food court on campus, and the venue for ceremonies, talks and big events.",
    address: "Mekelweg 5",
    hours: weekdays(h(8, 20), null, null),
    gettingThere: "Tram 19 stops right in front: Aula.",
  },
  {
    id: "pulse",
    name: "Pulse",
    shortName: "Pulse",
    categories: ["study"],
    searchTerms: ["pulse", "study", "lecture"],
    isFaculty: false,
    summary:
      "Study and lecture hub, with an open study landscape, a silent floor and bookable project rooms.",
    address: "Landbergstraat 19",
    hours: weekdays(h(8, 22), h(9, 17), null),
    gettingThere: "Tram 19 to Aula, then a short walk west.",
  },
  {
    id: "echo",
    name: "Echo",
    shortName: "Echo",
    categories: ["study"],
    searchTerms: ["echo", "lecture", "study"],
    isFaculty: false,
    summary:
      "Lecture building with study spots between the halls. Busy around lectures, calm in the evening.",
    address: null,
    hours: weekdays(h(8, 21), null, null),
    gettingThere: "Tram 19 to Mekelpark, then a few minutes on foot.",
  },
  {
    id: "eemcs",
    name: "EEMCS (EWI) high-rise",
    shortName: "EEMCS",
    categories: [],
    searchTerms: [
      "ewi",
      "eemcs",
      "faculty",
      "electrical engineering",
      "mathematics",
      "computer science",
    ],
    isFaculty: true,
    summary:
      "Faculty of Electrical Engineering, Mathematics and Computer Science. The tallest building on campus.",
    address: "Mekelweg 4",
    hours: weekdays(h(8, 19), null, null),
    gettingThere: "Tram 19 to Aula, the high-rise is across Mekelweg.",
  },
  {
    id: "flux",
    name: "Flux",
    shortName: "Flux",
    categories: [],
    searchTerms: ["flux", "lecture", "teaching", "building 39", "drebbelweg"],
    isFaculty: false,
    summary:
      "Temporary teaching building behind the EEMCS high-rise, with four large lecture halls for 158 to 192 people.",
    address: "Cornelis Drebbelweg",
    hours: "unlisted",
    gettingThere:
      "Tram 19 to Aula, then walk past the EEMCS high-rise to Cornelis Drebbelweg.",
  },
  {
    id: "bk-city",
    name: "Faculty of Architecture (BK City)",
    shortName: "BK City",
    categories: [],
    searchTerms: ["bk", "bk city", "architecture", "bouwkunde", "faculty"],
    isFaculty: true,
    summary:
      "Faculty of Architecture and the Built Environment, in a historic building at the north end of campus.",
    address: "Julianalaan 134",
    hours: weekdays(h(8, 22), h(9, 17), null),
    gettingThere: "Tram 19 to Julianalaan, then a short walk.",
  },
  {
    id: "x",
    name: "X",
    shortName: "X",
    categories: ["campus-life"],
    searchTerms: ["x", "sports", "gym", "culture", "fitness"],
    isFaculty: false,
    summary:
      "Sports and culture centre: gym, courts, courses and events, all under one roof.",
    address: "Mekelweg 8-10",
    hours: weekdays(h(7, 23), h(9, 20), h(9, 20)),
    gettingThere: "Tram 19 to Berlageweg, then a few minutes on foot.",
  },
  {
    id: "science-centre",
    name: "Science Centre Delft",
    shortName: "Science Centre",
    categories: ["campus-life"],
    searchTerms: ["science centre", "museum", "exhibition"],
    isFaculty: false,
    summary:
      "The university's museum: hands-on exhibitions on TU Delft research, plus workshops and events.",
    address: null,
    hours: [
      null,
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(10, 17),
    ],
    gettingThere: "Tram 19 to Mekelpark, then cross the park.",
  },
  {
    id: "botanical-garden",
    name: "TU Delft Botanical Garden",
    shortName: "Botanical Garden",
    categories: ["campus-life"],
    searchTerms: ["botanical garden", "hortus", "garden", "green"],
    isFaculty: false,
    summary:
      "Greenhouses and gardens to wander through between lectures. Quiet, green and open most days.",
    address: null,
    hours: [
      null,
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(10, 17),
      h(12, 17),
    ],
    gettingThere: "Tram 19 to Julianalaan, then a short walk north.",
  },
  {
    id: "mekelpark",
    name: "Mekelpark",
    shortName: "Mekelpark",
    categories: ["campus-life"],
    searchTerms: ["mekelpark", "park", "meeting point", "outdoor"],
    isFaculty: false,
    summary:
      "The green heart of campus. The tram runs through it, and it's the easiest place to meet people.",
    address: null,
    hours: null,
    gettingThere: "Tram 19 stops in the park: Mekelpark.",
  },
  {
    id: "delft-centraal",
    name: "Delft Centraal",
    shortName: "Delft Centraal",
    categories: ["getting-here"],
    searchTerms: ["station", "train", "bus", "centraal"],
    isFaculty: false,
    summary:
      "Train and bus hub in the city centre. Tram 19 takes you from here to campus.",
    address: "Stationsplein",
    hours: null,
    gettingThere: "Take tram 19 towards campus, or cycle along the canal.",
  },
  {
    id: "tram-19",
    name: "Tram 19 campus stops",
    shortName: "Tram 19",
    categories: ["getting-here"],
    searchTerms: ["tram", "19", "public transport", "stop"],
    isFaculty: false,
    summary:
      "Tram 19 links Delft Centraal with campus. These are the stops on campus.",
    address: null,
    hours: null,
    gettingThere: "Board at Delft Centraal, towards campus.",
  },
  {
    id: "bike-parking",
    name: "Bike parking",
    shortName: "Bike parking",
    categories: ["getting-here"],
    searchTerms: ["bike", "bicycle", "parking", "fiets"],
    isFaculty: false,
    summary:
      "The biggest bike racks are next to the Library and the Aula. Park in the racks, not against buildings.",
    address: null,
    hours: null,
    gettingThere: "Follow the cycle path along Mekelweg.",
  },
  {
    id: "food",
    name: "Faculty canteens and campus cafés",
    shortName: "Canteens and cafés",
    categories: ["eat"],
    searchTerms: ["food", "coffee", "lunch", "canteen", "cafe", "eat"],
    isFaculty: false,
    summary:
      "Coffee, lunch and snacks all over campus. Most faculties have their own canteen.",
    address: null,
    hours: weekdays(h(8, 17), null, null),
    gettingThere: "Spread over campus. Pick one on the map.",
  },
  {
    id: "services-desk",
    name: "Student and Campus Services desk",
    shortName: "Services desk",
    categories: ["services"],
    searchTerms: [
      "services",
      "help",
      "campus card",
      "enrolment",
      "registration",
      "desk",
    ],
    isFaculty: false,
    summary:
      "For your campus card, enrolment questions and general help in your first weeks.",
    address: null,
    hours: weekdays(h(9, 17), null, null),
    gettingThere: "Tram 19 to Aula, then a short walk.",
  },
];

export const placeIds = places.map((place) => place.id);

export function getPlace(id: string): Place | undefined {
  return places.find((place) => place.id === id);
}

export function isPlaceId(id: string): id is PlaceId {
  return placeIds.includes(id as PlaceId);
}
