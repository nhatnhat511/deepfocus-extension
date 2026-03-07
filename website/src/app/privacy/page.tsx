export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p>Effective date: March 7, 2026</p>
      <p>
        DeepFocus Time collects the minimum data needed to provide authentication, subscription status, and extension settings.
      </p>
      <h2 className="text-xl font-semibold text-slate-900">What We Collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account email and authentication identifiers</li>
        <li>Extension settings you save</li>
        <li>Subscription plan metadata for premium access</li>
      </ul>
      <h2 className="text-xl font-semibold text-slate-900">How We Use Data</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Provide core extension functionality</li>
        <li>Enable account login and premium entitlement checks</li>
        <li>Respond to support and account requests</li>
      </ul>
      <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
      <p>For privacy requests, contact: support@deepfocustime.com</p>
    </article>
  );
}
