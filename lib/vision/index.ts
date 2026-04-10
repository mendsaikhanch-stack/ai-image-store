import { heuristicProvider } from "./heuristic";
import { anthropicVisionProvider } from "./anthropic";
import type { VisionProvider } from "./types";

export function getVisionProvider(): VisionProvider {
  const configured = process.env.VISION_PROVIDER ?? "heuristic";
  switch (configured) {
    case "heuristic":
      return heuristicProvider;
    case "anthropic":
      return anthropicVisionProvider;
    default:
      return heuristicProvider;
  }
}

export type { VisionProvider, VisionInput, VisionSuggestion } from "./types";
