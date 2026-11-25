import { Building2, CalendarDays, Clock } from "lucide-react";
import type { Room } from "@/data/types";
import { formatLongDay, formatTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { placeOf } from "@/lib/data/catalog";

export function BookingCard({
  room,
  date,
  start,
  end,
}: {
  room: Room;
  date: string;
  start: number;
  end: number;
}) {
  const rows = [
    {
      Icon: Building2,
      label: copy.booking.room,
      value: `${room.name}, ${placeOf(room).shortName}`,
    },
    {
      Icon: CalendarDays,
      label: copy.booking.date,
      value: formatLongDay(date),
    },
    {
      Icon: Clock,
      label: copy.booking.time,
      value: `${formatTime(start)} – ${formatTime(end)}`,
    },
  ];
  return (
    <dl className="grid gap-3 rounded-(--radius-card) border border-line p-4">
      {rows.map(({ Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon aria-hidden size={18} className="shrink-0 text-ink-2" />
          <dt className="sr-only">{label}</dt>
          <dd className="text-[15px]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
