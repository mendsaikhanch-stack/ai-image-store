// Watermark provider abstraction.
//
// Invisible buyer fingerprinting happens at DOWNLOAD time, not at
// import time — the same source file is served to every buyer, but
// each download stream is fingerprinted with the buyer's order id.
//
// This file exists so the rest of the codebase can type against a
// stable interface today. The actual implementation (e.g. stego
// embedding, LSB injection, or a commercial library) lands later.

export type WatermarkInput = {
  sourceBytes: Buffer;
  // The download-time identity: typically `${userId}:${orderId}:${productId}`.
  fingerprint: string;
  mimeType: string;
};

export interface WatermarkProvider {
  name: string;
  // Returns transformed bytes with an invisible mark embedded.
  embed(input: WatermarkInput): Promise<Buffer>;
}

// Default no-op: ships the file unchanged. Safe to use everywhere
// until a real provider is swapped in.
export const noopWatermark: WatermarkProvider = {
  name: "noop",
  async embed(input) {
    return input.sourceBytes;
  },
};
