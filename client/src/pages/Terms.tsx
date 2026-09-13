import { LegalPage } from '@/components/LegalPage';

export function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="August 17, 2026">
      <p>
        These Terms of Service govern access to and use of SalesPilot AI. This is a template for operators deploying
        SalesPilot AI and should be reviewed by counsel before publishing for a live product.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity
        under your account. Organizations are responsible for the conduct of their invited members.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use the platform to store or process data you do not have the right to hold.</li>
        <li>Do not attempt to access another organization&apos;s data or circumvent access controls.</li>
        <li>Do not use AI features to generate content that is illegal, deceptive, or infringing.</li>
      </ul>

      <h2>Subscriptions and billing</h2>
      <p>
        Paid plans are billed according to the plan and seat count selected at checkout. Plan limits (seats, AI
        request quotas) are enforced as described in your plan. You may change or cancel your plan at any time from
        Settings → Billing.
      </p>

      <h2>AI features</h2>
      <p>
        AI-generated content (lead scores, email drafts, summaries, forecasts) is provided for assistance and should
        be reviewed before being relied upon for business decisions. We do not guarantee the accuracy of AI-generated
        output.
      </p>

      <h2>Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. AI features degrade to a demo mode
        rather than causing an outage if the configured AI provider is unavailable.
      </p>

      <h2>Termination</h2>
      <p>
        You may close your account at any time. We may suspend accounts that violate these terms or applicable law.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to your organization&apos;s designated legal contact.</p>
    </LegalPage>
  );
}
