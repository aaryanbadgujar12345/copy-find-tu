"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { geoOf } from "@/lib/geo";
import { inScene, sceneOf, useNav } from "@/lib/navigation";
import { prefersReducedMotion, SCENE_COLORS, toVector } from "./scene";

/** The student's position and a line from it to the place they're heading to. */
export function NavigationLayer() {
  const target = useNav((nav) => nav.target);
  const position = useNav((nav) => nav.position);
  const route = useNav((nav) => nav.route);
  const ring = useRef<THREE.Mesh>(null);
  const still = useMemo(() => prefersReducedMotion(), []);

  const you = position ? sceneOf(position) : null;
  const visible = you && inScene(you);
  const goal = target ? geoOf(target) : null;

  useFrame(({ clock }) => {
    if (!ring.current || still) return;
    const t = (clock.elapsedTime % 1.8) / 1.8;
    ring.current.scale.setScalar(1 + t * 1.6);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - t);
  });

  if (!you || !visible || !position) return null;
  const accuracy = Math.min(Math.max(position.accuracy, 6), 120);

  return (
    <group>
      {route ? (
        <>
          <Line
            points={route.points.map((point) => toVector(point, 2))}
            color={SCENE_COLORS.you}
            lineWidth={6}
            transparent
            opacity={0.3}
            depthTest={false}
            renderOrder={10}
          />
          <Line
            points={route.points.map((point) => toVector(point, 2))}
            color={SCENE_COLORS.you}
            lineWidth={6}
          />
        </>
      ) : goal && !goal.offscene ? (
        <Line
          points={[toVector(you, 1.6), toVector(goal.anchor, 1.6)]}
          color={SCENE_COLORS.you}
          lineWidth={3}
          dashed
          dashSize={8}
          gapSize={5}
          transparent
          opacity={0.6}
        />
      ) : null}
      <mesh
        renderOrder={20}
        position={[you[0], 0.9, you[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[accuracy, 40]} />
        <meshBasicMaterial
          color={SCENE_COLORS.you}
          transparent
          opacity={0.12}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh
        ref={ring}
        renderOrder={21}
        position={[you[0], 1.0, you[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[7, 9.5, 40]} />
        <meshBasicMaterial
          color={SCENE_COLORS.you}
          transparent
          opacity={0.35}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh
        renderOrder={22}
        position={[you[0], 1.2, you[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[7, 32]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>
      <mesh
        renderOrder={23}
        position={[you[0], 1.4, you[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial color={SCENE_COLORS.you} depthTest={false} />
      </mesh>
    </group>
  );
}
