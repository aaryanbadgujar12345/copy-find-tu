import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreView />
    </Suspense>
  );
}
