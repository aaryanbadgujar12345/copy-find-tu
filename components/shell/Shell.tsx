"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { CampusStage } from "@/components/campus/CampusStage";
import { MapControls } from "@/components/campus/MapControls";
import { Rail, TabBar } from "./Nav";
import { Panel } from "./Panel";
import { copy } from "@/lib/copy";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-navy px-4 py-2 text-[14px] font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {copy.skipToContent}
      </a>
      <Suspense fallback={null}>
        <CampusStage />
      </Suspense>
      <MapControls />
      <Rail />
      <Panel>{children}</Panel>
      <TabBar />
    </div>
  );
}
