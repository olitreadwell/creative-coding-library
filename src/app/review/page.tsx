import { apps } from "@/lib/creative/registry.generated";
import { ReviewBoard } from "@/components/review/ReviewBoard";
import type { AppMeta } from "@/lib/creative/registry";

export const metadata = { title: "Review | creative-coding-library" };

export default function ReviewPage() {
  const withChecks: AppMeta[] = apps.filter(
    (app) => app.recallChecks !== undefined && app.recallChecks.length > 0,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Review</h1>
        <p className="mt-2 text-sm text-foreground/70 sm:text-base">
          Cards that are due, across every app.
        </p>
      </header>
      <ReviewBoard apps={withChecks} />
    </div>
  );
}
