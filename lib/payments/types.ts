// Payment provider abstraction.
// Phase 1 ships the mock provider only. Stripe/QPay can be added later
// by implementing this interface and registering them in ./index.ts.

export type CreateChargeInput = {
  orderId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
};

export type ChargeResult = {
  providerRef: string;
  status: "PAID" | "PENDING" | "FAILED";
};

export interface PaymentProvider {
  name: string;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
}
