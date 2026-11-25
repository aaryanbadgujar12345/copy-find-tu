"use client";

import { RefreshCw } from "lucide-react";
import { buttonStyles, EmptyState } from "@/components/ui/basics";
import { copy } from "@/lib/copy";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={<RefreshCw size={22} />}
      title={copy.common.errorTitle}
      body={copy.common.errorBody}
    >
      <button type="button" onClick={reset} className={buttonStyles.secondary}>
        {copy.common.retry}
      </button>
    </EmptyState>
  );
}
