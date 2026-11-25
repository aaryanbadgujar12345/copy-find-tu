import type { Metadata } from "next";
import { Suspense } from "react";
import { Recommend } from "@/components/study/Recommend";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.recommend.title };

export default function RecommendPage() {
  return (
    <>
      <PanelHeader title={copy.recommend.title} back="/study" />
      <Section className="pt-2">
        <Suspense>
          <Recommend />
        </Suspense>
      </Section>
    </>
  );
}
