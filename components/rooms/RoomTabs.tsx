"use client";

import type { LucideIcon } from "lucide-react";
import { Coffee, Monitor, Plug, Presentation, Sun, Toilet } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import type { Room } from "@/data/types";
import { copy } from "@/lib/copy";

type Tab = "facilities" | "directions";
const TABS: { id: Tab; label: string }[] = [
  { id: "facilities", label: copy.room.facilitiesTab },
  { id: "directions", label: copy.room.directionsTab },
];

function facilityList(room: Room): { Icon: LucideIcon; label: string }[] {
  const { facilities } = room;
  const list: { Icon: LucideIcon; label: string }[] = [];
  if (facilities.sockets > 0)
    list.push({
      Icon: Plug,
      label: copy.facilities.sockets(facilities.sockets),
    });
  if (facilities.daylight)
    list.push({ Icon: Sun, label: copy.facilities.daylight });
  if (facilities.whiteboard)
    list.push({ Icon: Presentation, label: copy.facilities.whiteboard });
  if (facilities.monitor)
    list.push({ Icon: Monitor, label: copy.facilities.monitor });
  if (facilities.coffee)
    list.push({ Icon: Coffee, label: copy.facilities.coffee });
  if (facilities.toilet)
    list.push({ Icon: Toilet, label: copy.facilities.toilet });
  return list;
}

export function RoomTabs({ room }: { room: Room }) {
  const [active, setActive] = useState<Tab>("facilities");
  const id = useId();
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({
    facilities: null,
    directions: null,
  });

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next: Tab = active === "facilities" ? "directions" : "facilities";
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={room.name}
        className="flex gap-1 rounded-full bg-mist p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(element) => {
              refs.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${id}-${tab.id}-panel`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={onKeyDown}
            className={`h-9 flex-1 rounded-full text-[14px] font-semibold transition-colors ${
              active === tab.id
                ? "bg-paper text-ink shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-${active}-panel`}
        aria-labelledby={`${id}-${active}`}
        tabIndex={0}
        className="mt-4 focus-visible:outline-offset-4"
      >
        {active === "facilities" ? (
          <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-3">
            {facilityList(room).map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-[14px]">
                <Icon
                  aria-hidden
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0 text-ink-2"
                />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <ol className="grid gap-3">
            {room.directions.map((step, index) => (
              <li key={step} className="flex gap-3 text-[14px] leading-5">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-navy"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
