"use client";

import dynamic from "next/dynamic";

const CampusCanvas = dynamic(() => import("./CampusCanvas"), {
  ssr: false,
  loading: () => null,
});

export function CampusStage() {
  return (
    <div className="absolute inset-0 isolate">
      <CampusCanvas />
    </div>
  );
}
