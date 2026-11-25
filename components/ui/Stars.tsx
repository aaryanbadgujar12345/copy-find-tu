"use client";

import { Star } from "lucide-react";
import { useId } from "react";

/** A 1 to 5 rating as a radio group, so it works by keyboard and screen reader. */
export function Stars({
  value,
  onChange,
  label,
  describe,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  describe: (value: number) => string;
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-full p-1 has-focus-visible:outline-2 has-focus-visible:outline-brand-deep"
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="sr-only">{describe(n)}</span>
            <Star
              aria-hidden
              size={32}
              strokeWidth={1.6}
              className={`transition-colors ${n <= value ? "fill-busy text-busy" : "text-line"}`}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
