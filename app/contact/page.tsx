import type { Metadata } from "next";
import { ContactForm } from "@/components/more/ContactForm";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.contact.title };

export default function ContactPage() {
  return (
    <>
      <PanelHeader title={copy.contact.title} back="/more" />
      <p className="-mt-1 px-5 text-[14px] text-ink-2">{copy.contact.intro}</p>
      <Section>
        <ContactForm />
      </Section>
    </>
  );
}
