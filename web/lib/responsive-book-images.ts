import source from "../data/image-variants.json" with { type: "json" };

interface ImageVariantManifest {
  schemaVersion: number;
  widths: number[];
  images: Record<string, { version: string; width: number; height: number; widths: number[] }>;
}

const manifest = source as ImageVariantManifest;
const fixedWidths = new Set(manifest.widths);

/** Only registered, dimension-matched book images have prebuilt responsive files. */
export function getResponsiveBookImage(src: string, width: number, height: number): { src: string; srcSet?: string } {
  const match = /^\/books\/([a-zA-Z0-9_-]+)\.webp$/.exec(src);
  const image = manifest.images[src];
  if (manifest.schemaVersion !== 1 || !match || !image || image.width !== width || image.height !== height ||
      !/^[a-f0-9]{12}$/.test(image.version) || !Array.isArray(image.widths)) return { src };

  const widths = [...new Set(image.widths)]
    .filter((candidate) => Number.isInteger(candidate) && candidate > 0 && candidate < width && fixedWidths.has(candidate))
    .sort((first, second) => first - second);
  if (!widths.length) return { src };

  const candidates = widths.map((candidate) => `/books/responsive/${match[1]}-${image.version}-w${candidate}.webp ${candidate}w`);
  candidates.push(`${src} ${width}w`);
  return { src, srcSet: candidates.join(", ") };
}
