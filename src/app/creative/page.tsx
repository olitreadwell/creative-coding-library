import Link from "next/link";
import { apps } from "@/lib/creative/registry.generated";

type FilterKey = "library" | "level" | "commercialUse" | "concept";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const get = (key: FilterKey): string | undefined => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const filters = {
    library: get("library"),
    level: get("level"),
    commercialUse: get("commercialUse"),
    concept: get("concept"),
  };

  const filtered = apps.filter((a) => {
    if (filters.library && a.library !== filters.library) return false;
    if (filters.level && String(a.level) !== filters.level) return false;
    if (filters.commercialUse && a.commercialUse !== filters.commercialUse) return false;
    if (filters.concept && !a.concepts.includes(filters.concept)) return false;
    return true;
  });

  const libraries = [...new Set(apps.map((a) => a.library))].sort();
  const concepts = [...new Set(apps.flatMap((a) => a.concepts))].sort();
  const levels = [...new Set(apps.map((a) => String(a.level)))].sort();
  const commercial = [...new Set(apps.map((a) => a.commercialUse))].sort();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <nav className="mb-6 text-sm">
        <Link className="underline" href="/">
          ← home
        </Link>
      </nav>
      <h1 className="text-2xl font-semibold">Catalog</h1>
      <p className="mt-2 text-sm text-foreground/60">
        {filtered.length} of {apps.length} app(s).
      </p>

      {apps.length > 0 && (
        <section className="mt-6 space-y-3 text-sm">
          <FilterRow label="library" current={filters.library} options={libraries} />
          <FilterRow label="level" current={filters.level} options={levels} />
          <FilterRow label="commercialUse" current={filters.commercialUse} options={commercial} />
          <FilterRow label="concept" current={filters.concept} options={concepts} />
        </section>
      )}

      <section className="mt-8">
        {filtered.length === 0 ? (
          <p className="text-foreground/60">
            No apps yet. The builder loop will populate this as `app-idea` issues are picked up.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {filtered.map((app) => (
              <li
                key={app.slug}
                className="rounded border border-foreground/10 p-4 hover:border-foreground/30"
              >
                <Link href={`/${app.slug}`} className="block">
                  <h2 className="font-medium">{app.title}</h2>
                  <p className="mt-1 text-sm text-foreground/70">{app.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-foreground/60">
                    <Tag>{app.library}</Tag>
                    <Tag>L{app.level}</Tag>
                    <Tag>{app.commercialUse}</Tag>
                    {app.concepts.slice(0, 4).map((c) => (
                      <Tag key={c}>{c}</Tag>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function FilterRow({
  label,
  current,
  options,
}: {
  label: FilterKey;
  current: string | undefined;
  options: string[];
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-foreground/60">{label}:</span>
      <Link
        href={current ? `?${unset(label)}` : "?"}
        className={current ? "underline text-foreground/60" : "underline"}
      >
        all
      </Link>
      {options.map((opt) => {
        const active = current === opt;
        return (
          <Link
            key={opt}
            href={`?${set(label, opt)}`}
            className={active ? "rounded bg-foreground/20 px-1.5" : "underline"}
          >
            {opt}
          </Link>
        );
      })}
    </div>
  );
}

function set(key: string, value: string) {
  const p = new URLSearchParams();
  p.set(key, value);
  return p.toString();
}
function unset(_key: string) {
  return new URLSearchParams().toString();
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-foreground/15 px-1.5 py-0.5">{children}</span>;
}
