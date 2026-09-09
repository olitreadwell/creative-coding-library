"use client";

import { useMastery } from "@/lib/creative/useMastery";

type MasteryButtonProps = {
  slug: string;
  understandWhen?: string;
};

export function MasteryButton({ slug, understandWhen }: MasteryButtonProps) {
  const { mastered, setMastered } = useMastery(slug);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-pressed={mastered}
        onClick={() => setMastered(!mastered)}
        className={[
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          mastered
            ? "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600"
            : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        ].join(" ")}
      >
        {mastered ? "I get this" : "Mark as understood"}
      </button>
      {understandWhen !== undefined && understandWhen.length > 0 && (
        <p className="text-xs text-muted-foreground">{understandWhen}</p>
      )}
    </div>
  );
}
