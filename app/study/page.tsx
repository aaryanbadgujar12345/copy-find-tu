import { Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudyList } from "@/components/study/StudyList";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.study.title };

export default function StudyPage() {
  return (
    <>
      <PanelHeader title={copy.study.title} />
      <p className="-mt-1 px-5 text-[14px] text-ink-2">{copy.study.intro}</p>
      <p className="mt-1 px-5 text-[13px] leading-5 text-ink-2">
        {copy.occupancy.estimateNote}
      </p>
      <Section>
        <Link
          href="/study/recommend"
          className="flex items-center gap-3 rounded-(--radius-card) bg-navy px-4 py-3.5 text-white transition-opacity hover:opacity-95"
        >
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-xl bg-white/10"
          >
            <Shuffle size={20} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">
              {copy.study.recommend}
            </span>
            <span className="block text-[13px] text-white/75">
              {copy.study.recommendHint}
            </span>
          </span>
        </Link>
      </Section>
      <Section>
        <StudyList />
      </Section>
    </>
  );
}
