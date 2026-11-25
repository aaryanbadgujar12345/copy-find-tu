import type { CampusEvent, FaqGroup, Notice } from "./types";

const t = (hours: number, minutes = 0) => hours * 60 + minutes;
const placeholderLink = "https://www.tudelft.nl/en/";

export const events: CampusEvent[] = [
  {
    id: "welcome-drinks",
    title: "International welcome drinks",
    placeId: "aula",
    dayOffset: 1,
    start: t(17),
    end: t(19),
    summary:
      "Meet other new students over drinks and snacks. No sign-up needed.",
    link: placeholderLink,
    tone: "cyan",
  },
  {
    id: "open-gym",
    title: "Open gym evening",
    placeId: "x",
    dayOffset: 2,
    start: t(19),
    end: t(21, 30),
    summary:
      "Try the courts and the gym for free, with trainers around to help.",
    link: placeholderLink,
    tone: "orange",
  },
  {
    id: "museum-night",
    title: "Late night at the Science Centre",
    placeId: "science-centre",
    dayOffset: 4,
    start: t(18),
    end: t(22),
    summary: "The exhibitions stay open late, with short talks by researchers.",
    link: placeholderLink,
    tone: "violet",
  },
  {
    id: "garden-walk",
    title: "Greenhouse walk",
    placeId: "botanical-garden",
    dayOffset: 6,
    start: t(12, 30),
    end: t(13, 15),
    summary: "A short guided lunch walk through the tropical greenhouse.",
    link: placeholderLink,
    tone: "green",
  },
  {
    id: "picnic",
    title: "Picnic in the park",
    placeId: "mekelpark",
    dayOffset: 9,
    start: t(12),
    end: t(14),
    summary:
      "Bring lunch, meet your study association, play a round of frisbee.",
    link: placeholderLink,
    tone: "green",
  },
  {
    id: "study-skills",
    title: "Study skills workshop",
    placeId: "library",
    dayOffset: 11,
    start: t(15),
    end: t(16, 30),
    summary: "Plan your exam weeks and find the study spot that suits you.",
    link: placeholderLink,
    tone: "cyan",
  },
  {
    id: "culture-night",
    title: "Culture night",
    placeId: "x",
    dayOffset: 16,
    start: t(20),
    end: t(23),
    summary: "Bands, dance and theatre by student groups, on three stages.",
    link: placeholderLink,
    tone: "violet",
  },
];

export const notices: Notice[] = [
  {
    id: "mekelweg-works",
    kind: "warning",
    placeId: null,
    title: "Works on Mekelweg",
    body: "Part of the cycle path is closed this week. Follow the signs.",
  },
  {
    id: "library-exam-hours",
    kind: "notice",
    placeId: "library",
    title: "Longer hours in exam weeks",
    body: "The study hall stays open until 01:00 during exams.",
  },
  {
    id: "pulse-lift",
    kind: "warning",
    placeId: "pulse",
    title: "Lift out of order",
    body: "The lift to the 2nd floor is being repaired. Ask the desk for help.",
  },
];

export const faq: FaqGroup[] = [
  {
    title: "Study spots",
    items: [
      {
        question: "How do you know how busy a room is?",
        answer:
          "Sensors count free seats in most rooms. Rooms without a sensor show no number, so you'll have to look for yourself.",
      },
      {
        question: "What do quiet, busy and full mean?",
        answer:
          "Quiet is under half the seats taken, busy is under 80%, full is 80% or more.",
      },
      {
        question: "Can I eat in study rooms?",
        answer:
          "Drinks with a lid are fine. Eat in the canteens and cafés, so the study rooms stay clean.",
      },
    ],
  },
  {
    title: "Booking a room",
    items: [
      {
        question: "Who can book a project room?",
        answer:
          "Anyone with a TU Delft email address. You confirm each booking with the link we email you.",
      },
      {
        question: "How long can I book a room for?",
        answer:
          "Up to two hours at a time, up to two weeks ahead. Some rooms have shorter limits, shown when you book.",
      },
      {
        question: "How do I cancel?",
        answer:
          "Use the cancel link in your confirmation email. Cancel early, so someone else can use the room.",
      },
    ],
  },
  {
    title: "Getting around",
    items: [
      {
        question: "How do I get to campus?",
        answer:
          "Tram 19 runs from Delft Centraal to campus. By bike it's about ten minutes along the canal.",
      },
      {
        question: "Where do I get my campus card?",
        answer:
          "At the Student and Campus Services desk. Bring your passport or ID.",
      },
    ],
  },
];
