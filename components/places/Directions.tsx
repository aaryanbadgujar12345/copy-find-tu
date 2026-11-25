"use client";

import { Navigation, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/basics";
import type { PlaceId } from "@/data/types";
import { copy } from "@/lib/copy";
import {
  directionsUrl,
  inScene,
  legTo,
  sceneOf,
  startNavigation,
  stopNavigation,
  useNav,
} from "@/lib/navigation";

/** Guide the student from where they are to this place. */
export function Directions({ placeId }: { placeId: PlaceId }) {
  const nav = useNav((state) => state);
  const mine = nav.target === placeId;
  const position = mine ? nav.position : null;
  const route = mine ? nav.route : null;
  const leg = position ? legTo(position, placeId, route) : null;
  const far = position ? !inScene(sceneOf(position)) : false;

  return (
    <div className="mt-4 grid gap-3">
      {!mine || nav.status === "idle" ? (
        <button
          type="button"
          onClick={() => startNavigation(placeId)}
          className={buttonStyles.primary}
        >
          <Navigation aria-hidden size={18} />
          {copy.directions.start}
        </button>
      ) : null}

      <div aria-live="polite" className="grid gap-2 empty:hidden">
        {mine && nav.status === "locating" ? (
          <p className="text-[14px] text-ink-2">{copy.directions.locating}</p>
        ) : null}
        {mine && nav.status === "denied" ? (
          <p className="rounded-2xl bg-warning-soft p-3 text-[14px] leading-5 text-warning-ink">
            {copy.directions.denied}
          </p>
        ) : null}
        {mine && nav.status === "unavailable" ? (
          <p className="rounded-2xl bg-warning-soft p-3 text-[14px] leading-5 text-warning-ink">
            {copy.directions.unavailable}
          </p>
        ) : null}
        {leg && position ? (
          <div className="rounded-2xl bg-brand-soft p-4">
            <p className="text-[17px] font-semibold text-navy">
              {leg.arrived
                ? copy.directions.arrived
                : `${copy.directions.away(leg.metres)}, ${copy.directions.walk(leg.minutes)}`}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-ink-2">
              {far
                ? copy.directions.farAway
                : route
                  ? copy.directions.routeNote
                  : nav.routing === "finding"
                    ? copy.directions.finding
                    : copy.directions.lineNote}
            </p>
            {position.accuracy >= 1 ? (
              <p className="mt-1 text-[12px] text-ink-2">
                {copy.directions.accuracy(position.accuracy)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <a
          href={directionsUrl(placeId, position)}
          target="_blank"
          rel="noreferrer"
          className={
            mine && nav.status !== "idle"
              ? buttonStyles.primary
              : `${buttonStyles.quiet} justify-self-start`
          }
        >
          {copy.directions.openRoute}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {mine && nav.status !== "idle" ? (
          <button
            type="button"
            onClick={stopNavigation}
            className={buttonStyles.secondary}
          >
            <X aria-hidden size={16} />
            {copy.directions.stop}
          </button>
        ) : null}
      </div>
    </div>
  );
}
