import type { Metadata } from "next";
import { EventList } from "@/components/events/EventList";
import { PanelHeader, Section } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.events.title };

export default function EventsPage() {
  return (
    <>
      <PanelHeader title={copy.events.title} />
      <p className="-mt-1 px-5 text-[14px] text-ink-2">{copy.events.intro}</p>
      <Section>
        <EventList />
      </Section>
    </>
  );
}
