import credits from "@/data/image-credits.json";

/**
 * Photos the shop did not take itself, and the credit their licence asks for.
 * Keyed by the image path as it appears in a product's `images`. Openly
 * licensed photos (Creative Commons, public domain) come from Wikimedia
 * Commons; CC BY and CC BY-SA require the author, the licence and a link to
 * be shown wherever the photo is, which the product page does.
 */
export type ImageCredit = {
  /** The file's title on its source site. */
  title: string;
  author: string;
  /** e.g. "CC BY-SA 4.0", "CC0", "Public domain". */
  license: string;
  licenseUrl: string | null;
  /** The file's page on its source site. */
  source: string;
};

const CREDITS = credits as Record<string, ImageCredit>;

export function creditFor(src: string): ImageCredit | null {
  return CREDITS[src] ?? null;
}

/** Credits for a product's photos, in the same order; null where none is needed. */
export function creditsFor(images: string[]): (ImageCredit | null)[] {
  return images.map(creditFor);
}
