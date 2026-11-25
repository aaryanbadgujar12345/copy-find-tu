"use client";

import { Canvas } from "@react-three/fiber";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useCampusTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { campusGeo } from "@/lib/geo";
import { mapFocus } from "@/lib/map-focus";
import { CameraRig } from "./CameraRig";
import { LabelLayer, LabelProjector } from "./CampusLabels";
import { NavigationLayer } from "./NavigationLayer";
import { CampusModel } from "./CampusModel";
import {
  AreaHighlight,
  BikeRacks,
  CampusArea,
  TramLine,
  Trees,
  WalkingRoute,
} from "./CampusProps";
import { installEdgeFade, SCENE_COLORS } from "./scene";

installEdgeFade();

function NoWebgl() {
  return (
    <div className="flex h-full items-start justify-center pt-24 lg:items-center lg:pt-0 lg:pl-[492px]">
      <p className="max-w-64 text-center text-[14px] text-ink-2">
        {copy.campus.noWebgl}
      </p>
    </div>
  );
}

export default function CampusCanvas() {
  const pathname = usePathname();
  const params = useSearchParams();
  const time = useCampusTime();
  const focus = useMemo(
    () => mapFocus(pathname, new URLSearchParams(params.toString())),
    [pathname, params],
  );
  const { min, max } = campusGeo.bounds;
  const span = Math.max(max[0] - min[0], max[1] - min[1]);

  return (
    <section aria-label={copy.campus.label} className="relative h-full w-full">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        fallback={<NoWebgl />}
        camera={{ fov: 30, near: 10, far: 9000, position: [300, 900, 1300] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[SCENE_COLORS.background]} />
        <fog
          attach="fog"
          args={[SCENE_COLORS.background, span * 1.1, span * 2.6]}
        />
        <hemisphereLight args={["#ffffff", "#d9dccf", 1.4]} />
        <directionalLight
          castShadow
          position={[-500, 900, 400]}
          intensity={1.9}
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.6}
          shadow-camera-left={min[0] - 100}
          shadow-camera-right={max[0] + 100}
          shadow-camera-top={-min[1] + 100}
          shadow-camera-bottom={-max[1] - 100}
          shadow-camera-near={10}
          shadow-camera-far={3000}
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.2, 0]}
          receiveShadow
        >
          <planeGeometry args={[span * 6, span * 6]} />
          <meshStandardMaterial color={SCENE_COLORS.background} roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <CampusModel focus={focus} time={time} />
        </Suspense>
        <CampusArea />
        <Trees />
        <BikeRacks />
        <TramLine />
        <WalkingRoute focus={focus} />
        <AreaHighlight focus={focus} />
        <NavigationLayer />
        <LabelProjector />
        <CameraRig focus={focus} />
      </Canvas>
      <LabelLayer focus={focus} time={time} />
    </section>
  );
}
