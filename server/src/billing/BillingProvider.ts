export interface CheckoutSessionParams {
  organizationId: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  successUrl: string;
  cancelUrl: string;
}

export interface BillingProvider {
  readonly name: string;
  /** Returns a URL the client redirects to for checkout. */
  createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string }>;
  /** Verifies and parses an inbound webhook payload into a normalized event. */
  parseWebhook(rawBody: string, signature: string): Promise<{ type: string; organizationId: string; data: unknown }>;
}

export class BillingNotConfiguredError extends Error {
  constructor(message = 'No billing provider is configured for this organization.') {
    super(message);
    this.name = 'BillingNotConfiguredError';
  }
}
