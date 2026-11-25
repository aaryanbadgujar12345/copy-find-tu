"use client";

import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { campusGeo } from "@/lib/geo";
import type { MapFocus } from "@/lib/map-focus";
import { getUi, useUi } from "@/lib/ui-store";
import { prefersReducedMotion } from "./scene";

const { ACTION } = CameraControlsImpl;
const OVERVIEW_DISTANCE = 1500;
const PLACE_DISTANCE = 560;

/** Narrow screens see less sideways, so the camera steps back to fit the campus. */
function fit(distance: number, width: number, height: number): number {
  const aspect = width / Math.max(1, height);
  return aspect < 1
    ? distance * Math.min(1.7, 1 / Math.sqrt(aspect))
    : distance;
}
const TILT_3D = 0.9;

function center(): THREE.Vector3 {
  const { min, max } = campusGeo.bounds;
  return new THREE.Vector3((min[0] + max[0]) / 2, 0, (min[1] + max[1]) / 2);
}

export function CameraRig({ focus }: { focus: MapFocus }) {
  const controls = useRef<CameraControlsImpl>(null);
  const view = useUi((state) => state.view);
  const recenter = useUi((state) => state.recenter);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);
  const lastOffset = useRef("");
  const animate = !prefersReducedMotion();

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const { min, max } = campusGeo.bounds;
    const inset = 220;
    c.setBoundary(
      new THREE.Box3(
        new THREE.Vector3(min[0] + inset, 0, min[1] + inset),
        new THREE.Vector3(max[0] - inset, 80, max[1] - inset),
      ),
    );
    c.boundaryFriction = 0.2;
    c.minDistance = 140;
    c.maxDistance = 2400;
    c.dollyToCursor = true;
    c.smoothTime = 0.35;
    c.mouseButtons.left = ACTION.SCREEN_PAN;
    c.mouseButtons.right = ACTION.ROTATE;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_SCREEN_PAN;
    c.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
    c.touches.three = ACTION.TOUCH_ROTATE;
    const target = center();
    const distance = fit(
      OVERVIEW_DISTANCE,
      window.innerWidth,
      window.innerHeight,
    );
    void c.setLookAt(
      target.x + 260,
      distance * 0.6,
      target.z + distance * 0.85,
      target.x,
      0,
      target.z,
      false,
    );
  }, []);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (view === "2d") {
      c.minPolarAngle = 0;
      c.maxPolarAngle = 0.0001;
      c.minAzimuthAngle = 0;
      c.maxAzimuthAngle = 0;
      void c.rotateTo(0, 0, animate);
    } else {
      c.minPolarAngle = 0;
      c.maxPolarAngle = 1.2;
      c.minAzimuthAngle = -Infinity;
      c.maxAzimuthAngle = Infinity;
      void c.rotatePolarTo(TILT_3D, animate);
    }
  }, [view, animate]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const geo = focus.selected ? campusGeo.places[focus.selected] : null;
    if (geo && !geo.offscene) {
      void c.moveTo(geo.anchor[0], geo.height * 0.3, geo.anchor[1], animate);
      const distance = fit(PLACE_DISTANCE, size.width, size.height);
      if (c.distance > distance) void c.dollyTo(distance, animate);
    }
    // Only a new selection moves the camera, not a resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.selected, animate]);

  useEffect(() => {
    const c = controls.current;
    if (!c || recenter === 0) return;
    const target = center();
    void c.moveTo(target.x, 0, target.z, animate);
    void c.dollyTo(fit(OVERVIEW_DISTANCE, size.width, size.height), animate);
    if (getUi().view === "3d") void c.rotatePolarTo(TILT_3D, animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenter, animate]);

  useFrame(() => {
    const { insets } = getUi();
    const key = `${size.width}x${size.height}:${insets.left}:${insets.bottom}`;
    if (key === lastOffset.current) return;
    lastOffset.current = key;
    const shiftX = -Math.min(insets.left, size.width * 0.6) / 2;
    const shiftY = Math.min(insets.bottom, size.height * 0.7) / 2;
    camera.setViewOffset(
      size.width,
      size.height,
      shiftX,
      shiftY,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
  });

  return <CameraControls ref={controls} makeDefault />;
}
