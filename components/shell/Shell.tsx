"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { CampusStage } from "@/components/campus/CampusStage";
import { MapControls } from "@/components/campus/MapControls";
import { Rail, TabBar } from "./Nav";
import { Panel } from "./Panel";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden">
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
