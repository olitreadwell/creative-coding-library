import type { MDXComponents } from "mdx/types";

// Styles MDX content for readability: generous spacing, strong contrast,
// mobile-first sizing. Used by all overview.mdx / tutorial.mdx files.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => <h2 className="mt-8 mb-3 text-xl font-semibold tracking-tight" {...props} />,
    h3: (props) => <h3 className="mt-6 mb-2 text-lg font-semibold" {...props} />,
    p: (props) => <p className="my-4 leading-7 text-foreground/80" {...props} />,
    ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 text-foreground/80" {...props} />,
    ol: (props) => (
      <ol className="my-4 list-decimal space-y-2 pl-6 text-foreground/80" {...props} />
    ),
    li: (props) => <li className="leading-7" {...props} />,
    a: (props) => (
      <a className="font-medium underline underline-offset-2 hover:text-foreground" {...props} />
    ),
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    code: (props) => (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-5 overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="my-5 border-l-2 border-border pl-4 text-foreground/70 italic"
        {...props}
      />
    ),
    ...components,
  };
}
