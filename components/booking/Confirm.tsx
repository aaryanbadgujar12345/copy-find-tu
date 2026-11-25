"use client";

import {
  CalendarX,
  CircleCheck,
  CircleX,
  Clock,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { buttonStyles, EmptyState } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import type { ConfirmOutcome } from "@/lib/data/bookings";
import { confirmBooking } from "@/lib/data/bookings";
import { getRoom } from "@/lib/data/catalog";
import { BookingCard } from "./BookingCard";

export function Confirm() {
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");
  const [outcome, setOutcome] = useState<ConfirmOutcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef<string | null>(null);

  useEffect(() => {
    const key = `${id}:${token}:${attempt}`;
    if (started.current === key) return;
    started.current = key;
    void confirmBooking(id, token, getRoom).then(setOutcome);
  }, [id, token, attempt]);

  if (!outcome) {
    return (
      <p
        role="status"
        className="flex items-center justify-center gap-2 py-12 text-[15px] text-ink-2"
      >
        <LoaderCircle aria-hidden size={18} className="animate-spin" />
        {copy.confirm.working}
      </p>
    );
  }

  const bookAgain = (
    <Link href="/book" className={buttonStyles.secondary}>
      {copy.confirm.bookAgain}
    </Link>
  );

  switch (outcome.state) {
    case "confirmed":
    case "used": {
      const booking = outcome.booking;
      const room = getRoom(booking.roomId);
      const confirmed = outcome.state === "confirmed";
      return (
        <Result
          icon={confirmed ? <CircleCheck size={26} /> : <Clock size={26} />}
          tone={confirmed ? "good" : "neutral"}
          title={
            confirmed ? copy.confirm.confirmedTitle : copy.confirm.usedTitle
          }
          body={
            confirmed
              ? copy.confirm.confirmedBody
              : booking.status === "cancelled"
                ? copy.confirm.usedCancelled
                : copy.confirm.usedConfirmed
          }
        >
          {room ? (
            <BookingCard
              room={room}
              date={booking.date}
              start={booking.start}
              end={booking.end}
            />
          ) : null}
          {booking.status === "confirmed" ? (
            <Link
              href={`/booking/cancel?id=${booking.id}&token=${booking.token}`}
              className="text-center text-[14px] font-medium text-brand-deep underline underline-offset-2"
            >
              {copy.confirm.cancelLink}
            </Link>
          ) : null}
        </Result>
      );
    }
    case "invalid":
      return (
        <EmptyState
          icon={<CircleX size={22} />}
          title={copy.confirm.invalidTitle}
          body={copy.confirm.invalidBody}
        >
          {bookAgain}
        </EmptyState>
      );
    case "expired":
      return (
        <EmptyState
          icon={<CalendarX size={22} />}
          title={copy.confirm.expiredTitle}
          body={copy.confirm.expiredBody}
        >
          {bookAgain}
        </EmptyState>
      );
    case "error":
      return (
        <EmptyState
          icon={<RefreshCw size={22} />}
          title={copy.confirm.errorTitle}
          body={copy.confirm.errorBody}
        >
          <button
            type="button"
            onClick={() => {
              setOutcome(null);
              setAttempt((n) => n + 1);
            }}
            className={buttonStyles.secondary}
          >
            {copy.common.retry}
          </button>
        </EmptyState>
      );
  }
}

export function Result({
  icon,
  tone,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  tone: "good" | "neutral";
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-col items-center pt-4 text-center">
        <span
          aria-hidden
          className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${
            tone === "good"
              ? "bg-quiet/30 text-[#1f6b33]"
              : "bg-mist text-ink-2"
          }`}
        >
          {icon}
        </span>
        <h2 role="status" className="text-[20px] font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 max-w-72 text-[14px] text-ink-2">{body}</p>
      </div>
      {children}
    </div>
  );
}
