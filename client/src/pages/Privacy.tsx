import { LegalPage } from '@/components/LegalPage';

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="August 17, 2026">
      <p>
        This Privacy Policy describes how SalesPilot AI (&quot;we&quot;, &quot;our&quot;) collects, uses, and protects information when
        you use our CRM platform. This is a template for operators deploying SalesPilot AI and should be reviewed by
        counsel before publishing for a live product.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information: name, email address, and password (stored as a salted hash, never in plain text).</li>
        <li>Organization data: company name, industry, and any CRM records you create (leads, contacts, companies, deals, tasks, and notes).</li>
        <li>Usage data: audit logs of actions taken within the platform, for security and support purposes.</li>
        <li>AI interaction data: prompts and responses when you use AI features, sent to your configured AI provider (OpenAI, Anthropic, or Google) if one is enabled.</li>
      </ul>

      <h2>How we use information</h2>
      <p>
        Information is used to operate the CRM, provide AI-assisted features, secure your account, and communicate
        service-related updates. We do not sell customer data to third parties.
      </p>

      <h2>Data isolation</h2>
      <p>
        Every organization&apos;s data is isolated at the database level. Users from one organization cannot access
        another organization&apos;s records.
      </p>

      <h2>Third-party processors</h2>
      <p>
        Depending on configuration, data may be processed by: your chosen AI provider (for AI features only), your
        chosen storage provider (for uploaded files), your chosen email provider (for transactional email), and your
        chosen payment processor (for billing).
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        Records are retained until you delete them or close your account. Deleted CRM records are soft-deleted and
        may be retained briefly for recovery purposes before permanent removal.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to your organization&apos;s designated privacy contact.</p>
    </LegalPage>
  );
}
