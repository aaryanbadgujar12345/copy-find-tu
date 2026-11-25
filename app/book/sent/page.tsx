import type { Metadata } from "next";
import { Suspense } from "react";
import { Sent } from "@/components/booking/Sent";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.sent.title };

export default function SentPage() {
  return (
    <>
      <PanelHeader title={copy.sent.title} back="/book" />
      <Section className="pt-1">
        <Suspense>
          <Sent />
        </Suspense>
      </Section>
    </>
  );
}
