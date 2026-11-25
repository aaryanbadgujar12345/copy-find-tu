"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { buttonStyles, EmptyState, Skeleton } from "@/components/ui/basics";
import type { Room } from "@/data/types";
import {
  formatDay,
  formatTime,
  isIsoDate,
  parseTime,
  useCampusTime,
} from "@/lib/campus-time";
import { copy } from "@/lib/copy";
import {
  bookableDates,
  bookableSpan,
  createBooking,
  isTuDelftEmail,
  overlaps,
  rulesOf,
  takenSpans,
  useBookings,
} from "@/lib/data/bookings";

interface Selection {
  date: string;
  start: number;
  end: number | null;
}

export function SlotPicker({ room }: { room: Room }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const time = useCampusTime();
  const bookings = useBookings();
  const rules = rulesOf(room);

  const [picked, setPicked] = useState<Selection | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "taken" | "error">(
    "idle",
  );

  if (!time || !bookings) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const dates = bookableDates(room, time.date);
  const dateParam = params.get("date");
  const date =
    isIsoDate(dateParam) && dates.includes(dateParam) ? dateParam : time.date;
  const span = bookableSpan(room, date);
  const step = rules.slotMinutes;
  const taken = takenSpans(room, date, bookings);
  const firstStart =
    date === time.date ? Math.ceil(time.minutes / step) * step : 0;

  const urlFrom = parseTime(params.get("from"));
  const urlTo = parseTime(params.get("to"));
  const fromUrl: Selection | null =
    urlFrom !== null &&
    urlTo !== null &&
    urlTo > urlFrom &&
    urlTo - urlFrom <= rules.longestMinutes &&
    !overlaps(taken, urlFrom, urlTo)
      ? { date, start: urlFrom, end: urlTo }
      : null;
  const selection = picked?.date === date ? picked : picked ? null : fromUrl;

  const slots: number[] = [];
  if (span) {
    for (
      let start = Math.max(span.open, firstStart);
      start + step <= span.close;
      start += step
    )
      slots.push(start);
  }

  function selectDay(next: string) {
    const search = new URLSearchParams({ date: next });
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    setPicked(null);
    setStatus("idle");
  }

  function tap(start: number) {
    setStatus("idle");
    if (!selection || selection.end !== null || start < selection.start) {
      setPicked({ date, start, end: null });
      return;
    }
    const end = start + step;
    if (
      end - selection.start > rules.longestMinutes ||
      overlaps(taken, selection.start, end)
    ) {
      setPicked({ date, start, end: null });
      return;
    }
    setPicked({ date, start: selection.start, end });
  }

  const effectiveEnd = selection
    ? (selection.end ?? selection.start + step)
    : null;
  const emailValid = isTuDelftEmail(email);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setEmailTouched(true);
    if (!selection || effectiveEnd === null || !emailValid) return;
    setStatus("sending");
    const result = await createBooking({
      room,
      date,
      start: selection.start,
      end: effectiveEnd,
      email,
    });
    if (result.ok) {
      router.push(`/book/sent?id=${result.booking.id}`);
      return;
    }
    setStatus(result.reason);
    if (result.reason === "taken") setPicked(null);
  }

  const latestEnd =
    selection && selection.end === null ? latestEndFrom(selection.start) : null;
  function latestEndFrom(start: number) {
    let end = start + step;
    while (
      end + step - start <= rules.longestMinutes &&
      span &&
      end + step <= span.close &&
      !overlaps(taken, start, end + step)
    ) {
      end += step;
    }
    return end;
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">
          {copy.book.pickDay}
        </legend>
        <div className="-mx-5 scrollbar-none flex gap-2 overflow-x-auto px-5 pb-1">
          {dates.map((day) => {
            const active = day === date;
            const [weekday, dayNum] = formatDay(day).split(" ");
            const label = formatDay(day, time.date);
            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                aria-pressed={active}
                aria-label={
                  label === "Today" || label === "Tomorrow"
                    ? `${label}, ${formatDay(day)}`
                    : formatDay(day)
                }
                className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors ${
                  active
                    ? "border-navy bg-navy text-white"
                    : "border-line hover:border-ink-3"
                }`}
              >
                <span
                  className={`text-[12px] ${active ? "text-white/80" : "text-ink-2"}`}
                >
                  {weekday}
                </span>
                <span className="text-[17px] font-semibold">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-1 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">
          {copy.book.pickTitle}
        </legend>
        <p className="mb-3 text-[13px] text-ink-2" aria-live="polite">
          {latestEnd !== null
            ? copy.book.pickEnd(formatTime(latestEnd))
            : copy.book.pickStart}{" "}
          {copy.book.maxLength(rules.longestMinutes)}
        </p>
        {slots.length === 0 ? (
          <EmptyState title={copy.book.closedDay} />
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((start) => {
              const isTaken = overlaps(taken, start, start + step);
              const inRange =
                selection !== null &&
                effectiveEnd !== null &&
                start >= selection.start &&
                start < effectiveEnd;
              const isEdge =
                selection !== null &&
                (start === selection.start || start + step === effectiveEnd);
              return (
                <button
                  key={start}
                  type="button"
                  disabled={isTaken}
                  onClick={() => tap(start)}
                  aria-pressed={inRange}
                  aria-label={
                    isTaken
                      ? `${formatTime(start)}, ${copy.book.slotTaken}`
                      : formatTime(start)
                  }
                  className={`h-11 rounded-xl text-[14px] font-medium tabular-nums transition-colors ${
                    isTaken
                      ? "cursor-not-allowed bg-[repeating-linear-gradient(135deg,var(--color-mist)_0_6px,#e6eaee_6px_12px)] text-ink-3 line-through"
                      : inRange
                        ? isEdge
                          ? "bg-navy text-white"
                          : "bg-navy/85 text-white"
                        : "border border-line bg-paper hover:border-brand"
                  }`}
                >
                  {formatTime(start)}
                </button>
              );
            })}
          </div>
        )}
        {selection && effectiveEnd !== null ? (
          <p className="mt-3 text-[16px] font-semibold tabular-nums">
            {formatDay(date, time.date)},{" "}
            {copy.book.picked(
              formatTime(selection.start),
              formatTime(effectiveEnd),
            )}
          </p>
        ) : null}
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-[14px] font-medium">{copy.book.emailLabel}</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={showEmailError}
          aria-describedby="email-help"
          placeholder="name@student.tudelft.nl"
          className={`h-12 rounded-xl border px-4 text-[15px] focus:ring-2 focus:outline-none ${
            showEmailError
              ? "border-full focus:ring-full/30"
              : "border-line focus:border-brand focus:ring-brand/30"
          }`}
        />
        <span
          id="email-help"
          className={`text-[13px] ${showEmailError ? "text-full" : "text-ink-2"}`}
        >
          {showEmailError ? copy.book.emailError : copy.book.emailHint}
        </span>
      </label>

      {status === "taken" || status === "error" ? (
        <p
          role="alert"
          className="rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning-ink"
        >
          {status === "taken" ? copy.book.takenError : copy.book.errorBody}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!selection || status === "sending"}
        className={buttonStyles.primary}
      >
        {status === "sending" ? (
          <>
            <LoaderCircle aria-hidden size={18} className="animate-spin" />
            {copy.book.submitting}
          </>
        ) : status === "error" ? (
          copy.common.retry
        ) : (
          copy.book.submit
        )}
      </button>
    </form>
  );
}
