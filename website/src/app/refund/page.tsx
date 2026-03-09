export default function RefundPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 10, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Eligibility</h2>
          <p>
            Refund requests are reviewed case by case for accidental charges, duplicate charges, or confirmed billing
            issues.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. How to request</h2>
          <p>
            Contact support@deepfocustime.com and include the purchase email, order reference, and a short description
            of the issue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Processing</h2>
          <p>
            Approved refunds are processed through the billing provider. Timelines may vary based on payment method and
            bank processing windows.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Subscription cancellation</h2>
          <p>
            Cancellation stops future renewals. Cancellation alone does not automatically create a refund for previous
            charges unless specifically approved.
          </p>
        </section>
      </div>
    </article>
  );
}
