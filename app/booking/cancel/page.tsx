import type { Metadata } from "next";
import { Suspense } from "react";
import { Cancel } from "@/components/booking/Cancel";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.cancel.title };

export default function CancelPage() {
  return (
    <>
      <PanelHeader title={copy.cancel.title} back="/book" />
      <Section className="pt-1">
        <Suspense>
          <Cancel />
        </Suspense>
      </Section>
    </>
  );
}
