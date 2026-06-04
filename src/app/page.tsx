import Link from "next/link";
import Image from "next/image";
import { apps } from "@/lib/creative/registry.generated";
import type { AppMeta } from "@/lib/creative/registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function hueFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}

function AppCard({ app }: { app: AppMeta }) {
  const hue = hueFromSlug(app.slug);
  return (
    <Link href={`/${app.slug}`} className="group block">
      <Card className="gap-0 overflow-hidden pt-0 ring-1 ring-foreground/10 transition group-hover:ring-foreground/30">
        <div
          className="relative aspect-[16/10] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 60% 22%), hsl(${(hue + 60) % 360} 55% 14%))`,
          }}
        >
          <Image
            src={`/thumbnails/${app.slug}.png`}
            alt={`Preview of ${app.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <CardHeader className="pt-4">
          <CardTitle>{app.title}</CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 pt-3 pb-4">
          <Badge variant="secondary">{app.library}</Badge>
          <Badge variant="outline">L{app.level}</Badge>
          {app.concepts.slice(0, 3).map((c) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const sorted = [...apps].sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">creative-coding-library</h1>
        <p className="mt-3 max-w-2xl text-foreground/70">
          A scheduled creative-coding learning lab. Each app is a small, self-contained sketch that
          teaches one technique. Click any card to open it.
        </p>
        <p className="mt-2 text-sm text-foreground/50">
          {apps.length} app{apps.length === 1 ? "" : "s"} in the catalog.{" "}
          <Link href="/creative" className="underline underline-offset-2 hover:text-foreground">
            Browse with filters
          </Link>
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="text-foreground/60">No apps yet. The builder loop will fill this in.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      )}
    </main>
  );
}
