import type { VisionProvider, VisionInput, VisionSuggestion } from "./types";

// Filename / folder heuristic:
//
//   "nature/sunsets/golden_hour-01.jpg"
//     → title     "Golden Hour"
//     → category  "nature" (if matches a known category slug)
//     → tags      ["sunsets"]
//     → confidence 0.5 (category matched) or 0.3 (no match)
//
// Works offline with zero cost. Lossy but a solid default for bulk
// imports — the admin edits before approval anyway.

export const heuristicProvider: VisionProvider = {
  name: "heuristic",
  async suggest(input: VisionInput): Promise<VisionSuggestion> {
    const segments = input.relativePath
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean);

    // Title is derived from the last segment, minus extension.
    const last = segments[segments.length - 1] ?? input.filename;
    const base = stripExtension(last);
    const title = titleCase(normalize(base).replace(/\s*\d+\s*$/, "").trim());

    // Category guess: first segment that matches a known category slug.
    const knownSet = new Set(input.knownCategorySlugs);
    let categorySlug: string | null = null;
    for (const seg of segments.slice(0, -1)) {
      const slug = slugify(seg);
      if (knownSet.has(slug)) {
        categorySlug = slug;
        break;
      }
    }

    // Tag guess: all intermediate path segments that weren't used as
    // the category, plus tokens from the filename base.
    const tagSet = new Set<string>();
    for (const seg of segments.slice(0, -1)) {
      const slug = slugify(seg);
      if (slug && slug !== categorySlug) tagSet.add(slug);
    }
    for (const token of normalize(base).split(/\s+/)) {
      const t = slugify(token);
      if (t && t.length > 2) tagSet.add(t);
    }

    const tags = Array.from(tagSet).slice(0, 8);

    // Confidence: 0.5 if we matched a known category, 0.3 otherwise.
    const confidence = categorySlug ? 0.5 : 0.3;

    // Short placeholder description — admin will rewrite before publishing.
    const descSubject = categorySlug ?? "imagery";
    const tagClause = tags.length > 0 ? ` Featuring ${tags.slice(0, 3).join(", ")}.` : "";
    const description = `A curated pack of AI-generated ${descSubject}: ${title || "untitled"}.${tagClause}`;

    return {
      title: title || "Untitled",
      description,
      categorySlug,
      tags,
      confidence,
    };
  },
};

function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, "");
}

function normalize(s: string): string {
  return s.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
