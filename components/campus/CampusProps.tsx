"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { campusGeo } from "@/lib/geo";
import type { MapFocus } from "@/lib/map-focus";
import { prefersReducedMotion, SCENE_COLORS, toVector } from "./scene";

export function Trees() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const trees = campusGeo.trees;
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    trees.forEach(([x, z], index) => {
      const size = 2.6 + ((index * 37) % 10) / 6;
      matrix.compose(
        new THREE.Vector3(x, size * 1.6, z),
        new THREE.Quaternion(),
        new THREE.Vector3(size, size * 1.15, size),
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [trees]);

  if (trees.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, trees.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={SCENE_COLORS.tree}
        roughness={1}
        flatShading
      />
    </instancedMesh>
  );
}

export function TramLine() {
  return (
    <>
      {campusGeo.tramLine.map((segment, index) => (
        <Line
          key={index}
          points={segment.map((point) => toVector(point, 0.4))}
          color={SCENE_COLORS.tram}
          lineWidth={2}
          dashed
          dashSize={6}
          gapSize={4}
        />
      ))}
    </>
  );
}

export function WalkingRoute({ focus }: { focus: MapFocus }) {
  const lineRef = useRef<{ material: { dashOffset: number } } | null>(null);
  const route =
    focus.selected && focus.showRoute
      ? campusGeo.routes[focus.selected]
      : undefined;
  const points = useMemo(
    () => route?.map((point) => toVector(point, 1.2)) ?? [],
    [route],
  );
  const still = useMemo(() => prefersReducedMotion(), []);

  useFrame((_, delta) => {
    if (!still && lineRef.current)
      lineRef.current.material.dashOffset -= delta * 14;
  });

  if (points.length < 2) return null;
  const start = points[0];
  return (
    <>
      <Line
        ref={lineRef as never}
        points={points}
        color={SCENE_COLORS.route}
        lineWidth={5}
        dashed
        dashSize={7}
        gapSize={4}
      />
      <mesh position={[start.x, 1.4, start.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 24]} />
        <meshBasicMaterial color={SCENE_COLORS.route} />
      </mesh>
    </>
  );
}

export function BikeRacks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const racks = campusGeo.bikeParking;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    racks.forEach(([x, z], index) => {
      matrix.makeTranslation(x, 0.5, z);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [racks]);
  if (racks.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, racks.length]}
      receiveShadow
    >
      <boxGeometry args={[3, 1, 1.2]} />
      <meshStandardMaterial color="#c9ced3" roughness={1} />
    </instancedMesh>
  );
}

export function AreaHighlight({ focus }: { focus: MapFocus }) {
  const area = focus.selected ? campusGeo.places[focus.selected]?.area : null;
  const shape = useMemo(() => {
    if (!area || area.length < 3) return null;
    return new THREE.Shape(area.map(([x, z]) => new THREE.Vector2(x, -z)));
  }, [area]);
  if (!area || !shape) return null;
  const outline = [...area, area[0]].map((point) => toVector(point, 0.6));
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial
          color={SCENE_COLORS.selected}
          transparent
          opacity={0.22}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={outline} color={SCENE_COLORS.selected} lineWidth={3} />
    </>
  );
}

/** The TU Delft campus: a tinted ground and its outline, so you can see where it starts and ends. */
export function CampusArea() {
  const ring = campusGeo.campus;
  const shape = useMemo(() => {
    if (!ring || ring.length < 3) return null;
    return new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  }, [ring]);
  const outline = useMemo(
    () => (ring ? [...ring, ring[0]].map((point) => toVector(point, 0.7)) : []),
    [ring],
  );
  if (!shape) return null;
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
        renderOrder={0}
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={SCENE_COLORS.campusGround}
          roughness={1}
          polygonOffset
          polygonOffsetFactor={-0.5}
        />
      </mesh>
      <Line
        points={outline}
        color={SCENE_COLORS.campusOutline}
        lineWidth={2.5}
        dashed
        dashSize={10}
        gapSize={6}
        transparent
        opacity={0.85}
      />
    </>
  );
}
