import { nanoid } from "nanoid";
import type { PaymentProvider } from "./types";

// Mock provider: always succeeds. Used for local MVP testing.
// Swap for Stripe/QPay by implementing PaymentProvider in a sibling file.
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createCharge({ orderId }) {
    return {
      providerRef: `mock_${orderId}_${nanoid(8)}`,
      status: "PAID",
    };
  },
};
