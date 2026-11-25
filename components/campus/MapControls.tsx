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
    <>
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
      <p className="pointer-events-none fixed top-[max(12px,env(safe-area-inset-top))] left-3 z-20 text-[10px] text-ink-2/80 lg:top-auto lg:right-3 lg:bottom-2 lg:left-auto">
        {campusGeo.attribution.join(" · ")}
      </p>
    </>
  );
}
