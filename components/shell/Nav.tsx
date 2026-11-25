"use client";

import {
  Armchair,
  CalendarDays,
  Compass,
  Ellipsis,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/lib/copy";

const TABS = [
  { href: "/", label: copy.nav.explore, Icon: Compass, match: ["", "places"] },
  { href: "/study", label: copy.nav.study, Icon: Armchair, match: ["study"] },
  {
    href: "/book",
    label: copy.nav.book,
    Icon: CalendarDays,
    match: ["book", "booking"],
  },
  {
    href: "/events",
    label: copy.nav.events,
    Icon: Sparkles,
    match: ["events"],
  },
  {
    href: "/more",
    label: copy.nav.more,
    Icon: Ellipsis,
    match: ["more", "faq", "contact", "feedback"],
  },
];

function useActiveTab() {
  const pathname = usePathname();
  const first = pathname.split("/")[1] ?? "";
  return TABS.find((tab) => tab.match.includes(first))?.href ?? null;
}

export function TabBar() {
  const active = useActiveTab();
  return (
    <nav
      aria-label={copy.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-safe backdrop-blur lg:hidden"
    >
      <ul role="list" className="mx-auto grid h-16 max-w-md grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const current = active === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  current ? "text-brand-deep" : "text-ink-2"
                }`}
              >
                <Icon aria-hidden size={22} strokeWidth={current ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Rail() {
  const active = useActiveTab();
  return (
    <nav
      aria-label={copy.nav.label}
      className="fixed top-3 left-3 z-40 hidden w-[68px] flex-col items-center rounded-[20px] bg-paper py-3 shadow-float lg:flex"
    >
      <Link
        href="/"
        className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand text-navy"
      >
        <span className="sr-only">{copy.app.title}</span>
        <svg aria-hidden viewBox="0 0 64 64" className="size-7">
          <path
            d="M18 42 L32 18 L46 42 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="35" r="4" fill="currentColor" />
        </svg>
      </Link>
      <ul role="list" className="flex flex-col gap-1">
        {TABS.map(({ href, label, Icon }) => {
          const current = active === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex w-14 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  current
                    ? "bg-brand-soft text-brand-deep"
                    : "text-ink-2 hover:bg-mist hover:text-ink"
                }`}
              >
                <Icon aria-hidden size={20} strokeWidth={current ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
