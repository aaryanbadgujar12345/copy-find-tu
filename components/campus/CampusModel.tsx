"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { PlaceId } from "@/data/types";
import type { CampusTime } from "@/lib/campus-time";
import { getPlace, roomsIn } from "@/lib/data/catalog";
import type { MapFocus } from "@/lib/map-focus";
import { placeOccupancy } from "@/lib/occupancy";
import { placeIdOfNode, SCENE_COLORS, tint } from "./scene";

export const CAMPUS_URL = "/campus/campus.glb";

const GROUND: Record<string, { color: string; order: number }> = {
  "ground-water": { color: SCENE_COLORS.water, order: 1 },
  "ground-green": { color: SCENE_COLORS.green, order: 2 },
  "ground-roads": { color: SCENE_COLORS.roads, order: 3 },
  "ground-paths": { color: SCENE_COLORS.paths, order: 4 },
};

function buildingMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0,
    flatShading: true,
  });
}

export function CampusModel({
  focus,
  time,
}: {
  focus: MapFocus;
  time: CampusTime | null;
}) {
  const { scene } = useGLTF(CAMPUS_URL);
  const router = useRouter();
  const [hovered, setHovered] = useState<PlaceId | null>(null);

  const placeMaterials = useMemo(() => {
    const materials = new Map<PlaceId, THREE.MeshStandardMaterial>();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.userData.styled) {
        const styledPlace = object.userData.placeId as PlaceId | undefined;
        if (styledPlace)
          materials.set(
            styledPlace,
            object.material as THREE.MeshStandardMaterial,
          );
        return;
      }
      object.userData.styled = true;
      const name = object.name || object.parent?.name || "";
      const ground = Object.entries(GROUND).find(([prefix]) =>
        name.startsWith(prefix),
      );
      if (ground) {
        const [, style] = ground;
        object.material = new THREE.MeshStandardMaterial({
          color: style.color,
          roughness: 1,
          polygonOffset: true,
          polygonOffsetFactor: -style.order,
        });
        object.receiveShadow = true;
        object.renderOrder = style.order;
        return;
      }
      let placeId: PlaceId | null = null;
      for (
        let node: THREE.Object3D | null = object;
        node && !placeId;
        node = node.parent
      ) {
        placeId =
          placeIdOfNode(node.name) ??
          placeIdOfNode(node.name.replace(/_\d+$/, ""));
      }
      if (placeId) {
        const material =
          materials.get(placeId) ?? buildingMaterial(SCENE_COLORS.place);
        materials.set(placeId, material);
        object.material = material;
        object.userData.placeId = placeId;
      } else {
        const onCampus = name.startsWith("context-campus");
        object.material = buildingMaterial(
          onCampus ? SCENE_COLORS.campusBuilding : SCENE_COLORS.context,
        );
        object.userData.onCampus = onCampus;
      }
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return materials;
  }, [scene]);

  useEffect(() => {
    for (const [placeId, material] of placeMaterials) {
      const place = getPlace(placeId);
      let color = new THREE.Color(SCENE_COLORS.place);
      if (focus.selected === placeId) {
        color = new THREE.Color(SCENE_COLORS.selected);
      } else if (focus.highlighted && !focus.highlighted.includes(placeId)) {
        color = new THREE.Color(SCENE_COLORS.dimmed);
      } else if (place && time) {
        const rooms = roomsIn(placeId);
        if (rooms.length > 0) {
          const occupancy = placeOccupancy(place, rooms, time);
          if (occupancy.state === "open") color = tint(occupancy.level);
        }
      }
      if (hovered === placeId && focus.selected !== placeId) {
        color.lerp(new THREE.Color(SCENE_COLORS.selected), 0.35);
      }
      material.color.copy(color);
    }
  }, [focus, time, hovered, placeMaterials]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  function placeFromEvent(
    event: ThreeEvent<PointerEvent | MouseEvent>,
  ): PlaceId | null {
    const hit = event.intersections.find(
      (intersection) => intersection.object.userData.placeId,
    );
    return (hit?.object.userData.placeId as PlaceId | undefined) ?? null;
  }

  return (
    <primitive
      object={scene}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        const id = placeFromEvent(event);
        if (id !== hovered) setHovered(id);
      }}
      onPointerOut={() => setHovered(null)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (event.delta > 6) return;
        const id = placeFromEvent(event);
        if (id) {
          event.stopPropagation();
          router.push(`/places/${id}`);
        }
      }}
    />
  );
}

useGLTF.preload(CAMPUS_URL);
