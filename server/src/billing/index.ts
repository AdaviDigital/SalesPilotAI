import { env } from '../config/env';
import type {
  BillingProvider,
  CheckoutSessionParams,
} from './BillingProvider';
import { BillingNotConfiguredError } from './BillingProvider';

/**
 * These providers establish the integration surface without coupling
 * core business logic to a specific payment processor.
 *
 * The real SDK/API implementations can be wired into these classes later.
 */

class StripeProvider implements BillingProvider {
  readonly name = 'stripe';

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<{ url: string }> {
    if (!env.STRIPE_SECRET_KEY) {
      throw new BillingNotConfiguredError();
    }

    // The Stripe integration is intentionally not implemented yet.
    void params;

    throw new Error(
      'Stripe checkout not yet wired — add the Stripe SDK call here using STRIPE_SECRET_KEY.',
    );
  }

  async parseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{
    type: string;
    organizationId: string;
    data: unknown;
  }> {
    // Parameters will be used when Stripe webhook verification is implemented.
    void rawBody;
    void signature;

    throw new Error('Stripe webhook parsing not yet wired.');
  }
}

class PaystackProvider implements BillingProvider {
  readonly name = 'paystack';

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<{ url: string }> {
    if (!env.PAYSTACK_SECRET_KEY) {
      throw new BillingNotConfiguredError();
    }

    // The Paystack integration is intentionally not implemented yet.
    void params;

    throw new Error(
      'Paystack checkout not yet wired — add the Paystack API call here using PAYSTACK_SECRET_KEY.',
    );
  }

  async parseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{
    type: string;
    organizationId: string;
    data: unknown;
  }> {
    // Parameters will be used when Paystack webhook verification is implemented.
    void rawBody;
    void signature;

    throw new Error('Paystack webhook parsing not yet wired.');
  }
}

class FlutterwaveProvider implements BillingProvider {
  readonly name = 'flutterwave';

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<{ url: string }> {
    if (!env.FLUTTERWAVE_SECRET_KEY) {
      throw new BillingNotConfiguredError();
    }

    // The Flutterwave integration is intentionally not implemented yet.
    void params;

    throw new Error(
      'Flutterwave checkout not yet wired — add the Flutterwave API call here using FLUTTERWAVE_SECRET_KEY.',
    );
  }

  async parseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{
    type: string;
    organizationId: string;
    data: unknown;
  }> {
    // Parameters will be used when Flutterwave webhook verification is implemented.
    void rawBody;
    void signature;

    throw new Error('Flutterwave webhook parsing not yet wired.');
  }
}

class NoBillingProvider implements BillingProvider {
  readonly name = 'none';

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<{ url: string }> {
    void params;

    throw new BillingNotConfiguredError();
  }

  async parseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{
    type: string;
    organizationId: string;
    data: unknown;
  }> {
    void rawBody;
    void signature;

    throw new BillingNotConfiguredError();
  }
}

let cached: BillingProvider | null = null;

export function getBillingProvider(): BillingProvider {
  if (cached !== null) {
    return cached;
  }

  let provider: BillingProvider;

  switch (env.BILLING_PROVIDER) {
    case 'stripe':
      provider = new StripeProvider();
      break;

    case 'paystack':
      provider = new PaystackProvider();
      break;

    case 'flutterwave':
      provider = new FlutterwaveProvider();
      break;

    default:
      provider = new NoBillingProvider();
      break;
  }

  cached = provider;

  return provider;
}

export * from './BillingProvider';