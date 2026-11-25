"use client";

import { Inbox, MailQuestion } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonStyles, EmptyState, Skeleton } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import { useBookings } from "@/lib/data/bookings";
import { getRoom } from "@/lib/data/catalog";
import { BookingCard } from "./BookingCard";

export function Sent() {
  const params = useSearchParams();
  const bookings = useBookings();
  if (!bookings) return <Skeleton className="h-64 w-full" />;
  const booking = bookings.find((item) => item.id === params.get("id"));
  const room = booking ? getRoom(booking.roomId) : undefined;
  if (!booking || !room) {
    return (
      <EmptyState icon={<MailQuestion size={22} />} title={copy.sent.missing}>
        <Link href="/book" className={buttonStyles.secondary}>
          {copy.confirm.bookAgain}
        </Link>
      </EmptyState>
    );
  }
  const link = `id=${booking.id}&token=${booking.token}`;

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep"
        >
          <Inbox size={22} strokeWidth={1.8} />
        </span>
        <p className="text-[15px] leading-6">{copy.sent.body(booking.email)}</p>
      </div>

      <BookingCard
        room={room}
        date={booking.date}
        start={booking.start}
        end={booking.end}
      />

      <section
        aria-labelledby="demo-email"
        className="rounded-(--radius-card) bg-mist p-1.5"
      >
        <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-2.5">
          <h2
            id="demo-email"
            className="text-[13px] font-semibold tracking-wide text-ink-2 uppercase"
          >
            {copy.sent.demoLabel}
          </h2>
          <p className="text-right text-[12px] text-ink-2">
            {copy.sent.demoNote}
          </p>
        </div>
        <div className="rounded-xl bg-paper p-4 shadow-sm">
          <p className="text-[13px] text-ink-2">{copy.sent.from}</p>
          <p className="mt-0.5 text-[15px] font-semibold">
            {copy.sent.subject(room.name)}
          </p>
          <hr className="my-3 border-line" />
          <p className="text-[14px]">{copy.sent.greeting}</p>
          <p className="mt-1 text-[14px]">{copy.sent.line}</p>
          <Link
            href={`/booking/confirm?${link}`}
            className={`${buttonStyles.primary} mt-4 h-11 w-full`}
          >
            {copy.sent.confirm}
          </Link>
          <p className="mt-4 text-[13px] text-ink-2">
            {copy.sent.cancelLine}{" "}
            <Link
              href={`/booking/cancel?${link}`}
              className="font-medium text-brand-deep underline underline-offset-2"
            >
              {copy.sent.cancel}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
