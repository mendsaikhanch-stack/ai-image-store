import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (configured) {
    case "mock":
      return mockProvider;
    // case "stripe":  return stripeProvider;  // TODO(payments)
    // case "qpay":    return qpayProvider;    // TODO(payments)
    default:
      return mockProvider;
  }
}

export type { PaymentProvider, ChargeResult, CreateChargeInput } from "./types";
