"use client";

import { useState } from "react";
import type { RecallCheck as RecallCheckItem } from "@/lib/creative/registry";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  checks: RecallCheckItem[];
};

export function RecallCheck({ checks }: Props) {
  const [revealed, setRevealed] = useState<boolean[]>(() => checks.map(() => false));

  function toggle(index: number) {
    setRevealed((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        {checks.map((check, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p className="font-medium">{check.q}</p>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-label={revealed[i] ? "Hide answer" : "Show answer"}
              className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
            >
              {revealed[i] ? "Hide" : "Show answer"}
            </button>
            <div aria-live="polite" aria-atomic="true">
              {revealed[i] === true && <p className="text-muted-foreground">{check.a}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
