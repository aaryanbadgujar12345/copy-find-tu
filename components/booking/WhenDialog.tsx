"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/basics";
import { addDays, formatDay, formatTime } from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import { DEFAULT_RULES } from "@/lib/data/bookings";

export interface When {
  date: string;
  from: number;
  to: number;
}

const TIMES = Array.from(
  { length: (23 - 7) * 2 + 1 },
  (_, i) => 7 * 60 + i * 30,
);

export function WhenDialog({
  open,
  today,
  initial,
  onApply,
  onClose,
}: {
  open: boolean;
  today: string;
  initial: When | null;
  onApply: (when: When) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState(initial?.date ?? today);
  const [from, setFrom] = useState(initial?.from ?? 13 * 60);
  const [to, setTo] = useState(initial?.to ?? 15 * 60);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onApply({ date, from, to: Math.max(to, from + 30) });
  }

  const days = Array.from({ length: DEFAULT_RULES.daysAhead + 1 }, (_, i) =>
    addDays(today, i),
  );
  const select =
    "h-12 w-full rounded-xl border border-line bg-paper px-3 text-[15px] focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="when-title"
      className="m-auto w-[min(92vw,420px)] rounded-3xl p-0 shadow-float backdrop:bg-ink/40"
    >
      <form onSubmit={submit} className="grid gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="when-title"
            className="text-[20px] font-semibold tracking-tight"
          >
            {copy.book.whenDialogTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.common.close}
            className="-mt-1 -mr-2 flex size-9 items-center justify-center rounded-full hover:bg-mist"
          >
            <X aria-hidden size={18} />
          </button>
        </div>
        <label className="grid gap-1.5">
          <span className="text-[14px] font-medium">{copy.book.day}</span>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={select}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {formatDay(day, today)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-[14px] font-medium">{copy.book.from}</span>
            <select
              value={from}
              onChange={(event) => setFrom(Number(event.target.value))}
              className={select}
            >
              {TIMES.slice(0, -1).map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[14px] font-medium">{copy.book.to}</span>
            <select
              value={to}
              onChange={(event) => setTo(Number(event.target.value))}
              className={select}
            >
              {TIMES.filter((time) => time > from).map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className={`${buttonStyles.primary} mt-2`}>
          {copy.book.apply}
        </button>
      </form>
    </dialog>
  );
}
