import type { Metadata } from "next";
import { FeedbackForm } from "@/components/more/FeedbackForm";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.feedback.title };

export default function FeedbackPage() {
  return (
    <>
      <PanelHeader title={copy.feedback.title} back="/more" />
      <Section className="pt-2">
        <FeedbackForm />
      </Section>
    </>
  );
}
