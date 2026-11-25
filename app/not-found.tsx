import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { buttonStyles, EmptyState } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <EmptyState
      icon={<MapPinOff size={22} />}
      title={copy.notFound.title}
      body={copy.notFound.body}
    >
      <Link href="/" className={buttonStyles.secondary}>
        {copy.notFound.home}
      </Link>
    </EmptyState>
  );
}
