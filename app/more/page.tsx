import { CircleHelp, MessageSquare, Star } from "lucide-react";
import type { Metadata } from "next";
import {
  IconTile,
  PanelHeader,
  RowLink,
  Section,
} from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.more.title };

const LINKS = [
  {
    href: "/faq",
    title: copy.more.faq,
    hint: copy.more.faqHint,
    Icon: CircleHelp,
  },
  {
    href: "/contact",
    title: copy.more.contact,
    hint: copy.more.contactHint,
    Icon: MessageSquare,
  },
  {
    href: "/feedback",
    title: copy.more.feedback,
    hint: copy.more.feedbackHint,
    Icon: Star,
  },
];

export default function MorePage() {
  return (
    <>
      <PanelHeader title={copy.more.title} />
      <Section>
        <ul role="list">
          {LINKS.map(({ href, title, hint, Icon }) => (
            <li key={href}>
              <RowLink
                href={href}
                title={title}
                subtitle={hint}
                leading={
                  <IconTile>
                    <Icon size={20} strokeWidth={1.8} />
                  </IconTile>
                }
              />
            </li>
          ))}
        </ul>
      </Section>
      <Section title={copy.more.credits}>
        <p className="text-[14px] leading-5 text-ink-2">
          {copy.more.creditsBody}
        </p>
        <p className="mt-3 text-[14px] leading-5 text-ink-2">
          {copy.more.prototype}
        </p>
      </Section>
    </>
  );
}
