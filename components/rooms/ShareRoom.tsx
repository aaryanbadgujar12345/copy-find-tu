"use client";

import { Check, Link as LinkIcon, MessageCircle, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { encode } from "uqr";
import { buttonStyles } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

const noop = () => () => {};

function useHref(): string | null {
  return useSyncExternalStore(
    noop,
    () => window.location.href.split("?")[0],
    () => null,
  );
}

function canNativeShare(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export function ShareRoom({ title }: { title: string }) {
  const href = useHref();
  const native = useSyncExternalStore(noop, canNativeShare, () => false);
  const [copied, setCopied] = useState(false);

  if (!href) return null;

  async function share() {
    try {
      await navigator.share({ title, url: href ?? undefined });
    } catch {
      // Closing the share sheet rejects; nothing to do.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {native ? (
        <button
          type="button"
          onClick={() => void share()}
          className={buttonStyles.secondary}
        >
          <Share2 aria-hidden size={18} />
          {copy.room.share}
        </button>
      ) : (
        <>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${href}`)}`}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles.secondary}
          >
            <MessageCircle aria-hidden size={18} />
            {copy.room.whatsapp}
          </a>
          <button
            type="button"
            onClick={() => void copyLink()}
            className={buttonStyles.secondary}
          >
            {copied ? (
              <Check aria-hidden size={18} />
            ) : (
              <LinkIcon aria-hidden size={18} />
            )}
            <span aria-live="polite">
              {copied ? copy.room.copied : copy.room.copyLink}
            </span>
          </button>
        </>
      )}
    </div>
  );
}

export function RoomQr() {
  const href = useHref();
  if (!href) return null;
  const { data, size } = encode(href, { border: 1 });
  return (
    <div className="hidden items-center gap-4 rounded-(--radius-card) border border-line p-4 lg:flex">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-24 shrink-0"
        role="img"
        aria-label={copy.room.qrTitle}
      >
        <rect width={size} height={size} fill="#fff" />
        {data.flatMap((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1.02"
                height="1.02"
                fill="#0c2340"
              />
            ) : null,
          ),
        )}
      </svg>
      <div>
        <p className="text-[15px] font-semibold">{copy.room.qrTitle}</p>
        <p className="mt-1 text-[13px] text-ink-2">{copy.room.qrHint}</p>
      </div>
    </div>
  );
}
