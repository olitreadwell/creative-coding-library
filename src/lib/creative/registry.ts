export type AppLevel = 1 | 2 | 3;
export type AppKind = "creative" | "data-viz";
export type CommercialUse = "paid-gig-safe" | "personal-only";

export type AppSource = {
  author: string;
  title: string;
  url: string;
  license: string;
};

export type AppMeta = {
  slug: string;
  title: string;
  description: string;
  library: string;
  concepts: string[];
  level: AppLevel;
  technique: string;
  source?: AppSource;
  license: string;
  commercialUse: CommercialUse;
  kind: AppKind;
  builtAt: string;
};

export function defineApp(meta: AppMeta): AppMeta {
  return meta;
}
