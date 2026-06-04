export function toImportIdentifier(slug: string): string;
export function toImportPath(file: string, outFile: string): string;
export function findMetaFiles(appsDir: string): Promise<Array<{ slug: string; file: string }>>;
export function renderRegistry(
  found: ReadonlyArray<{ slug: string; file: string }>,
  outFile: string,
): string;
export function buildRegistry(args: {
  appsDir: string;
  outFile: string;
}): Promise<{ count: number; outFile: string }>;
