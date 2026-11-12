// Category and product images. /img/ph/* are real photos (our own project photos plus free-licence
// stock, see scripts/photos/SOURCES.md), 800x600 WebP with the K Plus mark. /img/cat and /img/p are the
// original illustrations from scripts/art/gen.py, kept where no real photo exists yet.
import art from "./art.json";

const A = art as { cat: Record<string, string>; prod: Record<string, (string | null)[]> };

/** Category image; admin-uploaded images always win where callers check them first. */
export const catArt = (slug: string): string | undefined => A.cat[slug];

/** Image for the i-th default product of a category, falling back to the category image. */
export const prodArt = (slug: string, i: number): string | undefined => A.prod[slug]?.[i] ?? A.cat[slug];
