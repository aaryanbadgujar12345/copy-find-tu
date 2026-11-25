"use client";

import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonStyles, EmptyState, Skeleton } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import {
  cancelBooking,
  lookupForCancel,
  useBookings,
} from "@/lib/data/bookings";
import { getRoom } from "@/lib/data/catalog";
import { BookingCard } from "./BookingCard";
import { Result } from "./Confirm";

export function Cancel() {
  const params = useSearchParams();
  const bookings = useBookings();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<
    "idle" | "asking" | "cancelling" | "done" | "error"
  >("idle");
  const id = params.get("id");
  const token = params.get("token");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state === "asking" && !dialog.open) {
      dialog.showModal();
      keepRef.current?.focus();
    }
    if (state !== "asking" && dialog.open) dialog.close();
  }, [state]);

  if (!bookings) return <Skeleton className="h-48 w-full" />;
  const lookup = lookupForCancel(id, token, bookings);

  if (state === "done") {
    return (
      <Result
        icon={<CircleCheck size={26} />}
        tone="good"
        title={copy.cancel.doneTitle}
        body={copy.cancel.doneBody}
      >
        <Link
          href="/book"
          className={`${buttonStyles.secondary} justify-self-center`}
        >
          {copy.confirm.bookAgain}
        </Link>
      </Result>
    );
  }
  if (lookup.state === "invalid") {
    return (
      <EmptyState
        icon={<CircleX size={22} />}
        title={copy.cancel.invalidTitle}
        body={copy.cancel.invalidBody}
      />
    );
  }
  const room = getRoom(lookup.booking.roomId);
  if (lookup.state === "cancelled" || !room) {
    return (
      <EmptyState
        title={copy.cancel.alreadyTitle}
        body={copy.cancel.alreadyBody}
      />
    );
  }

  async function confirmCancel() {
    if (!id || !token) return;
    setState("cancelling");
    const result = await cancelBooking(id, token);
    setState(result.ok ? "done" : "error");
  }

  return (
    <div className="grid gap-5">
      <p className="text-[15px] leading-6">{copy.cancel.body}</p>
      <BookingCard
        room={room}
        date={lookup.booking.date}
        start={lookup.booking.start}
        end={lookup.booking.end}
      />
      {state === "error" ? (
        <p
          role="alert"
          className="rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning-ink"
        >
          {copy.cancel.errorBody}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setState("asking")}
        disabled={state === "cancelling"}
        className={buttonStyles.danger}
      >
        {state === "cancelling" ? (
          <>
            <LoaderCircle aria-hidden size={18} className="animate-spin" />
            {copy.cancel.cancelling}
          </>
        ) : (
          copy.cancel.button
        )}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() =>
          setState((current) => (current === "asking" ? "idle" : current))
        }
        aria-labelledby="cancel-title"
        aria-describedby="cancel-body"
        className="m-auto w-[min(92vw,380px)] rounded-3xl p-6 shadow-float backdrop:bg-ink/40"
      >
        <h2
          id="cancel-title"
          className="text-[19px] font-semibold tracking-tight"
        >
          {copy.cancel.dialogTitle}
        </h2>
        <p id="cancel-body" className="mt-2 text-[14px] text-ink-2">
          {copy.cancel.dialogBody}
        </p>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={() => void confirmCancel()}
            className={buttonStyles.danger}
          >
            {copy.cancel.dialogConfirm}
          </button>
          <button
            ref={keepRef}
            type="button"
            onClick={() => setState("idle")}
            className={buttonStyles.secondary}
          >
            {copy.cancel.dialogKeep}
          </button>
        </div>
      </dialog>
    </div>
  );
}
