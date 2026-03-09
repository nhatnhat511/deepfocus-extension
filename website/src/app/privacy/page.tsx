export default function PrivacyPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 9, 2026</p>

      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
        <p>
          DeepFocus Time collects only the information required to provide account access, subscription status, and
          core timer functionality across the Chrome extension and website.
        </p>
        <p>
          Account authentication is handled through Supabase Auth. Billing events are processed through Paddle. We do
          not store full payment card details on our own servers.
        </p>
        <p>
          We may store configuration data such as timer preferences, premium status, and feature settings to keep your
          experience consistent across sessions and devices.
        </p>
        <p>
          We do not sell personal information. Data is shared only with essential service providers needed to deliver
          DeepFocus Time functionality, including authentication, infrastructure, and payment processing.
        </p>
        <p>
          You may contact us to request account assistance or data-related support at support@deepfocustime.com.
        </p>
      </div>
    </article>
  );
}

