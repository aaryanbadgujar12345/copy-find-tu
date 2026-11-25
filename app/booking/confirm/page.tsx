import type { Metadata } from "next";
import { Suspense } from "react";
import { Confirm } from "@/components/booking/Confirm";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.sent.confirm };

export default function ConfirmPage() {
  return (
    <>
      <PanelHeader title={copy.sent.confirm} back="/book" />
      <Section className="pt-1">
        <Suspense>
          <Confirm />
        </Suspense>
      </Section>
    </>
  );
}
