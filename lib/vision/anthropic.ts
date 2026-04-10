import type { VisionProvider, VisionInput, VisionSuggestion } from "./types";

// Claude vision provider — STUB.
//
// To enable:
//   1. npm install @anthropic-ai/sdk
//   2. set ANTHROPIC_API_KEY in .env
//   3. set VISION_PROVIDER=anthropic in .env
//   4. replace the body of suggest() with a real Claude call — use the
//      `claude-opus-4-6` or `claude-sonnet-4-6` model with a vision
//      message that takes imageBytes as base64 and asks for JSON:
//      { title, categorySlug, tags[], confidence }
//      The known category slugs from VisionInput.knownCategorySlugs
//      should be passed in the prompt so Claude picks one of them.
//
// Intentionally not importing the SDK so we don't force every install
// to pull it in. Heuristic provider remains the default.

export const anthropicVisionProvider: VisionProvider = {
  name: "anthropic",
  async suggest(_input: VisionInput): Promise<VisionSuggestion> {
    throw new Error(
      "anthropic vision provider is not configured. See lib/vision/anthropic.ts for setup.",
    );
  },
};
