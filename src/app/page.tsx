import { apps } from "@/lib/creative/registry.generated";
import { Catalog } from "@/components/catalog";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            creative-coding-library
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/70 sm:text-base">
            A scheduled creative-coding learning lab. Each app is a small, self-contained sketch
            that teaches one technique. Open a card for a plain-language synopsis, a tutorial, and
            the live demo.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Catalog apps={apps} />
    </div>
  );
}
