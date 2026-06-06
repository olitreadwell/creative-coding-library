"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  prompt: string;
  reveal?: string;
  defaultOpen?: boolean;
};

export function PredictPrompt({ prompt, reveal, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <p className="font-medium">{prompt}</p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Reveal answer"
            className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            Reveal
          </button>
        )}
        <div aria-live="polite" aria-atomic="true">
          {open && reveal && <p className="text-muted-foreground">{reveal}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
