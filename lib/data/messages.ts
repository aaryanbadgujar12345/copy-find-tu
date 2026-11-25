import { latency, newId, readStored, shouldFail, writeStored } from "./storage";

interface Stored {
  id: string;
  at: number;
}

async function save<T extends object>(
  key: string,
  area: string,
  value: T,
): Promise<{ ok: boolean }> {
  await latency(600);
  if (shouldFail(area)) return { ok: false };
  const list = readStored<(T & Stored)[]>(key, []);
  writeStored(key, [...list, { ...value, id: newId(), at: Date.now() }]);
  return { ok: true };
}

export function sendContact(message: {
  name: string;
  email: string;
  message: string;
}) {
  return save("contact", "contact", message);
}

export function sendFeedback(feedback: { rating: number; comment: string }) {
  return save("feedback", "feedback", feedback);
}

export function rateRoom(rating: {
  roomId: string;
  stars: number;
  comment: string;
}) {
  return save("ratings", "rating", rating);
}
