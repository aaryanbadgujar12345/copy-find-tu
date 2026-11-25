"use client";

import { CircleCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/basics";
import { Stars } from "@/components/ui/Stars";
import { copy } from "@/lib/copy";
import { rateRoom } from "@/lib/data/messages";

export function RateRoom({ roomId }: { roomId: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (stars === 0) return;
    setState("sending");
    const result = await rateRoom({ roomId, stars, comment });
    setState(result.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <p role="status" className="flex items-center gap-2 text-[15px]">
        <CircleCheck aria-hidden size={20} className="text-brand-deep" />
        {copy.room.rateThanks}
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-3">
      <Stars
        value={stars}
        onChange={setStars}
        label={copy.room.rateTitle}
        describe={copy.room.rateStars}
      />
      {stars > 0 ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-[14px] font-medium">
              {copy.room.rateComment}
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              className="rounded-xl border border-line px-3 py-2 text-[15px] focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
          </label>
          {state === "error" ? (
            <p role="alert" className="text-[14px] text-full">
              {copy.common.errorBody}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={state === "sending"}
            className={`${buttonStyles.secondary} justify-self-start`}
          >
            {copy.room.rateSend}
          </button>
        </>
      ) : null}
    </form>
  );
}
