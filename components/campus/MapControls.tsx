"use client";

import { Box, LocateFixed, Square } from "lucide-react";
import { copy } from "@/lib/copy";
import { campusGeo } from "@/lib/geo";
import { getUi, setUi, useUi } from "@/lib/ui-store";

const button =
  "flex size-11 items-center justify-center rounded-full bg-paper text-ink shadow-float transition-colors hover:bg-mist";

export function MapControls() {
  const view = useUi((state) => state.view);
  return (
    <aside aria-label={copy.campus.controls}>
      <div className="fixed top-[max(12px,env(safe-area-inset-top))] right-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          className={button}
          aria-label={view === "3d" ? copy.campus.view2d : copy.campus.view3d}
          onClick={() => setUi({ view: view === "3d" ? "2d" : "3d" })}
        >
          {view === "3d" ? (
            <Square aria-hidden size={18} />
          ) : (
            <Box aria-hidden size={18} />
          )}
        </button>
        <button
          type="button"
          className={button}
          aria-label={copy.campus.recenter}
          onClick={() => setUi({ recenter: getUi().recenter + 1 })}
        >
          <LocateFixed aria-hidden size={18} />
        </button>
      </div>
      <p className="pointer-events-none fixed top-[max(12px,env(safe-area-inset-top))] left-3 z-20 text-[10px] text-ink-2 lg:top-auto lg:right-3 lg:bottom-2 lg:left-auto">
        {campusGeo.attribution.join(" · ")}
      </p>
      <MapKey />
    </aside>
  );
}

function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block shrink-0 ${className}`} />;
}

/** What the colours on the map mean. */
function MapKey() {
  return (
    <div
      role="group"
      aria-label={copy.campus.legend}
      className="pointer-events-none fixed top-[max(32px,calc(env(safe-area-inset-top)+20px))] right-16 left-3 z-20 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-paper/90 px-3 py-2 text-[11px] font-medium text-ink shadow-float backdrop-blur lg:top-auto lg:right-auto lg:bottom-3 lg:left-[516px]"
    >
      <span className="flex items-center gap-1.5">
        <Swatch className="size-3 rounded-[3px] border border-dashed border-brand-deep bg-[#cfe6ef]" />
        {copy.campus.legendCampus}
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="size-3 rounded-[3px] bg-[#dcdedc]" />
        {copy.campus.legendCity}
      </span>
      <span className="flex items-center gap-1.5">
        {copy.campus.legendBusy}:
        <Swatch className="size-2 rounded-full bg-quiet" />
        {copy.occupancy.quiet}
        <Swatch className="size-2 rounded-full bg-busy" />
        {copy.occupancy.busy}
        <Swatch className="size-2 rounded-full bg-full" />
        {copy.occupancy.full}
      </span>
    </div>
  );
}
