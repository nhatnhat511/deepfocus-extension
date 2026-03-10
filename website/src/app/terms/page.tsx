export default function TermsPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 10, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Acceptance of terms</h2>
          <p>
            By accessing or using the DeepFocus Time website or Chrome extension, you agree to these Terms of Service
            and applicable platform policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. Account responsibilities</h2>
          <p>
            You are responsible for account credentials, activity under your account, and providing accurate
            information when contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Subscription access</h2>
          <p>
            Premium access depends on an active entitlement status and may change if subscription status changes or is
            canceled. Subscriptions renew automatically unless canceled.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Service availability</h2>
          <p>
            We aim for stable service but cannot guarantee uninterrupted availability. Maintenance and infrastructure
            issues may occasionally impact access.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Acceptable use</h2>
          <p>
            You agree not to misuse the service, interfere with our infrastructure, attempt unauthorized access, or use
            the service in violation of applicable laws or third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Updates to terms</h2>
          <p>
            We may revise these terms when needed. Continued use after updates indicates acceptance of revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Contact</h2>
          <p>Questions about these terms can be sent to support@deepfocustime.com.</p>
        </section>
      </div>
    </article>
  );
}
