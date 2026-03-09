export default function TermsPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 10, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Acceptance of terms</h2>
          <p>
            By using DeepFocus Time website and extension, you agree to these terms and applicable platform policies.
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
            Premium access depends on active entitlement status and may change if subscription status changes.
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
          <h2 className="text-base font-semibold text-slate-900">5. Updates to terms</h2>
          <p>
            We may revise these terms when needed. Continued use after updates indicates acceptance of revised terms.
          </p>
        </section>
      </div>
    </article>
  );
}
