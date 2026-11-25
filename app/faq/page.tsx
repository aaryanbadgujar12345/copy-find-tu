import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles, PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";
import { faqGroups } from "@/lib/data/catalog";

export const metadata: Metadata = { title: copy.faq.title };

export default function FaqPage() {
  return (
    <>
      <PanelHeader title={copy.faq.title} back="/more" />
      {faqGroups.map((group) => (
        <Section key={group.title} title={group.title}>
          <div className="divide-y divide-line rounded-(--radius-card) border border-line">
            {group.items.map((item) => (
              <details key={item.question} className="group px-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    aria-hidden
                    size={18}
                    className="shrink-0 text-ink-2 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="pb-4 text-[14px] leading-6 text-ink-2">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Section>
      ))}
      <Section>
        <div className="flex flex-col items-center gap-3 rounded-(--radius-card) bg-mist px-4 py-6 text-center">
          <p className="text-[15px] font-semibold">{copy.faq.notFound}</p>
          <Link href="/contact" className={buttonStyles.secondary}>
            {copy.faq.contact}
          </Link>
        </div>
      </Section>
    </>
  );
}
