export default function TermsPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 9, 2026</p>

      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
        <p>
          By using DeepFocus Time, you agree to use the extension and website in compliance with applicable laws and
          platform policies.
        </p>
        <p>
          Premium features are offered as a subscription service. Access depends on successful payment confirmation and
          active entitlement status.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and any activity performed
          under your account.
        </p>
        <p>
          DeepFocus Time is provided on an as-is basis. While we aim for reliable service, we cannot guarantee
          uninterrupted availability at all times.
        </p>
        <p>
          We may update these terms when required. Continued use after updates constitutes acceptance of the revised
          terms.
        </p>
      </div>
    </article>
  );
}

