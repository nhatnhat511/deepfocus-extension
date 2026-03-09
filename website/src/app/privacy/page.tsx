export default function PrivacyPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 10, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Data we collect</h2>
          <p>
            We collect information needed to operate account access, entitlement status, support communication, and
            extension settings synchronization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. How we use data</h2>
          <p>
            Data is used to authenticate users, maintain account features, provide support, and improve reliability.
            We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Third-party services</h2>
          <p>
            We rely on trusted providers for hosting, authentication, and billing operations. We do not store full
            payment card details on DeepFocus Time infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Retention and security</h2>
          <p>
            We retain data only as long as required for service delivery, legal obligations, and support continuity.
            Reasonable technical safeguards are applied to protect user data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Your rights</h2>
          <p>
            You may request account assistance or data-related support by contacting support@deepfocustime.com. We
            review requests according to applicable regulations.
          </p>
        </section>
      </div>
    </article>
  );
}
