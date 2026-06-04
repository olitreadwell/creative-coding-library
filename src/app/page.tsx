import Link from "next/link";
import { apps } from "@/lib/creative/registry.generated";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">creative-coding-library</h1>
      <p className="mt-4 text-foreground/80">
        A scheduled creative-coding learning lab. Apps land here as the curator/builder loops run.
      </p>
      <p className="mt-2 text-sm text-foreground/60">{apps.length} app(s) in catalog.</p>
      <div className="mt-8 flex gap-4">
        <Link className="underline" href="/creative">
          Browse catalog
        </Link>
      </div>
    </main>
  );
}
