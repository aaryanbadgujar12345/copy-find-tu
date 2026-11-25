import type { Room } from "@/data/types";
import { copy } from "@/lib/copy";
import { seeded } from "@/lib/seeded";

const PALETTE = {
  silent: { wall: "#e7f1ec", floor: "#d6e6dd", accent: "#8dbfa4" },
  group: { wall: "#fff2df", floor: "#f6e2c4", accent: "#e6a85a" },
  computer: { wall: "#e5f2f8", floor: "#d1e7f1", accent: "#3fa7c9" },
};

/** An illustration standing in for a room photo. */
export function RoomArt({
  room,
  className = "",
}: {
  room: Room;
  className?: string;
}) {
  const colors = PALETTE[room.type];
  const rows = room.type === "group" ? 2 : 3;
  const perRow = room.type === "group" ? 2 : 4;
  const shift = seeded(room.id) * 40;

  return (
    <svg
      viewBox="0 0 400 220"
      role="img"
      aria-label={copy.room.photo(room.name)}
      className={`block w-full rounded-(--radius-card) ${className}`}
    >
      <rect width="400" height="220" fill={colors.wall} />
      {room.facilities.daylight
        ? [0, 1, 2].map((i) => (
            <rect
              key={i}
              x={40 + i * 120 + shift / 3}
              y="22"
              width="84"
              height="64"
              rx="4"
              fill="#ffffff"
              opacity="0.85"
            />
          ))
        : null}
      <path d="M0 120 L400 120 L400 220 L0 220 Z" fill={colors.floor} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: perRow }).map((__, c) => {
          const width = room.type === "group" ? 120 : 64;
          const gap = room.type === "group" ? 60 : 24;
          const totalWidth = perRow * width + (perRow - 1) * gap;
          const x = (400 - totalWidth) / 2 + c * (width + gap);
          const y = 128 + r * (room.type === "group" ? 44 : 30);
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x}
                y={y}
                width={width}
                height="10"
                rx="3"
                fill="#ffffff"
              />
              <rect
                x={x + 4}
                y={y + 10}
                width="3"
                height="12"
                fill={colors.accent}
                opacity="0.5"
              />
              <rect
                x={x + width - 7}
                y={y + 10}
                width="3"
                height="12"
                fill={colors.accent}
                opacity="0.5"
              />
              {room.type === "computer" ? (
                <rect
                  x={x + width / 2 - 14}
                  y={y - 18}
                  width="28"
                  height="18"
                  rx="2"
                  fill={colors.accent}
                />
              ) : (
                <circle
                  cx={x + width / 2}
                  cy={y - 6}
                  r="6"
                  fill={colors.accent}
                  opacity="0.85"
                />
              )}
            </g>
          );
        }),
      )}
      {room.facilities.whiteboard ? (
        <rect
          x="300"
          y="40"
          width="70"
          height="44"
          rx="3"
          fill="#ffffff"
          stroke={colors.accent}
          strokeWidth="2"
        />
      ) : null}
    </svg>
  );
}
