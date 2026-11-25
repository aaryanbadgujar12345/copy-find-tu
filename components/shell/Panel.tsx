"use client";

import { usePathname } from "next/navigation";
import type { PointerEvent, ReactNode } from "react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { setUi } from "@/lib/ui-store";

type Snap = "peek" | "half" | "full";

const DESKTOP = "(min-width: 1024px)";
const TAB_BAR = 64;
const PEEK = 112;
const DESKTOP_INSET = 92 + 400;
const FULL_SCREEN_ROUTES = new Set(["more", "faq", "contact", "feedback"]);

function subscribeMedia(listener: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

function defaultSnap(pathname: string): Snap {
  return FULL_SCREEN_ROUTES.has(pathname.split("/")[1] ?? "") ? "full" : "half";
}

export function Panel({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const suppressClick = useRef(false);
  const [height, setHeight] = useState(0);
  const [chosen, setChosen] = useState<{ path: string; snap: Snap } | null>(
    null,
  );
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);

  const snap = chosen?.path === pathname ? chosen.snap : defaultSnap(pathname);
  const visible: Record<Snap, number> = {
    peek: PEEK,
    half: Math.round((height + 48) * 0.5),
    full: height,
  };
  const restingTranslate = Math.max(0, height - visible[snap]);
  const translate = dragTranslate ?? restingTranslate;

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const observer = new ResizeObserver(() => setHeight(sheet.offsetHeight));
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useLayoutEffect(() => {
    if (isDesktop) {
      setUi({ insets: { left: DESKTOP_INSET, bottom: 0 } });
    } else if (height > 0) {
      setUi({ insets: { left: 0, bottom: height - translate + TAB_BAR } });
    }
  }, [isDesktop, height, translate]);

  function choose(next: Snap) {
    setChosen({ path: pathname, snap: next });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isDesktop || height === 0) return;
    if (!(event.target as HTMLElement).closest("[data-drag]")) return;
    const start = {
      y: event.clientY,
      translate,
      time: event.timeStamp,
      moved: false,
      last: translate,
    };
    const max = height - PEEK + 24;

    const move = (moveEvent: globalThis.PointerEvent) => {
      const dy = moveEvent.clientY - start.y;
      if (!start.moved && Math.abs(dy) < 6) return;
      start.moved = true;
      start.last = Math.min(max, Math.max(-16, start.translate + dy));
      setDragTranslate(start.last);
    };
    const up = (upEvent: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!start.moved) return;
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      const velocity =
        (start.last - start.translate) /
        Math.max(1, upEvent.timeStamp - start.time);
      const projected = start.last + velocity * 180;
      const snaps: Snap[] = ["full", "half", "peek"];
      const nearest = snaps.reduce((best, candidate) =>
        Math.abs(height - visible[candidate] - projected) <
        Math.abs(height - visible[best] - projected)
          ? candidate
          : best,
      );
      choose(nearest);
      setDragTranslate(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function toggle() {
    choose(snap === "full" ? "half" : snap === "half" ? "full" : "half");
  }

  return (
    <div
      ref={sheetRef}
      onPointerDown={onPointerDown}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      style={{
        transform:
          height > 0
            ? `translateY(${translate}px)`
            : "translateY(calc(100% - 48dvh))",
      }}
      className={`fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex h-[calc(100dvh-4rem-env(safe-area-inset-bottom)-48px)] flex-col rounded-t-(--radius-sheet) bg-paper shadow-sheet lg:top-3 lg:bottom-3 lg:left-[92px] lg:h-auto lg:w-[400px] lg:transform-none! lg:rounded-[24px] lg:shadow-float ${
        dragTranslate === null
          ? "transition-transform duration-500 ease-out-soft"
          : ""
      }`}
    >
      <div
        data-drag
        className="flex h-6 shrink-0 touch-none justify-center pt-2 lg:hidden"
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={snap === "full" ? copy.sheet.collapse : copy.sheet.expand}
          className="h-4 w-16 rounded-full"
        >
          <span
            aria-hidden
            className="mx-auto block h-1.5 w-10 rounded-full bg-line"
          />
        </button>
      </div>
      <main
        id="content"
        tabIndex={-1}
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain focus:outline-none lg:rounded-[24px]"
        style={{ paddingBottom: isDesktop ? undefined : translate }}
      >
        {children}
      </main>
    </div>
  );
}
