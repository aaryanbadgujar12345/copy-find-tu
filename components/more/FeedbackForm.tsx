"use client";

import { Heart, LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/basics";
import { Stars } from "@/components/ui/Stars";
import { Result } from "@/components/booking/Confirm";
import { copy } from "@/lib/copy";
import { sendFeedback } from "@/lib/data/messages";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (rating === 0) return;
    setState("sending");
    const result = await sendFeedback({ rating, comment });
    setState(result.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <Result
        icon={<Heart size={26} />}
        tone="good"
        title={copy.feedback.thanksTitle}
        body={copy.feedback.thanksBody}
      />
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5">
      <div>
        <p className="mb-3 text-[17px] font-semibold tracking-tight">
          {copy.feedback.question}
        </p>
        <Stars
          value={rating}
          onChange={setRating}
          label={copy.feedback.ratingLabel}
          describe={(n) => copy.feedback.ratingWords[n - 1]}
        />
        <p className="mt-1 h-5 text-[14px] text-ink-2" aria-hidden>
          {rating > 0 ? copy.feedback.ratingWords[rating - 1] : ""}
        </p>
      </div>
      <label className="grid gap-1.5">
        <span className="text-[14px] font-medium">{copy.feedback.comment}</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          className="rounded-xl border border-line px-4 py-3 text-[15px] focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
        />
      </label>
      {state === "error" ? (
        <p
          role="alert"
          className="rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning-ink"
        >
          {copy.common.errorBody}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={rating === 0 || state === "sending"}
        className={buttonStyles.primary}
      >
        {state === "sending" ? (
          <>
            <LoaderCircle aria-hidden size={18} className="animate-spin" />
            {copy.feedback.sending}
          </>
        ) : (
          copy.feedback.send
        )}
      </button>
    </form>
  );
}
