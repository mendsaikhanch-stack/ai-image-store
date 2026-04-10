// Vision provider abstraction. Given an image + metadata, suggest a
// title, a category slug, and a list of tags. Confidence is 0-1.
//
// The MVP ships a "heuristic" provider that parses filenames and folder
// names — no API key required. A Claude or OpenAI implementation can be
// plugged in later by implementing this interface.

export type VisionInput = {
  filename: string;
  // Path relative to the upload root (e.g. "nature/sunsets/sunset.jpg")
  relativePath: string;
  // Known category slugs from the catalog — provider may match against these.
  knownCategorySlugs: string[];
  // Raw image bytes. Heuristic provider ignores them; AI providers will use them.
  imageBytes?: Buffer;
  mimeType?: string;
};

export type VisionSuggestion = {
  title: string;
  description: string;
  categorySlug: string | null;
  tags: string[];
  confidence: number; // 0-1
};

export interface VisionProvider {
  name: string;
  suggest(input: VisionInput): Promise<VisionSuggestion>;
}
