import type { Metadata } from "next";
import { Suspense } from "react";
import { BookList } from "@/components/booking/BookList";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.book.title };

export default function BookPage() {
  return (
    <>
      <PanelHeader title={copy.book.title} />
      <p className="-mt-1 px-5 text-[14px] text-ink-2">{copy.book.intro}</p>
      <Section>
        <Suspense>
          <BookList />
        </Suspense>
      </Section>
    </>
  );
}
