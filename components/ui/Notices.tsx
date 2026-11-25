"use client";

import { Info, TriangleAlert, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { Notice } from "@/data/types";
import { copy } from "@/lib/copy";

const KEY = "find-tu:dismissed-notices";
const listeners = new Set<() => void>();
let cached: { raw: string | null; ids: string[] } = { raw: null, ids: [] };

function dismissed(): string[] {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cached.raw) {
    cached = { raw, ids: raw ? (JSON.parse(raw) as string[]) : [] };
  }
  return cached.ids;
}

function dismiss(id: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...dismissed(), id]));
  } catch {
    cached = { raw: cached.raw, ids: [...cached.ids, id] };
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Notices({ notices }: { notices: Notice[] }) {
  const hidden = useSyncExternalStore(subscribe, dismissed, () => null);
  if (hidden === null) return null;
  const shown = notices.filter((notice) => !hidden.includes(notice.id));
  if (shown.length === 0) return null;
  return (
    <ul role="list" className="flex flex-col gap-2 px-5 pt-1 pb-2">
      {shown.map((notice) => {
        const warning = notice.kind === "warning";
        return (
          <li
            key={notice.id}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${
              warning
                ? "bg-warning-soft text-warning-ink"
                : "bg-brand-soft text-navy"
            }`}
          >
            {warning ? (
              <TriangleAlert
                aria-hidden
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <Info aria-hidden size={18} className="mt-0.5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                <span className="sr-only">
                  {warning ? copy.notices.warning : copy.notices.notice}:{" "}
                </span>
                {notice.title}
              </p>
              <p className="text-[13px] leading-5">{notice.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(notice.id)}
              aria-label={`${copy.notices.dismiss}: ${notice.title}`}
              className="-mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
            >
              <X aria-hidden size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
