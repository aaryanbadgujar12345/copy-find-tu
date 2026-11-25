import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { copy } from "@/lib/copy";

export function PanelHeader({
  title,
  back,
  children,
}: {
  title: string;
  back?: string;
  children?: ReactNode;
}) {
  return (
    <header
      data-drag
      className="sticky top-0 z-10 flex touch-none items-start gap-2 bg-paper/95 px-5 pt-1 pb-3 backdrop-blur lg:pt-5"
    >
      {back ? (
        <Link
          href={back}
          aria-label={copy.common.back}
          className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-mist"
        >
          <ChevronLeft aria-hidden size={22} />
        </Link>
      ) : null}
      <h1 className="min-w-0 flex-1 pt-1 text-[22px] leading-7 font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {children}
    </header>
  );
}

export function Section({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-5 py-4 ${className}`}>
      {title ? (
        <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} h-12 px-6 text-[15px] bg-brand text-navy hover:bg-[#13b4e2] active:bg-[#0096c2]`,
  secondary: `${buttonBase} h-12 px-6 text-[15px] bg-mist text-ink hover:bg-line`,
  quiet: `${buttonBase} h-10 px-4 text-[14px] text-brand-deep hover:bg-brand-soft`,
  danger: `${buttonBase} h-12 px-6 text-[15px] bg-full text-white hover:bg-[#b84a4a]`,
};

export function RowLink({
  href,
  title,
  subtitle,
  leading,
  trailing,
}: {
  href: string;
  title: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-mist"
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-[13px] text-ink-2">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing}
      <ChevronRight
        aria-hidden
        size={18}
        className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export function IconTile({
  children,
  tone = "mist",
}: {
  children: ReactNode;
  tone?: "mist" | "brand";
}) {
  return (
    <span
      aria-hidden
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        tone === "brand"
          ? "bg-brand-soft text-brand-deep"
          : "bg-mist text-ink-2"
      }`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon ? (
        <span
          aria-hidden
          className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-mist text-ink-2"
        >
          {icon}
        </span>
      ) : null}
      <p className="text-[17px] font-semibold">{title}</p>
      {body ? (
        <p className="mt-1 max-w-72 text-[14px] text-ink-2">{body}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function ChipLink({
  active,
  ...props
}: ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      {...props}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-navy bg-navy text-white"
          : "border-line bg-paper text-ink hover:border-ink-3"
      }`}
    />
  );
}

export function Skeleton({ className }: { className: string }) {
  return <span aria-hidden className={`block skeleton ${className}`} />;
}
